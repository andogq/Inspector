function login() {
    let phone = dom.input.login.phone.value;
    if (phone == "") return;

    // Start loading and disable the login button
    let loadId = load.start();
    dom.button.login.disabled = true;

    // Setup the recaptcha
    g.login = {};
    g.login.verifier = new firebase.auth.RecaptchaVerifier("recaptchaContainer", {size: "invisible"});
    
    // Format the phone number correctly
    phone = phone.replace(/[^\d(?:+61)]/g, "");
    phone = phone.replace(/^0/, "");
    if (!/^\+61/.test(phone)) phone = "+61" + phone;

    firebase.auth().signInWithPhoneNumber(phone, g.login.verifier).then((confirmation) => {
        // Swap the login page state
        dom.page.login.classList.remove("step1");
        dom.page.login.classList.add("step2");

        g.login.confirmation = confirmation;
    }).catch((err) => {
        console.error(err);
        notification.set(err.message);
    }).finally(() => {
        // Re-enable the button and stop loading
        load.stop(loadId);
        dom.button.login.disabled = false;
    });
}

function verifyCode() {
    let code = dom.input.login.code.value;

    if (code == "" || !g.login || !g.login.confirmation) return;
    
    let verifyLoadId = load.start();
    dom.button.verify.disabled = true;

    g.login.confirmation.confirm(code).then(() => {
        // Logged in successfully!
        notification.set("Logged in successfully!", "check");
        state.set("map");
        g.loggedIn = true;
        firebase.analytics().logEvent("login", {method: "phone"});
    }).catch((err) => {
        console.error(err);
        notification.set("Incorrect verification code");
    }).finally(() => {
        // Swap the login page back
        dom.page.login.classList.remove("step2");
        dom.page.login.classList.add("step1");

        // Destroy the verifier
        g.login.verifier.clear();
        g.login = {};

        load.stop(verifyLoadId);
        dom.button.verify.disabled = false;
    });
}