// Constants
const c = {
    coords: {
        melbource: [144.9631, -37.8136],
        victoria: [[140.9553,-39.2516],[150.0849,-33.9732]],
    },
    map: {
        token: "pk.eyJ1IjoiYW5kb2dxIiwiYSI6ImNrOTBvemU3ZDA0NHIzZnJpdHZ6c21ubWgifQ.bnBBzM9gS46EbEyK1GdoxQ",
        nearbyRadius: 0.0015,
        updateInterval: 5,
        animationDuration: 1000
    },
    colors: {
        bus_metro: "#d66540",
        bus_night: "#d66540",
        bus_regional: "#d66540",
        bus_sky: "#e74c3c",
        bus_tele: "#d66540",
        coach_regional: "#8e44ad",
        interstate: "#8e44ad",
        train_metro: "#2980b9",
        train_regional: "#8e44ad",
        tram_metro: "#27ae60"
    },
    notification: {
        timeout: 5000
    }
}

// DOM elements
function d(id) {
    return document.getElementById(id);
}
const dom = {
    button: {
        report: d("report"),
        recenter: d("recenter"),
        account: d("account"),
        data: d("data"),
        history: d("history"),
        help: d("help"),
        reportSubmit: d("submit"),
        login: d("login"),
        verify: d("verify")
    },
    pullUp: {
        menu: d("pullUpMenu"),
        container: d("pullUpMenuContainer")
    },
    page: {
        report: d("reportPage"),
        account: d("accountPage"),
        login: d("loginPage")
    },
    input: {
        report: {
            amount: d("amount"),
            location: d("location"),
            time: d("time")
        },
        login: {
            phoneNumber: d("phoneNumber"),
            code: d("verificationCode")
        },
        fullScreen: d("fullScreenText")
    },
    fullScreen: {
        el: d("fullScreenInput"),
        back: d("fullScreenBack"),
        suggestions: d("fullScreenSuggestions")
    },
    login: {
        back: d("loginBack")
    },
    notification: {
        el: d("notification"),
        icon: d("notificationIcon"),
        text: d("notificationText")
    },
    loader: d("loader"),
    pointMenu: d("pointMenu")
}

// Globals
let g = {};

function init() {
    let loadId = load.start();

    // Other init functions
    initController();
    initElements();
    g.menu = new Menu();
    
    // Add event listeners
    // Recenter button
    dom.button.recenter.addEventListener("click", () => {
        centerOnUser();
        updateHeatmap();
        g.controller.state = "map";
    });
    // Fullscreen window for location search
    dom.input.report.location.addEventListener("click", locationInput);
    // Validation for report inputs
    dom.input.report.amount.addEventListener("click", validateInput);
    dom.input.report.location.addEventListener("blur", validateInput);
    dom.input.report.time.addEventListener("blur", validateInput);
    // Send report listener
    dom.button.reportSubmit.addEventListener("click", sendReport);
    // Report button listener
    dom.button.report.addEventListener("click", () => {
        if (g.loggedIn) {
            g.controller.state = "reportPage";
            g.menu.moveTo(1);
        } else g.controller.state = "loginPage";
    });
    // Login listener
    dom.button.login.addEventListener("click", login);
    // Verify code listener
    dom.button.verify.addEventListener("click", verifyCode);
    
    initMap().then(() => load.stop(loadId));

    // ! REMOVE, ONLY FOR TESTING
    firebase.auth().settings.appVerificationDisabledForTesting = true;

    firebase.auth().onAuthStateChanged((user) => {
        if (user) g.loggedIn = true;
        else g.loggedIn = false
    });
}

function initMap() {
    return new Promise((resolve) => {
        // Initialise Mapbox
        mapboxgl.accessToken = c.map.token;
        g.map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/light-v10",
            center: c.coords.melbource,
            zoom: 10,
            maxBounds: c.coords.victoria
        });

        g.map.on("load", () => {
            let promises = [];

            promises.push(loadHeatmap());
            promises.push(loadStops());
            promises.push(centerOnUser());

            Promise.all(promises).then(resolve);
        });
    });
}

function initController() {
    // Initialise controller
    g.controller = new Controller();
    // Map state, for when the user is only on the map
    g.controller.addState("map", [
        {
            target: "pointMenu",
            add: "hidden"
        },
        {
            target: "map",
            remove: "faded"
        }
    ], {
        trigger: {
            touchstart: "map",
            click: ["recenter", "loginBack"]
        },
        callback: function() {
            g.menu.hide();
        }
    });
    // Menu state, when the menu is peeking and the point menu is showing
    g.controller.addState("menu", [
        {
            target: "pointMenu",
            remove: "hidden"
        },
        {
            target: "map",
            add: "faded"
        }
    ], {
        trigger: {click: "centerPoint"},
        callback: function() {
            g.menu.show();
        }
    });

    // States for the pages
    g.controller.addState("reportPage", ["menu",
        {
            target: "reportPage",
            add: "show"
        }
    ], {
        callback: function() {
            g.menu.moveTo(1);
        }
    });
    g.controller.addState("accountPage", ["menu",
        {
            target: "accountPage",
            add: "show"
        }
    ], {
        trigger: {click: "account"},
        callback: function() {
            g.menu.moveTo(1);
        }
    });
    g.controller.addState("loginPage", ["map", 
        {
            target: "loginPage",
            remove: "hidden"
        }
    ], {
        callback: function() {
            g.menu.hide();
        }
    });
}

// Helper functions
const load = {
    start() {
        dom.loader.classList.add("loading");

        this.lastLoad = Date.now();
        return this.lastLoad;
    },
    stop(loadId = 0) {
        // Ensure only the last caller can stop it loading
        if (loadId == this.lastLoad) {
            dom.loader.classList.remove("loading");
        }
    }
}

const notification = {
    set(text, icon = "error") {
        dom.notification.icon.innerText = icon;
        dom.notification.text.innerText = text;
        dom.notification.el.classList.remove("hidden");

        this.lastNotification = Date.now();

        setTimeout(this.hide.bind(this), c.notification.timeout, this.lastNotification);
        return this.lastNotification;
    },
    hide(notificationId = 0) {
        // Only hide the notification if it was the last one called
        if (notificationId == this.lastNotification) {
            dom.notification.el.classList.add("hidden");
        }
    }
}

function request({method = "GET", url, data}) {
    let loadId = load.start();
    return new Promise((resolve, reject) => {
        if (!url) reject();
        else {

            let xhr = new XMLHttpRequest();

            xhr.onload = () => {
                if (xhr.status == 200) {
                    let response = xhr.responseText;

                    try {
                        response = JSON.parse(response);
                    } finally {
                        resolve (response);
                    }
                } else reject();
            }
            xhr.onerror = reject;

            xhr.open(method, url);
            if (typeof(data) == "object") data = JSON.stringify(data);
            xhr.send(data); 
        }
    }).finally(() => load.stop(loadId));
}

init();