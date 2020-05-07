function login() {
    startLoad();
    
    let phoneNumber = controller.e("phoneNumber").value;

    // Format the phone number correctly
    phoneNumber = phoneNumber.replace(/[^\d(?:+61)]/g, "");
    phoneNumber = phoneNumber.replace(/^0/, "");
    if (!/^\+61/.test(phoneNumber)) phoneNumber = "+61" + phoneNumber;

    firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier).then((confirmation) => {
        stopLoad();

        controller.e("login").style.display = "none";
        controller.e("phoneNumberInput").style.display = "none";

        controller.e("codeInput").style.display = "block";
        controller.e("verify").style.display = "block";

        controller.e("verify").addEventListener("click", () => {
            startLoad();
            
            confirmation.confirm(controller.e("verificationCode").value).then(() => {
                controller.state = "map";
                loggedIn = true;
            }).catch((err) => {
                console.error(err);
                setNotification("Incorrect verification code", "error");
            }).finally(() => stopLoad());
        }, {once: true});
    }).catch((err) => {
        console.error(err);
        setNotification("Invalid phone number", "error");
    }).finally(() => stopLoad());
}