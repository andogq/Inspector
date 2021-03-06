// Constants
const c = {
    coords: {
        melbource: [144.9631, -37.8136],
        victoria: [[140.9553,-39.2516],[150.0849,-33.9732]],
    },
    map: {
        token: "pk.eyJ1IjoiYW5kb2dxIiwiYSI6ImNrOTBvemU3ZDA0NHIzZnJpdHZ6c21ubWgifQ.bnBBzM9gS46EbEyK1GdoxQ",
        nearbyRadius: 0.0015,
        touchRadius: 10,
        updateInterval: 5,
        animationDuration: 1000,
        sources: [
            "/data/bus_metro.geojson",
            "/data/bus_regional.geojson",
            "/data/coach_regional.geojson",
            "/data/interstate.geojson",
            "/data/train_metro.geojson",
            "/data/train_regional.geojson",
            "/data/tram_metro.geojson"
        ]
    },
    colors: {
        bus_metro: "#d66540",
        bus_regional: "#d66540",
        coach_regional: "#8e44ad",
        interstate: "#8e44ad",
        train_metro: "#2980b9",
        train_regional: "#8e44ad",
        tram_metro: "#27ae60"
    },
    notification: {
        timeout: 10000
    },
    states: {
        map: {
            "body": "map"
        },
        menu: {
            "body": "menu"
        },
        login: {
            "body": "login"
        },

        report: {
            "body": "page",
            "#menu_container": "report"
        },
        about: {
            "body": "page",
            "#menu_container": "about"
        },
        settings: {
            "body": "page",
            "#menu_container": "settings"
        },
        welcome: {
            "body": "welcome"
        }
    },
    scripts: [
        "/__/firebase/7.14.2/firebase-auth.js",
        "/__/firebase/7.14.2/firebase-analytics.js",
        "/js/elements.js",
        "/js/geo.js",
        "/js/login.js",
        "/js/map.js",
        "/js/mapbox-gl.js",
        "/js/menu.js",
        "/js/report.js",
        "/js/search.js",
        "/js/settings.js"
    ],
    firebase: {
        config: {
            apiKey: "AIzaSyBNjCHxAouwFF5LRtxJEGzS3C0H7BUsVhY",
            authDomain: "inspector-d21b9.firebaseapp.com",
            databaseURL: "https://inspector-d21b9.firebaseio.com",
            projectId: "inspector-d21b9",
            storageBucket: "inspector-d21b9.appspot.com",
            messagingSenderId: "48317127651",
            appId: "1:48317127651:web:cc16a707f7abdcf5239ed6",
            measurementId: "G-WQBXSF7YXJ"
        },
        script: "/__/firebase/7.14.2/firebase-app.js"
    }
}

// DOM elements
function d(id) {
    return document.getElementById(id);
}
const dom = {
    button: {
        report: d("button_report"),
        recenter: d("button_recenter"),
        account: d("button_account"),
        data: d("button_data"),
        history: d("button_history"),
        settings: d("button_settings"),
        submitReport: d("button_submitReport"),
        login: d("button_login"),
        verify: d("button_verify"),
        installSettings: d("button_installSettings"),
        clearCache: d("button_clearCache"),
        forceUpdate: d("button_forceUpdate"),
        acceptTerms: d("button_acceptTerms"),
        requestGeolocation: d("button_requestGeolocation"),
        install: d("button_install"),
        continue: d("button_continue"),
        signOut: d("button_signOut")
    },
    menu: {
        el: d("menu"),
        container: d("menu_container"),
        tab: d("menu_tab")
    },
    page: {
        report: d("page_report"),
        account: d("page_account"),
        login: d("page_login")
    },
    input: {
        report: {
            amount: d("input_report_amount"),
            location: d("input_report_location"),
            dress: d("input_report_dress"),
            time: d("input_report_time")
        },
        login: {
            phone: d("input_login_phone"),
            code: d("input_login_code")
        },
        search: d("input_search")
    },
    search: {
        container: d("search_container"),
        back: d("search_back"),
        suggestions: d("search_suggestions")
    },
    settings: {
        version: d("settings_version")
    },
    login: {
        back: d("login_back")
    },
    notification: {
        el: d("notification"),
        icon: d("notification_icon"),
        text: d("notification_text")
    },
    welcome: {
        el: d("welcome")
    },
    key: {
        metro: d("key_metro"),
        vline: d("key_vline"),
        tram: d("key_tram"),
        bus: d("key_bus")
    },
    reportDetails: {
        container: d("reportDetails"),
        amount: d("reportDetails_amount"),
        lastReport: d("reportDetails_lastReport"),
        dress: d("reportDetails_dress"),
        reports: d("reportDetails_reports")
    },
    map: d("map"),
    centerPoint: d("centerPoint"),
    centerPointOverlay: d("centerPointOverlay"),
    loader: d("loader"),
    pointMenu: d("pointMenu"),
    loadingScreen: d("loadingScreen")
}

// Globals
let g = {};

function init() {
    let loadId = load.start();

    // Check if the user is visiting for the first time whilst everything loads
    g.firstTime = localStorage.getItem("firstTime") == undefined;
    if (g.firstTime) state.set("welcome");

    // Add CSS file
    { 
        let el = document.createElement("link");
        el.rel = "stylesheet";
        el.href = "/main.css";
        document.head.appendChild(el);
    }

    // Load all the scripts
    loadScript(c.firebase.script).then(() => {
        Promise.all(c.scripts.map(loadScript)).then(() => {
            // Hide the loading screen
            dom.loadingScreen.style.opacity = 0;
            dom.loadingScreen.style.pointerEvents = "none";

            // Finally load the firebase script before continuing the init
            firebase.initializeApp(c.firebase.config);
            firebase.analytics();
            
            g.menu = new Menu();
        
            Promise.all([
                initServiceWorker(),
                initMap()
            ]).then(() => {
                setVersion().finally(() => {
                    firebase.analytics().setUserProperties({
                        version: g.version
                    });
                    
                    // Check for an update
                    fetch("/latest.txt").then((res) => {
                        if (res.ok) {
                            res.text().then((latest) => {
                                console.log(latest);
                                if (latest != g.version) notification.set("An update is available! Go to settings and press 'Force Update' to install it!");
                            });
                        } else throw new Error(res.status);
                    }).catch((err) => {
                        notification.set("There was a problem checking for a new version. Try clear the cache.");
                        console.error(err);
                    });

                    load.stop(loadId);
                });
            });

            // Other init functions
            initElements();
            addListeners();

            g.online = navigator.onLine;

            firebase.auth().onAuthStateChanged((user) => {
                g.loggedIn = user != undefined;
                dom.button.signOut.disabled = !g.loggedIn;
            });

            // Initialise the colors in the key
            dom.key.metro.children[0].style.background = c.colors.train_metro;
            dom.key.vline.children[0].style.background = c.colors.train_regional;
            dom.key.tram.children[0].style.background = c.colors.tram_metro;
            dom.key.bus.children[0].style.background = c.colors.bus_regional;
        
            if (!g.firstTime) state.check();
        });
    }).catch((e) => {
        console.error(e);
        notification.set("There was an error loading the app. Try clearing your cache and check your internet connection.");
        load.stop(loadId);
    });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        let el = document.createElement("script");
        el.onload = resolve;
        el.onerror = reject;
        el.async = true;
        el.src = src;
        document.body.appendChild(el);
    });
}

function addListeners() {
    // Event listeners to enable installation
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        g.installPrompt = e;
        console.log("Install ready");
    });

    window.addEventListener("popstate", state.check.bind(state));

    dom.map.addEventListener("touchstart", (e) => {
        reportDetail(e);
        state.set("map");
    }, {passive: true});
    dom.centerPoint.addEventListener("click", () => {
        state.reset(dom.reportDetails.container);
        state.set("menu");
    });
    dom.button.report.addEventListener("click", () => {
        if (g.loggedIn) {
            // User is logged in
            state.set("report");
        } else state.set("login");
    });

    // Recenter button
    dom.button.recenter.addEventListener("click", () => {
        centerOnUser();
        updateHeatmap();
        state.set("map");
    });

    dom.button.submitReport.addEventListener("click", sendReport);

    // Button listeners
    dom.button.login.addEventListener("click", login);
    dom.button.verify.addEventListener("click", verifyCode);

    // Fullscreen window for search
    dom.input.report.location.addEventListener("click", () => search.show(locationSearch));
    // Validation for report inputs
    dom.input.report.amount.addEventListener("click", validateInput);
    dom.input.report.location.addEventListener("blur", validateInput);
    dom.input.report.dress.addEventListener("click", validateInput);
    dom.input.report.time.addEventListener("blur", validateInput);

    dom.login.back.addEventListener("click", () => state.set("map"));
    dom.search.back.addEventListener("click", () => state.reset(dom.search.container));

    dom.input.search.addEventListener("keyup", () => search.update());

    // Tab button listeners
    dom.button.account.addEventListener("click", () => state.set("account"));
    dom.button.settings.addEventListener("click", () => state.set("settings"));

    dom.button.installSettings.addEventListener("click", install);
    dom.button.clearCache.addEventListener("click", clearCache);
    dom.button.forceUpdate.addEventListener("click", forceUpdate);
    dom.button.signOut.addEventListener("click", signOut);

    window.addEventListener("offline", () => {
        g.online = false;
        notification.set("You are offline, so some features won't work correctly.");
    });
    window.addEventListener("online", () => {
        g.online = true;
    });

    // Welcome page event listeners
    dom.button.acceptTerms.addEventListener("click", () => {
        if (!g.termsAccepted) {
            g.termsAccepted = true;
            dom.button.acceptTerms.classList.add("active");
            
            if (g.termsAccepted && g.geolocation) dom.button.continue.disabled = false;
        }
    });

    dom.button.requestGeolocation.addEventListener("click", () => {
        if (!g.geolocation) {
            let loadId = load.start();
            getCurrentPosition().then(() => {
                dom.button.requestGeolocation.classList.add("active");
                dom.button.requestGeolocation.value = "Permission granted!";
                g.geolocation = true;

                if (g.termsAccepted && g.geolocation) dom.button.continue.disabled = false;
            }).catch(() => notification.set("There was an error getting your location. Make sure that location services are enabled.")).finally(() => load.stop(loadId));
        }
    });

    dom.button.install.addEventListener("click", install);

    dom.button.continue.addEventListener("click", () => {
        state.set("map");
        g.firstTime = false;
        localStorage.setItem("firstTime", g.firstTime);
        jumpToUser();

        // Show the overlay and remove it once the user touches the screen
        dom.centerPointOverlay.setAttribute("state", "show");
        document.body.addEventListener("touchstart", () => {
            dom.centerPointOverlay.removeAttribute("state"), {once: true}
        });

        firebase.analytics().logEvent("newUser");
    });

    [dom.button.report, dom.button.recenter, dom.centerPoint].forEach((button) => {
        button.addEventListener("click", buzz);
    });

    // Prevent zooming
    document.addEventListener("gesturestart", (e) => {
        e.preventDefault();
    });

    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("controllerchange", () => notification.set("Update successfull!", "done"));
}

function initMap() {
    return new Promise((resolve) => {
        // Ensure the container is 100% of the height and width
        dom.map.style.height = "100%";
        dom.map.style.width = "100%";

        // Initialise Mapbox
        mapboxgl.accessToken = c.map.token;
        mapboxgl.prewarm();
        g.map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/light-v10?optimize=true",
            center: c.coords.melbource,
            zoom: 12,
            maxBounds: c.coords.victoria
        });

        g.map.on("load", () => {
            g.map.resize();
            if (!g.firstTime) jumpToUser();

            let promises = [];

            promises.push(loadSources()); 
            promises.push(initHeatmap());

            Promise.all(promises).then(resolve);
        });
    });
}

function initServiceWorker() {
    if (navigator.serviceWorker) {
        return navigator.serviceWorker.register("/sw.js").then(() => {
            console.log("Service worker installed");
        }).catch((err) => {
            console.error("Problem installing service worker", err);
        });
    } else {
        notification.set("Some features may not work correctly due to limitations imposed by your device. Try refreshing the page, or trying a new browser.");
        return Promise.resolve();
    }
}

function install() {
    if (g.installPrompt) {
        // For Chrome and other modern browsers that support it
        let loadId = load.start();
        g.installPrompt.prompt().then((choice) => {
            if (choice.outcome == "accepted") {
                dom.button.install.classList.add("active");
                window.addEventListener("appinstalled", () => {
                    notification.set("Install successfull! It will appear on your home screen shortly.", "done");
                    dom.button.install.classList.remove("active");
                    dom.button.install.disabled = true;
                }, {once: true});
            } else {
                notification.set("The app couldn't be installed automatically. Try going to your browser's share menu and select 'Add to Home Screen'.");
            }
            load.stop(loadId);
        })
    } else if (/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())) {
        // Apple device
        notification.set("To install as an app on an Apple Device, press the share button (at the bottom of the window), then scroll to and select 'Add to Home Screen'.");
    } else notification.set("The app couldn't be installed automatically. Try going to your browser's share menu and select 'Add to Home Screen'.");
}

function buzz() {
    if (navigator.vibrate) navigator.vibrate(50);
}

// Helper functions
const load = {
    start() {
        state.el(dom.loader, "show");

        this.lastLoad = Date.now();
        return this.lastLoad;
    },
    stop(loadId = 0) {
        // Ensure only the last caller can stop it loading
        if (loadId == this.lastLoad) {
            state.reset(dom.loader);
        }
    }
}

const notification = {
    set(text, icon = "error") {
        dom.notification.icon.innerText = icon;
        dom.notification.text.innerText = text;
        state.el(dom.notification.el, "show");

        this.lastNotification = Date.now();

        setTimeout(this.hide.bind(this), c.notification.timeout, this.lastNotification);
        return this.lastNotification;
    },
    hide(notificationId = 0) {
        // Only hide the notification if it was the last one called
        if (notificationId == this.lastNotification) {
            state.reset(dom.notification.el);
        }
    }
}

const state = {
    set(s, add=true) {
        if (c.states[s]) {
            // Undo the previous state
            if (this.state) Object.keys(c.states[this.state]).forEach(el => this.reset(document.querySelector(el)));
            Object.keys(c.states[s]).forEach((el) => {
                this.el(document.querySelector(el), c.states[s][el]);
            });
            this.state = s;
            
            // Allows users to go back without resetting the history
            if (add) history.pushState(s, "", "/" + s);
        }
    },
    el(e, s) {
        // Sets the state attribute with s
        e.setAttribute("state", s);
    },
    reset(e) {
        e.removeAttribute("state");
    },
    check() {
        // Check if the user was previously in a state
        let s = location.pathname.replace(/^\/(.*)$/, "$1");
        if (c.states[s]) this.set(s, false);
        else if (s == "") this.set("map")
    }
}

function sendMessage(data) {
    return navigator.serviceWorker.ready.then(() => {
        return new Promise((resolve) => {
            navigator.serviceWorker.addEventListener("message", (e) => {
                resolve(e.data);
            }, {once: true});

            if (navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage(data); 
            else notification.set("There was a problem loading the app. Make sure there's only one instance running (close other tabs with it open).");
        });
    });
}

window.addEventListener("load", init);