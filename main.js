let map = new Map("map", new Coord(144.9631,-37.8136), 15);
let heatmap = new Heatmap(map);
let network = new Network(map, "red", 1);

let data;

let xhr = new XMLHttpRequest();
xhr.onload = () => {
    data = JSON.parse(xhr.responseText);

    data.forEach((line) => {
        network.addLine(line.map(p => new Coord(...p)));
    });
}
xhr.open("GET", "/data.json");
xhr.send();