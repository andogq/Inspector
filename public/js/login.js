function login() {
    let phoneNumber = g.controller.e("phoneNumber").value;
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
        g.controller.e("loginPage").classList.remove("step1");
        g.controller.e("loginPage").classList.add("step2");

        g.login.confirmation = confirmation;
    }).catch((err) => {
        console.error(err);
        notification.set("Invalid phone number");
    }).finally(() => load.stop(loadId));
}

function verifyCode() {
    let code = g.controller.e("verificationCode").value;

    if (code == "" || !g.login || !g.login.confirmation) return;
    
    let verifyLoadId = load.start();

    g.login.confirmation.confirm(code).then(() => {
        g.controller.state = "map";
        g.loggedIn = true;
    }).catch((err) => {
        console.error(err);
        notification.set("Incorrect verification code");
    }).finally(() => {
        // Swap the login page back
        g.controller.e("loginPage").classList.remove("step2");
        g.controller.e("loginPage").classList.add("step1");

        // Destroy the verifier
        g.login.verifier.clear();
        g.login = {};

        load.stop(verifyLoadId);
    });
}