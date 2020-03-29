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
        pullUpMenuPopped: 3,
        pullUpMenuExtended: 4
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
        { // Pull up menu popped
            map: "faded",
            pullUpMenu: "pop"
        },
        { // Pull up menu extended
            map: "faded",
            pullUpMenu: "extended"
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
    ui.state = ui.states.pullUpMenuPopped;
}});

ui.addListener({el: "amount", event: "touchstart", callback: (e) => {
    let selected = ui.el("amount").getElementsByClassName("selected");
    if (selected.length > 0) selected[0].classList.remove("selected");
    if (e.path[0] != ui.el("amount")) e.path[0].classList.add("selected");
}});

// Holds all the functions and variables for the menu
let menu = {
    popped: 0.3, // Also defined in pullUpMenu.css
    padding: 0.1,

    moving: false,

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

        let container = ui.el("pullUpMenuContainer");
        let scrollTop = container.scrollTop <= 0;
        let scrollBottom = container.scrollTop + container.clientHeight >= container.scrollHeight;
        let onButtonTab = e.path[0] == ui.el("buttonTab") || e.path[1] == ui.el("buttonTab");

        if (!this.moving && Math.abs(dy) > 10) this.moving = true;

        if (this.moving && (onButtonTab || scrollTop || scrollBottom)) {
            let newTop = this.menuStart + dy;

            if (newTop < this.padding * document.body.clientHeight) {
                ui.state = ui.states.pullUpMenuExtended;
                newTop = "";
            } else if (newTop > (this.popped - this.padding) * document.body.clientHeight && newTop < (this.popped + this.padding) * document.body.clientHeight) {
                ui.state = ui.states.pullUpMenuPopped;
                newTop = "";
            } else if (newTop > (1 - (this.padding * 2)) * document.body.clientHeight) {
                ui.state = ui.states.pointMenu;
                newTop = "";
            } else {
                ui.state = ui.states.pullUpMenuDrag;
                newTop += "px";
            }
            
            ui.el("pullUpMenu").style.top = newTop;
        }
    },
    touchEnd: function(e) {
        this.moving = false;

        let top = Number(ui.el("pullUpMenu").style.top.replace("px", ""));

        if (top < (1 - (this.padding * 2)) * document.body.clientHeight && top > (this.popped + this.padding) * document.body.clientHeight) {
            ui.el("pullUpMenu").style.top = "";
            ui.state = ui.states.pointMenu;
        } else if (top < (this.popped - this.padding) * document.body.clientHeight && top > this.padding * document.body.clientHeight) {
            ui.el("pullUpMenu").style.top = "";
            ui.state = ui.states.pullUpMenuExtended;
        }
    },

    getMenuTop() {
        return Number(window.getComputedStyle(ui.el("pullUpMenu")).top.replace("px", ""));
    }
}
menu.init();

ui.state = 3;

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