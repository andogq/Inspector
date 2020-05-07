function login() {
    let loadId = load.start();
    
    let phoneNumber = g.controller.e("phoneNumber").value;

    // Format the phone number correctly
    phoneNumber = phoneNumber.replace(/[^\d(?:+61)]/g, "");
    phoneNumber = phoneNumber.replace(/^0/, "");
    if (!/^\+61/.test(phoneNumber)) phoneNumber = "+61" + phoneNumber;

    firebase.auth().signInWithPhoneNumber(phoneNumber, g.recaptchaVerifier).then((confirmation) => {
        g.controller.e("login").style.display = "none";
        g.controller.e("phoneNumberInput").style.display = "none";

        g.controller.e("codeInput").style.display = "block";
        g.controller.e("verify").style.display = "block";

        g.controller.e("verify").addEventListener("click", () => {
            let verifyLoadId = load.start();
            
            confirmation.confirm(g.controller.e("verificationCode").value).then(() => {
                g.controller.state = "map";
                g.loggedIn = true;
            }).catch((err) => {
                console.error(err);
                notification.set("Incorrect verification code");
            }).finally(() => load.stop(verifyLoadId));
        }, {once: true});
    }).catch((err) => {
        console.error(err);
        notification.set("Invalid phone number");
    }).finally(() => load.stop(loadId));
}