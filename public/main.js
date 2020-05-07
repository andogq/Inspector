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
    }
}

// Globals
let g = {};

function init() {
    startLoad();

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
    
    initMap().then(stopLoad);

    // ! REMOVE, ONLY FOR TESTING
    firebase.auth().settings.appVerificationDisabledForTesting = true;
    // Setup the recaptcha
    g.recaptchaVerifier = new firebase.auth.RecaptchaVerifier("login");

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

function startLoad() {
    document.getElementById("loader").classList.add("loading");
}
function stopLoad() {
    document.getElementById("loader").classList.remove("loading");
}

function setNotification(text, icon) {
    let notification = g.controller.e("notification");
    notification.children[0].innerHTML = icon;
    notification.children[1].innerHTML = text;

    notification.classList.remove("hidden");
}
function hideNotification() {
    g.controller.e("notification").classList.add("hidden");
}

init();