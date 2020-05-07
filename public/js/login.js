function login() {
    startLoad();
    
    let phoneNumber = g.controller.e("phoneNumber").value;

    // Format the phone number correctly
    phoneNumber = phoneNumber.replace(/[^\d(?:+61)]/g, "");
    phoneNumber = phoneNumber.replace(/^0/, "");
    if (!/^\+61/.test(phoneNumber)) phoneNumber = "+61" + phoneNumber;

    firebase.auth().signInWithPhoneNumber(phoneNumber, g.recaptchaVerifier).then((confirmation) => {
        stopLoad();

        g.controller.e("login").style.display = "none";
        g.controller.e("phoneNumberInput").style.display = "none";

        g.controller.e("codeInput").style.display = "block";
        g.controller.e("verify").style.display = "block";

        g.controller.e("verify").addEventListener("click", () => {
            startLoad();
            
            confirmation.confirm(g.controller.e("verificationCode").value).then(() => {
                g.controller.state = "map";
                g.loggedIn = true;
            }).catch((err) => {
                console.error(err);
                notification.set("Incorrect verification code");
            }).finally(() => stopLoad());
        }, {once: true});
    }).catch((err) => {
        console.error(err);
        notification.set("Invalid phone number");
    }).finally(() => stopLoad());
}