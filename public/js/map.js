class Map {
    constructor({id, center, zoom, source, showZoom}) {
        this.view = new ol.View({
            center: center.proj,
            zoom: zoom
        });

        this.map = new ol.Map({
            target: id,
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM({url: source})
                })
            ],
            view: this.view,
            controls: ol.control.defaults({
                zoom: showZoom == undefined ? true : showZoom
            })
        });
    }

    addLayer(layer) {
        this.map.addLayer(layer);
    }
}