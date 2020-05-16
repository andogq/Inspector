function setVersion() {
    return sendMessage({get: "version"}).then((res) => {
        let version;
        if (res) version = res.version;

        g.version = version;
        dom.settings.version.innerText = version;
    }).catch(console.error);
}

function clearCache() {
    let loadId = load.start();
    localStorage.clear();
    return sendMessage({do: "clearCache"}).then(() => {
        load.stop(loadId);
        firebase.analytics().logEvent("clearCache");
        location.pathname = "/";
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

function signOut() {
    firebase.analytics().logEvent("signOut");

    if (g.loggedIn) firebase.auth().signOut();
}