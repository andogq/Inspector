class Coord {
    constructor(lon, lat) {
        this.lon = lon;
        this.lat = lat;
    }

    get proj() {
        return ol.proj.fromLonLat([this.lon, this.lat]);
    }
}