function login() {
    let phoneNumber = dom.input.login.phoneNumber.value;
    if (phoneNumber == "") return;

    let loadId = load.start();
    
    // Format the phone number correctly
    phoneNumber = phoneNumber.replace(/[^\d(?:+61)]/g, "");
    phoneNumber = phoneNumber.replace(/^0/, "");
    if (!/^\+61/.test(phoneNumber)) phoneNumber = "+61" + phoneNumber;


    // Setup the recaptcha
    g.login = {};
    g.login.verifier = new firebase.auth.RecaptchaVerifier("login", {style: "invisible"});

    firebase.auth().signInWithPhoneNumber(phoneNumber, g.login.verifier).then((confirmation) => {
        // Swap the login page state
        dom.page.login.classList.remove("step1");
        dom.page.login.classList.add("step2");

        g.login.confirmation = confirmation;
    }).catch((err) => {
        console.error(err);
        notification.set("Invalid phone number");
    }).finally(() => load.stop(loadId));
}

function verifyCode() {
    let code = dom.input.login.code.value;

    if (code == "" || !g.login || !g.login.confirmation) return;
    
    let verifyLoadId = load.start();

    g.login.confirmation.confirm(code).then(() => {
        // Logged in successfully!
        notification.set("Logged in successfully!", "check");
        document.body.setAttribute("state", "map");
        g.loggedIn = true;
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
    });
}