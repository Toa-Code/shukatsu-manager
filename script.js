
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const taskCompany = document.getElementById("taskCompany");
const addTaskButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");
const taskGroups = document.getElementById("taskGroups");
const taskSort = document.getElementById("taskSort");
const taskCount = document.getElementById("taskCount");
const taskNotice = document.getElementById("taskNotice");
const taskNoticeText = document.getElementById("taskNoticeText");
const cancelEditButton = document.getElementById("cancelEditButton");
const taskFormTitle = document.getElementById("taskFormTitle");

let tasks = [];
let taskCompanies = [];
let editingTaskId = null;
let noticeTimer = null;

async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("ユーザー情報の取得に失敗しました:", error);
        return null;
    }

    return data.user;
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
    const date = new Date(`${dateString}T12:00:00`);
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getWeekStart(dateString) {
    const date = new Date(`${dateString}T12:00:00`);
    const day = date.getDay();
    const daysFromMonday = (day + 6) % 7;

    date.setDate(date.getDate() - daysFromMonday);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayOfMonth = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${dayOfMonth}`;
}

function getDateGroup(date) {
    if (!date) {
        return "期限なし";
    }

    const today = getToday();
    const tomorrow = addDays(today, 1);
    const thisWeekStart = getWeekStart(today);
    const nextWeekStart = addDays(thisWeekStart, 7);
    const weekAfterNextStart = addDays(thisWeekStart, 14);

    if (date < today) {
        return "期限超過";
    }

    if (date === today) {
        return "今日";
    }

    if (date === tomorrow) {
        return "明日";
    }

    if (date < nextWeekStart) {
        return "今週";
    }

    if (date < weekAfterNextStart) {
        return "来週";
    }

    return "それ以降";
}

function getDateLabel(date) {
    if (!date) {
        return "期限なし";
    }

    const group = getDateGroup(date);

    if (group === "期限超過") {
        return `期限超過（${date}）`;
    }

    if (group === "今日" || group === "明日") {
        return `${group}（${date}）`;
    }

    return date;
}

function getPriorityValue(priority) {
    if (priority === "高") return 3;
    if (priority === "中") return 2;
    return 1;
}

function getCompanyName(task) {
    const company = task.company_id
        ? taskCompanies.find(item => item.id === task.company_id)
        : null;

    return company ? company.name : "";
}

async function loadTaskCompanies() {
    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("companies")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

    if (error) {
        console.error("企業一覧の取得に失敗しました:", error);
        alert("企業一覧を取得できませんでした。");
        return;
    }

    taskCompanies = data || [];
    taskCompany.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "企業を選択（任意）";
    taskCompany.appendChild(defaultOption);

    taskCompanies.forEach(company => {
        const option = document.createElement("option");
        option.value = company.id;
        option.textContent = company.name;
        taskCompany.appendChild(option);
    });
}

async function loadTasks() {
    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("タスクの取得に失敗しました:", error);
        alert("タスクを取得できませんでした。");
        return;
    }

    tasks = data || [];
    displayTasks();
}

function sortTasks(taskArray) {
    const sorted = [...taskArray];
    const mode = taskSort.value;

    sorted.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        if (mode === "priority") {
            const difference =
                getPriorityValue(b.priority) - getPriorityValue(a.priority);

            if (difference !== 0) {
                return difference;
            }
        }

        if (mode === "company") {
            const difference = getCompanyName(a).localeCompare(
                getCompanyName(b),
                "ja"
            );

            if (difference !== 0) {
                return difference;
            }
        }

        if (mode === "date" || mode === "priority" || mode === "company") {
            if (!a.date && b.date) return 1;
            if (a.date && !b.date) return -1;

            if (a.date && b.date) {
                const difference = a.date.localeCompare(b.date);

                if (difference !== 0) {
                    return difference;
                }
            }
        }

        return new Date(b.created_at) - new Date(a.created_at);
    });

    return sorted;
}

function showNotice(message) {
    if (!taskNotice || !taskNoticeText) {
        return;
    }

    if (noticeTimer) {
        clearTimeout(noticeTimer);
        noticeTimer = null;
    }

    taskNoticeText.textContent = message;
    taskNotice.hidden = false;

    noticeTimer = setTimeout(() => {
        taskNotice.hidden = true;
        noticeTimer = null;
    }, 3000);
}

function createTaskElement(task) {
    const taskElement = document.createElement("li");
    taskElement.classList.add("task-item");

    const dateGroup = getDateGroup(task.date);

    if (task.completed) {
        taskElement.classList.add("completed");
    } else if (dateGroup === "期限超過") {
        taskElement.classList.add("task-overdue");
    } else if (dateGroup === "今日") {
        taskElement.classList.add("task-today");
    }

    const content = document.createElement("div");
    content.classList.add("task-content");

    const title = document.createElement("strong");
    title.textContent = task.text;
    content.appendChild(title);

    const companyName = getCompanyName(task);

    if (companyName) {
        const company = document.createElement("div");
        company.classList.add("task-company");
        company.textContent = `企業：${companyName}`;
        content.appendChild(company);
    }

    const meta = document.createElement("div");
    meta.classList.add("task-meta");

    const dateText = document.createElement("span");
    dateText.classList.add(
        "task-date",
        dateGroup === "期限超過" ? "overdue" : "normal"
    );
    dateText.textContent = `期限：${getDateLabel(task.date)}`;

    const priorityText = document.createElement("span");
    priorityText.classList.add("task-priority", `priority-${task.priority}`);
    priorityText.textContent = `優先度：${task.priority}`;

    meta.append(dateText, priorityText);
    content.appendChild(meta);

    const buttons = document.createElement("div");
    buttons.classList.add("item-buttons");

    const completeButton = document.createElement("button");
    completeButton.classList.add("complete-button");
    completeButton.textContent = task.completed ? "未完了に戻す" : "完了";
    completeButton.addEventListener("click", () => toggleTask(task));

    const editButton = document.createElement("button");
    editButton.classList.add("edit-button");
    editButton.textContent = "編集";
    editButton.addEventListener("click", () => startEditing(task));

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");
    deleteButton.textContent = "削除";
    deleteButton.addEventListener("click", () => deleteTask(task));

    buttons.append(completeButton, editButton, deleteButton);
    taskElement.append(content, buttons);

    return taskElement;
}

function displayTasks() {
    taskGroups.replaceChildren();

    const activeTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);
    const sortedActiveTasks = sortTasks(activeTasks);
    const sortedCompletedTasks = sortTasks(completedTasks);

    taskCount.textContent =
        `未完了：${activeTasks.length}件 ／ 完了済み：${completedTasks.length}件`;

    const groupOrder = [
        "期限超過",
        "今日",
        "明日",
        "今週",
        "来週",
        "それ以降",
        "期限なし"
    ];

    groupOrder.forEach(groupName => {
        const groupTasks = sortedActiveTasks.filter(
            task => getDateGroup(task.date) === groupName
        );

        if (groupTasks.length === 0) {
            return;
        }

        const section = document.createElement("section");
        section.classList.add("task-group");

        if (groupName === "期限超過") {
            section.classList.add("task-group-overdue");
        }

        const heading = document.createElement("h3");
        heading.textContent = `${groupName}（${groupTasks.length}件）`;

        const list = document.createElement("ul");
        list.classList.add("task-list-group");

        groupTasks.forEach(task => {
            list.appendChild(createTaskElement(task));
        });

        section.append(heading, list);
        taskGroups.appendChild(section);
    });

    if (sortedCompletedTasks.length > 0) {
        const section = document.createElement("section");
        section.classList.add("task-group");

        const heading = document.createElement("h3");
        heading.textContent = `完了済み（${sortedCompletedTasks.length}件）`;

        const list = document.createElement("ul");
        list.classList.add("task-list-group");

        sortedCompletedTasks.forEach(task => {
            list.appendChild(createTaskElement(task));
        });

        section.append(heading, list);
        taskGroups.appendChild(section);
    }

    if (tasks.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "タスクはまだありません。";
        taskGroups.appendChild(emptyMessage);
    }
}

async function toggleTask(task) {
    const user = await getCurrentUser();

    if (!user) {
        alert("ログイン状態を確認できませんでした。");
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", task.id)
        .eq("user_id", user.id);

    if (error) {
        console.error("タスクの更新に失敗しました:", error);
        alert("タスクの更新に失敗しました。");
        return;
    }

    await loadTasks();
}

function startEditing(task) {
    taskInput.value = task.text;
    taskDate.value = task.date || "";
    taskPriority.value = task.priority;
    taskCompany.value = task.company_id || "";

    editingTaskId = task.id;
    addTaskButton.textContent = "更新する";
    cancelEditButton.hidden = false;
    taskFormTitle.textContent = "タスクを編集";

    taskInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetTaskForm() {
    taskInput.value = "";
    taskDate.value = "";
    taskPriority.value = "高";
    taskCompany.value = "";

    editingTaskId = null;
    addTaskButton.textContent = "追加";
    cancelEditButton.hidden = true;
    taskFormTitle.textContent = "タスクを追加";
}

async function deleteTask(task) {
    const confirmed = window.confirm(
        `「${task.text}」を削除しますか？\n\nこの操作は取り消せません。`
    );

    if (!confirmed) {
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
        alert("ログイン状態を確認できませんでした。");
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .delete()
        .eq("id", task.id)
        .eq("user_id", user.id);

    if (error) {
        console.error("タスクの削除に失敗しました:", error);
        alert("タスクの削除に失敗しました。");
        return;
    }

    tasks = tasks.filter(item => item.id !== task.id);
    displayTasks();
    showNotice("タスクを削除しました。");
}

addTaskButton.addEventListener("click", async function() {
    const taskText = taskInput.value.trim();

    if (!taskText) {
        alert("タスクを入力してください。");
        taskInput.focus();
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
        alert("ログイン状態を確認できませんでした。");
        return;
    }

    if (editingTaskId !== null) {
        const { error } = await supabaseClient
            .from("tasks")
            .update({
                text: taskText,
                date: taskDate.value || null,
                priority: taskPriority.value,
                company_id: taskCompany.value || null
            })
            .eq("id", editingTaskId)
            .eq("user_id", user.id);

        if (error) {
            console.error("タスクの更新に失敗しました:", error);
            alert("タスクの更新に失敗しました。");
            return;
        }

        showNotice("タスクを更新しました。");
    } else {
        const { error } = await supabaseClient
            .from("tasks")
            .insert({
                user_id: user.id,
                text: taskText,
                date: taskDate.value || null,
                priority: taskPriority.value,
                company_id: taskCompany.value || null,
                completed: false
            });

        if (error) {
            console.error("タスクの追加に失敗しました:", error);
            alert("タスクの追加に失敗しました。");
            return;
        }

        showNotice("タスクを追加しました。");
    }

    resetTaskForm();
    await loadTasks();
});

cancelEditButton.addEventListener("click", resetTaskForm);

taskSort.addEventListener("change", displayTasks);

async function initializeTasks() {
    await loadTaskCompanies();
    await loadTasks();
}

initializeTasks();
