function setVersion() {
    return sendMessage({get: "version"}).then(({version}) => {
        dom.settings.version.innerText = version;
    });
}

function clearCache() {
    let loadId = load.start();
    return sendMessage({do: "clearCache"}).then(() => {
        load.stop(loadId);
        notification.set("Cache cleared", "done");
    });
}