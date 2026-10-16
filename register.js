const email = document.getElementById("email");
const password = document.getElementById("password");
const passwordConfirm = document.getElementById("passwordConfirm");
const registerButton = document.getElementById("registerButton");
const registerMessage = document.getElementById("registerMessage");

registerButton.addEventListener("click", async function() {
    const emailValue = email.value;
    const passwordValue = password.value;
    const passwordConfirmValue = passwordConfirm.value;

    if (
        emailValue === "" ||
        passwordValue === "" ||
        passwordConfirmValue === ""
    ) {
        registerMessage.textContent = "すべて入力してください。";
        return;
    }

    if (passwordValue !== passwordConfirmValue) {
        registerMessage.textContent = "パスワードが一致していません。";
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: emailValue,
        password: passwordValue
    });

    if (error) {
        registerMessage.textContent = error.message;
        console.error(error);
        return;
    }

    registerMessage.textContent = "登録しました。メールを確認してください。";

    setTimeout(function() {
        location.href = "login.html";
    }, 1500);
});