const email = document.getElementById("email");
const password = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

loginButton.addEventListener("click", async function() {
    const emailValue = email.value;
    const passwordValue = password.value;

    if (emailValue === "" || passwordValue === "") {
        loginMessage.textContent = "メールアドレスとパスワードを入力してください。";
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue
    });

    if (error) {
        loginMessage.textContent = "メールアドレスまたはパスワードが正しくありません。";
        console.error(error);
        return;
    }

    location.href = "index.html";
});