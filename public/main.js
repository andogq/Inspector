// Constants
const melbCoords = [144.9631, -37.8136];
const vicBounds = [[140.9553,-39.2516],[150.0849,-33.9732]];
const mapboxToken = "pk.eyJ1IjoiYW5kb2dxIiwiYSI6ImNrOTBvemU3ZDA0NHIzZnJpdHZ6c21ubWgifQ.bnBBzM9gS46EbEyK1GdoxQ";
const rounding = 3;

// Globals
let map, controller, menu;
let stops = [];
let loadedCoords = [];

function init() {
    // Other init functions
    initController();
    initMap();
    menu = new Menu();

    // Add event listeners
    controller.click("recenter", {callback: centerOnUser, state: "map"});    
}

function initMap() {
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
        loadStops();
    
        // Center on the user and load nearby stops
        centerOnUser();
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
            mousemove: "map",
            click: "recenter"
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
}

init();