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


const upcomingTaskList = document.getElementById("upcomingTaskList");

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatTaskDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

    return `${month}/${day}（${weekdays[date.getDay()]}）`;
}

async function loadUpcomingTasks() {
    if (!upcomingTaskList) {
        return;
    }

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        upcomingTaskList.textContent = "タスクを読み込めませんでした。";
        return;
    }

    const today = new Date();
    const todayString = formatLocalDate(today);

    const lastDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 6
    );
    const lastDayString = formatLocalDate(lastDay);

    const { data, error } = await supabaseClient
        .from("tasks")
        .select("id, text, date, priority, completed")
        .eq("user_id", userData.user.id)
        .eq("completed", false)
        .gte("date", todayString)
        .lte("date", lastDayString)
        .order("date", { ascending: true });

    if (error) {
        console.error(error);
        upcomingTaskList.textContent = "タスクを読み込めませんでした。";
        return;
    }

    const priorityOrder = {
        "高": 0,
        "中": 1,
        "低": 2
    };

    data.sort(function(a, b) {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }

        return (priorityOrder[a.priority] ?? 99) -
            (priorityOrder[b.priority] ?? 99);
    });

    upcomingTaskList.replaceChildren();

    if (data.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "upcoming-task-empty";
        emptyMessage.textContent = "今後1週間のタスクはありません。";
        upcomingTaskList.appendChild(emptyMessage);
        return;
    }

    data.forEach(function(task) {
        const item = document.createElement("div");
        item.className = "upcoming-task-item";

        const date = document.createElement("span");
        date.className = "upcoming-task-date";
        date.textContent = task.date === todayString
            ? `今日（${formatTaskDate(task.date)}）`
            : formatTaskDate(task.date);

        const details = document.createElement("div");
        details.className = "upcoming-task-details";

        const name = document.createElement("strong");
        name.className = "upcoming-task-name";
        name.textContent = task.text;

        const priority = document.createElement("span");
        priority.className = `upcoming-task-priority priority-${task.priority}`;
        priority.textContent = `優先度：${task.priority}`;

        details.append(name, priority);
        item.append(date, details);
        upcomingTaskList.appendChild(item);
    });
}

loadUpcomingTasks();


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