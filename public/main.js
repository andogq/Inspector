// Constants
const melbCoords = [144.9631, -37.8136];
const vicBounds = [[140.9553,-39.2516],[150.0849,-33.9732]];
const mapboxToken = "pk.eyJ1IjoiYW5kb2dxIiwiYSI6ImNrOTBvemU3ZDA0NHIzZnJpdHZ6c21ubWgifQ.bnBBzM9gS46EbEyK1GdoxQ";
const rounding = 3;
const nearbyOffset = 0.001;
const heatmapUpdateInterval = 5;

const colors = {
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

// Globals
let map, controller, menu;
let stops = [];
let loadedCoords = [];

function init() {
    startLoad();

    // Other init functions
    initController();
    initElements();
    menu = new Menu();
    
    // Add event listeners
    controller.click("recenter", {callback: () => {
        centerOnUser();
        updateHeatmap();
    }, state: "map"});
    controller.click("location", {callback: locationInput});
    controller.listen([...document.getElementsByTagName("input")], "blur", {callback: validateInput});
    controller.click("amount", {callback: validateInput});
    controller.click("submit", {callback: sendReport});
    
    initMap().then(stopLoad);
}

function initMap() {
    return new Promise((resolve) => {
        // Initialise Mapbox
        mapboxgl.accessToken = mapboxToken;
        map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/light-v10",
            center: melbCoords,
            zoom: 10,
            maxBounds: vicBounds
        });
    
        map.on("load", () => {
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
    controller = new Controller();
    // Map state, for when the user is only on the map
    controller.addState("map", [
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
            menu.hide();
        }
    });
    // Menu state, when the menu is peeking and the point menu is showing
    controller.addState("menu", [
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
            menu.show();
        }
    });

    // States for the pages
    controller.addState("reportPage", ["menu",
        {
            target: "reportPage",
            add: "show"
        }
    ], {
        trigger: {click: "report"},
        callback: function() {
            menu.moveTo(1);
        }
    });
    controller.addState("accountPage", ["menu",
        {
            target: "accountPage",
            add: "show"
        }
    ], {
        trigger: {click: "account"},
        callback: function() {
            menu.moveTo(1);
        }
    });
    controller.addState("loginPage", ["map", 
        {
            target: "loginPage",
            remove: "hidden"
        }
    ], {
        callback: function() {
            menu.hide();
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
    let notification = controller.e("notification");
    notification.children[0].innerHTML = icon;
    notification.children[1].innerHTML = text;

    notification.classList.remove("hidden");
}
function hideNotification() {
    controller.e("notification").classList.add("hidden");
}

init();