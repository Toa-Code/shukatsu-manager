const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const addTaskButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");

let tasks = [];
let editingTaskId = null;

async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error(error);
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

function getDateStatus(date) {
    if (!date) {
        return "none";
    }

    const today = getToday();

    if (date < today) {
        return "overdue";
    }

    if (date === today) {
        return "today";
    }

    return "future";
}

function getDateLabel(date) {
    const status = getDateStatus(date);

    if (status === "none") {
        return "期限なし";
    }

    if (status === "overdue") {
        return "期限切れ";
    }

    if (status === "today") {
        return "今日";
    }

    return date;
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
        console.error(error);
        return;
    }

    tasks = data;

    displayTasks();
}

function displayTasks() {
    taskList.innerHTML = "";

    const sortedTasks = [...tasks].sort(function(a, b) {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        if (!a.date && !b.date) {
            return new Date(b.created_at) - new Date(a.created_at);
        }

        if (!a.date) {
            return 1;
        }

        if (!b.date) {
            return -1;
        }

        return a.date.localeCompare(b.date);
    });

    sortedTasks.forEach(function(task) {
        const taskElement = document.createElement("li");

        taskElement.classList.add("task-item");

        const dateStatus = getDateStatus(task.date);

        if (task.completed) {
            taskElement.classList.add("completed");
        }

        if (!task.completed && dateStatus === "overdue") {
            taskElement.classList.add("task-overdue");
        }

        if (!task.completed && dateStatus === "today") {
            taskElement.classList.add("task-today");
        }

        taskElement.innerHTML = `
            <div>
                <strong>${task.text}</strong>
                <br>
                <small>
                    期限：
                    <span class="task-date ${dateStatus}">
                        ${getDateLabel(task.date)}
                    </span>
                    　
                    優先度：
                    <span class="task-priority priority-${task.priority}">
                        ${task.priority}
                    </span>
                </small>
            </div>

            <div class="item-buttons">
                <button class="complete-button">
                    ${task.completed ? "未完了に戻す" : "完了"}
                </button>

                <button class="edit-button">
                    編集
                </button>

                <button class="delete-button">
                    削除
                </button>
            </div>
        `;

        const completeButton = taskElement.querySelector(".complete-button");

        completeButton.addEventListener("click", async function() {
            const user = await getCurrentUser();

            if (!user) {
                return;
            }

            const { error } = await supabaseClient
                .from("tasks")
                .update({
                    completed: !task.completed
                })
                .eq("id", task.id)
                .eq("user_id", user.id);

            if (error) {
                console.error(error);
                return;
            }

            loadTasks();
        });

        const editButton = taskElement.querySelector(".edit-button");

        editButton.addEventListener("click", function() {
            taskInput.value = task.text;
            taskDate.value = task.date || "";
            taskPriority.value = task.priority;

            editingTaskId = task.id;

            addTaskButton.textContent = "更新する";

            taskInput.focus();
        });

        const deleteButton = taskElement.querySelector(".delete-button");

        deleteButton.addEventListener("click", async function() {
            const user = await getCurrentUser();

            if (!user) {
                return;
            }

            const { error } = await supabaseClient
                .from("tasks")
                .delete()
                .eq("id", task.id)
                .eq("user_id", user.id);

            if (error) {
                console.error(error);
                return;
            }

            loadTasks();
        });

        taskList.appendChild(taskElement);
    });
}

addTaskButton.addEventListener("click", async function() {
    const taskText = taskInput.value.trim();

    if (taskText === "") {
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    if (editingTaskId !== null) {
        const { error } = await supabaseClient
            .from("tasks")
            .update({
                text: taskText,
                date: taskDate.value || null,
                priority: taskPriority.value
            })
            .eq("id", editingTaskId)
            .eq("user_id", user.id);

        if (error) {
            console.error(error);
            return;
        }

        editingTaskId = null;
        addTaskButton.textContent = "追加";
    } else {
        const { error } = await supabaseClient
            .from("tasks")
            .insert({
                user_id: user.id,
                text: taskText,
                date: taskDate.value || null,
                priority: taskPriority.value,
                completed: false
            });

        if (error) {
            console.error(error);
            return;
        }
    }

    taskInput.value = "";
    taskDate.value = "";
    taskPriority.value = "高";

    loadTasks();
});

loadTasks();