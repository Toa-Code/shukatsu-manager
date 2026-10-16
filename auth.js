async function checkLogin() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        location.href = "login.html";
        return null;
    }

    return data.session;
}

checkLogin();