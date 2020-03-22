class Map {
    constructor(id, center, zoom) {
        this.map = new ol.Map({
            target: id,
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: center.proj,
                zoom: zoom
            })
        })
    }

    addLayer(layer) {
        this.map.addLayer(layer);
    }
}