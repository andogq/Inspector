function setVersion() {
    return sendMessage({get: "version"}).then(({version}) => {
        g.version = version;
        dom.settings.version.innerText = version;
    });
}

function clearCache() {
    let loadId = load.start();
    localStorage.clear();
    return sendMessage({do: "clearCache"}).then(() => {
        load.stop(loadId);
        notification.set("Cache cleared", "done");
        firebase.analytics().logEvent("clearCache");
    });
}

function forceUpdate() {
    firebase.analytics().logEvent("forceUpdate");
    
    return navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
    }).finally(() => {
        location.pathname = "/";
    });
}