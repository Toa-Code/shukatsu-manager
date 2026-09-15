const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const addTaskButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let editingTaskId = null;


function saveTasks() {

    localStorage.setItem("tasks", JSON.stringify(tasks));

}


function displayTasks() {

    taskList.innerHTML = "";

    tasks.forEach(function(task) {

        const taskElement = document.createElement("li");

        taskElement.innerHTML = `

            <div>

                <strong>${task.text}</strong>

                <br>

                <small>
                    期限：${task.date || "未設定"}
                    　
                    優先度：${task.priority}
                </small>

            </div>

            <div class="item-buttons">

                <button class="edit-button">
                    編集
                </button>

                <button class="delete-button">
                    削除
                </button>

            </div>

        `;


        if (task.completed) {

            taskElement.classList.add("completed");

        }


        // 完了・未完了

        taskElement.querySelector("strong").addEventListener("click", function() {

            task.completed = !task.completed;

            saveTasks();

            displayTasks();

        });


        // 編集

        const editButton =
            taskElement.querySelector(".edit-button");


        editButton.addEventListener("click", function() {

            taskInput.value = task.text;

            taskDate.value = task.date || "";

            taskPriority.value = task.priority;

            editingTaskId = task.id;

            addTaskButton.textContent = "更新する";

            taskInput.focus();

        });


        // 削除

        const deleteButton =
            taskElement.querySelector(".delete-button");


        deleteButton.addEventListener("click", function() {

            tasks = tasks.filter(function(item) {

                return item.id !== task.id;

            });

            saveTasks();

            displayTasks();

        });


        taskList.appendChild(taskElement);

    });

}


addTaskButton.addEventListener("click", function() {

    const taskText = taskInput.value;


    if (taskText === "") {

        return;

    }


    // 編集中

    if (editingTaskId !== null) {

        const task = tasks.find(function(item) {

            return item.id === editingTaskId;

        });


        task.text = taskText;

        task.date = taskDate.value;

        task.priority = taskPriority.value;


        editingTaskId = null;

        addTaskButton.textContent = "追加";

    }


    // 新規追加

    else {

        const newTask = {

            id: Date.now(),

            text: taskText,

            date: taskDate.value,

            priority: taskPriority.value,

            completed: false

        };


        tasks.push(newTask);

    }


    saveTasks();

    displayTasks();


    taskInput.value = "";

    taskDate.value = "";

});


displayTasks();