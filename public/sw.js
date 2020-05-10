const version = "v0.3.4";
const exclude = [
    "/sw.js"
]
const files = [
    "/",
    "/css/inputs.css",
    "/css/loader.css",
    "/css/login.css",
    "/css/map.css",
    "/css/menu.css",
    "/css/notification.css",
    "/css/page.css",
    "/css/search.css",
    "/css/states.css",
    "/data/bus_metro.geojson",
    "/data/bus_regional.geojson",
    "/data/coach_regional.geojson",
    "/data/interstate.geojson",
    "/data/train_metro.geojson",
    "/data/train_regional.geojson",
    "/data/tram_metro.geojson",
    "/icons/16x16.png",
    "/icons/32x32.png",
    "/icons/48x48.png",
    "/icons/72x72.png",
    "/icons/96x96.png",
    "/icons/144x144.png",
    "/icons/192x192.png",
    "/icons/512x512.png",
    "/js/element.js",
    "/js/geo.js",
    "/js/login.js",
    "/js/map.js",
    "/js/menu.js",
    "/js/report.js",
    "/js/search.js",
    "/favicon.ico",
    "/index.html",
    "/main.css",
    "/main.js"
]

this.addEventListener("install", (e) => {
    e.waitUntil(caches.open(version).then((cache) => {
        return cache.addAll(files);
    }));
});

this.addEventListener("activate", (e) => {
    e.waitUntil(caches.keys().then((names) => {
        return Promise.all(names.map((name) => {
            if (name != version) return caches.delete(name);
        }));
    }));
});

this.addEventListener("fetch", (e) => {
    e.respondWith(caches.match(e.request).then((res) => {
        if (res) return res;
        else return fetch(e.request).then((res) => {
            if (!res || res.status != 200 || res.type != "basic" || exclude.indexOf(e.request.url) != -1) return res;
            else {
                let clone = res.clone();

                caches.open(version).then((cache) => {
                    cache.put(e.request, clone);
                });

                return res;
            }
        });
    }));
});