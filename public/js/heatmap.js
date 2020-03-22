class Heatmap {
    constructor(map) {
        this.map = map;

        this.source = new ol.source.Vector();
        this.layer = new ol.layer.Heatmap({
            source: this.source
        });

        this.map.addLayer(this.layer);
    }

    addPoint(coord, weight) {
        let feature = new ol.Feature({
            geometry: new ol.geom.Point(coord.proj),
            weight: weight
        });
        this.source.addFeature(feature);
    }
}