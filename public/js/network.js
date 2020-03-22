class Network {
    constructor(map, lineColor, lineWidth) {
        this.map = map;

        this.source = new ol.source.Vector();
        this.layer = new ol.layer.Vector({
            source: this.source,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: lineColor,
                    width: lineWidth
                })
            })
        });

        this.map.addLayer(this.layer);

        this.features = [];
    }

    addLine(line) {
        let feature = new ol.Feature({
            geometry: new ol.geom.LineString(line.map(p => p.proj))
        });
        this.source.addFeature(feature);

        this.features.push(feature);
        return feature;
    }

    removeLine(line) {
        let i = this.features.indexOf(line);
        
        if (i != -1) {
            this.source.removeFeature(line);
            this.features.splice(i, 1);
        }
    }
}