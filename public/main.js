let melbCoords = new Coord(144.9631, -37.8136);

let map = new Map({
    id: "map",
    center: melbCoords,
    zoom: 10,
    showZoom: false
});
let heatmap = new Heatmap(map);
let network = new Network(map, "red", 1);

function getCenter() {
    return ol.proj.toLonLat(map.view.getCenter());
}

let geo = new ol.Geolocation({
    tracking: true,
    trackingOptions: {
        enableHighAccuracy: true
    },
    projection: map.view.getProjection()
});

geo.on("change", () => {
    map.view.animate({
        center: geo.getPosition(),
        zoom: 15,
        rotation: 0
    }, 1);
});

let ui = new UI({
    states: {
        map: 0,
        pointMenu: 1,
        pullUpMenuDrag: 2,
        pullUpMenuExtended: 3
    },
    stateClasses: [
        { // Map
            pointMenu: "hidden"
        },
        { // Point menu
            map: "faded",
            pullUpMenu: "peek"
        },
        { // Pull up menu drag
            map: "faded",
            pullUpMenu: "drag"
        },
        { // Pull up menu extended
            map: "faded",
            pullUpMenu: "pop"
        }
    ]
});

ui.addListener({el: "centerPoint", event: "touchstart", callback: () => {
    ui.state = ui.states.pointMenu;
}});

ui.addListener({el: "map", event: "touchstart", callback: () => {
    ui.state = ui.states.map;
}});

ui.addListener({el: "report", event: "touchstart", callback: () => {
    ui.state = ui.states.pullUpMenuExtended;
}});

ui.addListener({el: "amount", event: "touchstart", callback: (e) => {
    let selected = ui.el("amount").getElementsByClassName("selected");
    if (selected.length > 0) selected[0].classList.remove("selected");
    if (e.path[0] != ui.el("amount")) e.path[0].classList.add("selected");
}});

// Holds all the functions and variables for the menu
let menu = {
    minTop: 0.3, // Also defined in pullUpMenu.css
    threshold: 0.65,

    init: function() {
        ui.addListener({el: "pullUpMenu", event: "touchstart", callback: this.touchStart.bind(this)});
        ui.addListener({el: "pullUpMenu", event: "touchmove", callback: this.touchMove.bind(this)});
        ui.addListener({el: "pullUpMenu", event: ["touchend", "touchcancel"], callback: this.touchEnd.bind(this)});
    },

    touchStart: function(e) {
        this.y0 = e.changedTouches[0].clientY;
        this.menuStart = this.getMenuTop();
    },
    touchMove: function(e) {
        let y = e.changedTouches[0].clientY;
        let dy = y - this.y0;

        if (ui.state != ui.states.pullUpMenuDrag && Math.abs(dy) > 10) ui.state = ui.states.pullUpMenuDrag;

        // Recheck because it may change
        if (ui.state == ui.states.pullUpMenuDrag) {
            ui.el("pullUpMenu").style.top = (this.menuStart + dy) + "px";
        }
    },
    touchEnd: function(e) {
        // Current top of the menu
        let menuTop = this.getMenuTop();

        // If the top of the menu is above the threshold
        if (menuTop < this.threshold * document.body.clientHeight) {
            // Spring open
            ui.state = ui.states.pullUpMenuExtended;

            //* Set a custom top on the element if the user has dragged it up
            // Minimum for menuTop
            let minTopPx = this.minTop * document.body.clientHeight;
            // Set to the smallest (closest to the top)
            ui.el("pullUpMenu").style.top = menuTop > minTopPx ? "" : menuTop + "px";
        } else {
            // Snap shut, remove any styling put in by the class
            ui.el("pullUpMenu").style.top = ""
            ui.state = ui.states.pointMenu;
        }
    },

    getMenuTop() {
        return Number(window.getComputedStyle(ui.el("pullUpMenu")).top.replace("px", ""));
    }
}
menu.init();

// ui.state = 3;

// let data;
// let xhr = new XMLHttpRequest();
// xhr.onload = () => {
//     data = JSON.parse(xhr.responseText);

//     data.forEach((line) => {
//         network.addLine(line.map(p => new Coord(...p)));
//     });
// }
// xhr.open("GET", "/data.json");
// xhr.send();