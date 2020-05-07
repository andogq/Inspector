// Constants
const c = {
    coords: {
        melbource: [144.9631, -37.8136],
        victoria: [[140.9553,-39.2516],[150.0849,-33.9732]],
    },
    map: {
        token: "pk.eyJ1IjoiYW5kb2dxIiwiYSI6ImNrOTBvemU3ZDA0NHIzZnJpdHZ6c21ubWgifQ.bnBBzM9gS46EbEyK1GdoxQ",
        nearbyRadius: 0.001,
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

// Globals
let g = {};

function init() {
    let loadId = load.start();

    // Other init functions
    initController();
    initElements();
    g.menu = new Menu();
    
    // Add event listeners
    g.controller.click("recenter", {callback: () => {
        centerOnUser();
        updateHeatmap();
    }, state: "map"});
    g.controller.click("location", {callback: locationInput});
    g.controller.listen([...document.getElementsByTagName("input")], "blur", {callback: validateInput});
    g.controller.click("amount", {callback: validateInput});
    g.controller.click("submit", {callback: sendReport});
    g.controller.click("login", {callback: login});
    g.controller.click("report", {callback: () => {
        if (g.loggedIn) {
            g.controller.state = "reportPage";
            g.menu.moveTo(1);
        } else g.controller.state = "loginPage";
    }});
    g.controller.e("verify").addEventListener("click", verifyCode);
    
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
        document.getElementById("loader").classList.add("loading");

        this.lastLoad = Date.now();
        return this.lastLoad;
    },
    stop(loadId = 0) {
        // Ensure only the last caller can stop it loading
        if (loadId == this.lastLoad) {
            document.getElementById("loader").classList.remove("loading");
        }
    }
}

const notification = {
    set(text, icon = "error") {
        let el = document.getElementById("notification");

        el.children[0].innerText = icon;
        el.children[1].innerText = text;
        el.classList.remove("hidden");

        this.lastNotification = Date.now();

        setTimeout(this.hide.bind(this), c.notification.timeout, this.lastNotification);
        return this.lastNotification;
    },
    hide(notificationId = 0) {
        // Only hide the notification if it was the last one called
        if (notificationId == this.lastNotification) {
            document.getElementById("notification").classList.add("hidden");
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