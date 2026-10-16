const taskCount = document.getElementById("taskCount");
const companyCount = document.getElementById("companyCount");
const textCount = document.getElementById("textCount");
const internshipCount = document.getElementById("internshipCount");
const logoutButton = document.getElementById("logoutButton");
const mainCompanyCount = document.getElementById("mainCompanyCount");

const selectionCount = document.getElementById("selectionCount");

const offerCount = document.getElementById("offerCount");

const incompleteTaskCount = document.getElementById("incompleteTaskCount");

async function loadDashboard() {
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        location.href = "login.html";
        return;
    }

    const userId = userData.user.id;

    const today = new Date().toISOString().split("T")[0];

    const { count: taskTotal, error: taskError } = await supabaseClient
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("date", today)
        .eq("completed", false);

    const { count: companyTotal, error: companyError } = await supabaseClient
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

    const { count: textTotal, error: textError } = await supabaseClient
        .from("texts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

    const { count: internshipTotal, error: internshipError } = await supabaseClient
        .from("internships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

        const { count: mainCompanyTotal, error: mainCompanyError } = await supabaseClient
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("category", "本命");

const { count: selectionTotal, error: selectionError } = await supabaseClient
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("selection_status", "選考中");

const { count: offerTotal, error: offerError } = await supabaseClient
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("selection_status", "内定");

const { count: incompleteTaskTotal, error: incompleteTaskError } = await supabaseClient
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", false);

    if (
    taskError ||
    companyError ||
    textError ||
    internshipError ||
    mainCompanyError ||
    selectionError ||
    offerError ||
    incompleteTaskError
) {
    console.error(
        taskError,
        companyError,
        textError,
        internshipError,
        mainCompanyError,
        selectionError,
        offerError,
        incompleteTaskError
    );
    return;
}

    taskCount.textContent = taskTotal || 0;
    companyCount.textContent = companyTotal || 0;
    textCount.textContent = textTotal || 0;
    internshipCount.textContent = internshipTotal || 0;
    mainCompanyCount.textContent = mainCompanyTotal || 0;
selectionCount.textContent = selectionTotal || 0;
offerCount.textContent = offerTotal || 0;
incompleteTaskCount.textContent = incompleteTaskTotal || 0;
}

logoutButton.addEventListener("click", async function() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error(error);
        return;
    }

    location.href = "login.html";
});

loadDashboard();

const topButton = document.getElementById("topButton");

window.addEventListener("scroll", function() {
    if (window.scrollY > 300) {
        topButton.classList.add("show");
    } else {
        topButton.classList.remove("show");
    }
});

topButton.addEventListener("click", function() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});