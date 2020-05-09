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
        report: d("button_report"),
        recenter: d("button_recenter"),
        account: d("button_account"),
        data: d("button_data"),
        history: d("button_history"),
        help: d("button_help"),
        submitReport: d("button_submitReport"),
        login: d("button_login"),
        verify: d("button_verify")
    },
    menu: {
        el: d("menu"),
        container: d("menu_container"),
        tab: d("menu_tab")
    },
    page: {
        report: d("page_report"),
        account: d("page_account"),
        login: d("page_login")
    },
    input: {
        report: {
            amount: d("input_report_amount"),
            location: d("input_report_location"),
            time: d("input_report_time")
        },
        login: {
            phone: d("input_login_phone"),
            code: d("input_login_code")
        },
        search: d("input_search")
    },
    search: {
        container: d("search_container"),
        back: d("search_back"),
        suggestions: d("search_suggestions")
    },
    login: {
        back: d("login_back")
    },
    notification: {
        el: d("notification"),
        icon: d("notification_icon"),
        text: d("notification_text")
    },
    map: d("map"),
    centerPoint: d("centerPoint"),
    loader: d("loader"),
    pointMenu: d("pointMenu")
}

// Globals
let g = {};

function init() {
    let loadId = load.start();

    g.menu = new Menu();

    // Other init functions
    initElements();
    addListeners();
    
    initMap().then(() => load.stop(loadId));

    // ! REMOVE, ONLY FOR TESTING
    firebase.auth().settings.appVerificationDisabledForTesting = true;

    firebase.auth().onAuthStateChanged((user) => {
        g.loggedIn = user != undefined;
    });
}

function addListeners() {
    dom.map.addEventListener("touchstart", () => {
        document.body.setAttribute("state", "map");
    });
    dom.centerPoint.addEventListener("click", () => {
        document.body.setAttribute("state", "menu");
    });
    dom.button.report.addEventListener("click", () => {
        if (g.loggedIn) {
            // User is logged in
            document.body.setAttribute("state", "page");
            dom.menu.container.setAttribute("state", "report");
        } else document.body.setAttribute("state", "login");
    });

    // Recenter button
    dom.button.recenter.addEventListener("click", () => {
        centerOnUser();
        updateHeatmap();
        document.body.setAttribute("state", "map");
    });

    dom.button.submitReport.addEventListener("click", sendReport);

    // Button listeners
    dom.button.login.addEventListener("click", login);
    dom.button.verify.addEventListener("click", verifyCode);

    // Fullscreen window for search
    dom.input.report.location.addEventListener("click", () => search.show(locationSearch));
    // Validation for report inputs
    dom.input.report.amount.addEventListener("click", validateInput);
    dom.input.report.location.addEventListener("blur", validateInput);
    dom.input.report.time.addEventListener("blur", validateInput);

    dom.login.back.addEventListener("click", () => {
        document.body.setAttribute("state", "map");
    });
    dom.search.back.addEventListener("click", () => {
        dom.search.container.remove("state");
    });

    dom.input.search.addEventListener("keyup", () => search.update());
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

// Helper functions
const load = {
    start() {
        dom.loader.setAttribute("state", "show");

        this.lastLoad = Date.now();
        return this.lastLoad;
    },
    stop(loadId = 0) {
        // Ensure only the last caller can stop it loading
        if (loadId == this.lastLoad) {
            dom.loader.removeAttribute("state");
        }
    }
}

const notification = {
    set(text, icon = "error") {
        dom.notification.icon.innerText = icon;
        dom.notification.text.innerText = text;
        dom.notification.el.setAttribute("state", "show");

        this.lastNotification = Date.now();

        setTimeout(this.hide.bind(this), c.notification.timeout, this.lastNotification);
        return this.lastNotification;
    },
    hide(notificationId = 0) {
        // Only hide the notification if it was the last one called
        if (notificationId == this.lastNotification) {
            dom.notification.el.removeAttribute("state");
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