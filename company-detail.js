const companyName = document.getElementById("companyName");
const companyCategory = document.getElementById("companyCategory");
const companySelectionStatus = document.getElementById("companySelectionStatus");
const companyPriority = document.getElementById("companyPriority");
const companyDate = document.getElementById("companyDate");
const companyMemo = document.getElementById("companyMemo");

const editCompanyButton = document.getElementById("editCompanyButton");
const editCompanySection = document.getElementById("editCompanySection");
const editCompanyName = document.getElementById("editCompanyName");
const editCompanyCategory = document.getElementById("editCompanyCategory");
const editCompanySelectionStatus = document.getElementById("editCompanySelectionStatus");
const editCompanyDate = document.getElementById("editCompanyDate");
const editCompanyPriority = document.getElementById("editCompanyPriority");
const editCompanyMemo = document.getElementById("editCompanyMemo");
const saveCompanyButton = document.getElementById("saveCompanyButton");
const cancelEditButton = document.getElementById("cancelEditButton");

const researchBusiness = document.getElementById("researchBusiness");
const researchStrengths = document.getElementById("researchStrengths");
const researchProfile = document.getElementById("researchProfile");
const researchConnection = document.getElementById("researchConnection");
const researchPoints = document.getElementById("researchPoints");

const editResearchButton = document.getElementById("editResearchButton");
const editResearchSection = document.getElementById("editResearchSection");
const editResearchBusiness = document.getElementById("editResearchBusiness");
const editResearchStrengths = document.getElementById("editResearchStrengths");
const editResearchProfile = document.getElementById("editResearchProfile");
const editResearchConnection = document.getElementById("editResearchConnection");
const editResearchPoints = document.getElementById("editResearchPoints");
const saveResearchButton = document.getElementById("saveResearchButton");
const cancelResearchButton = document.getElementById("cancelResearchButton");

const companyTaskInput = document.getElementById("companyTaskInput");
const companyTaskDate = document.getElementById("companyTaskDate");
const companyTaskPriority = document.getElementById("companyTaskPriority");
const addCompanyTaskButton = document.getElementById("addCompanyTaskButton");
const companyTaskList = document.getElementById("companyTaskList");
const noCompanyTasks = document.getElementById("noCompanyTasks");

const companyTextList = document.getElementById("companyTextList");
const noCompanyTexts = document.getElementById("noCompanyTexts");

const interviewDate = document.getElementById("interviewDate");
const interviewStage = document.getElementById("interviewStage");
const interviewerInput = document.getElementById("interviewerInput");
const questionsInput = document.getElementById("questionsInput");
const answerNotesInput = document.getElementById("answerNotesInput");
const impressionInput = document.getElementById("impressionInput");
const nextActionInput = document.getElementById("nextActionInput");
const addInterviewButton = document.getElementById("addInterviewButton");
const interviewList = document.getElementById("interviewList");
const noInterviews = document.getElementById("noInterviews");

let currentCompany = null;
let interviews = [];
let companyTasks = [];
let editingInterviewId = null;

function getCompanyId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error(error);
        return null;
    }

    return data.user;
}

function setText(element, value, fallback = "未記入") {
    element.textContent = value || fallback;
}

function displayCompany() {
    companyName.textContent = currentCompany.name;

    setText(companyCategory, currentCompany.category, "未設定");
    setText(companySelectionStatus, currentCompany.selection_status, "未設定");

    const priority = Number(currentCompany.priority) || 0;

    companyPriority.textContent = priority > 0
        ? "★".repeat(priority) + "☆".repeat(5 - priority)
        : "未設定";

    setText(companyDate, currentCompany.date, "未設定");
    setText(companyMemo, currentCompany.memo, "メモなし");

    setText(researchBusiness, currentCompany.research_business);
    setText(researchStrengths, currentCompany.research_strengths);
    setText(researchProfile, currentCompany.research_profile);
    setText(researchConnection, currentCompany.research_connection);
    setText(researchPoints, currentCompany.research_points);

    document.title = `${currentCompany.name} - 就活Manager`;

    editCompanyName.value = currentCompany.name;
    editCompanyCategory.value = currentCompany.category || "気になる";
    editCompanySelectionStatus.value = currentCompany.selection_status || "未応募";
    editCompanyDate.value = currentCompany.date || "";
    editCompanyPriority.value = currentCompany.priority || 1;
    editCompanyMemo.value = currentCompany.memo || "";

    editResearchBusiness.value = currentCompany.research_business || "";
    editResearchStrengths.value = currentCompany.research_strengths || "";
    editResearchProfile.value = currentCompany.research_profile || "";
    editResearchConnection.value = currentCompany.research_connection || "";
    editResearchPoints.value = currentCompany.research_points || "";
}

async function loadCompany() {
    const user = await getCurrentUser();
    const companyId = getCompanyId();

    if (!user || !companyId) {
        location.href = "companies.html";
        return;
    }

    const { data, error } = await supabaseClient
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .eq("user_id", user.id)
        .single();

    if (error || !data) {
        console.error(error);
        location.href = "companies.html";
        return;
    }

    currentCompany = data;

    displayCompany();

    await Promise.all([
        loadCompanyTexts(user.id, companyId),
        loadInterviews(user.id, companyId),
        loadCompanyTasks(user.id, companyId)
    ]);
}

async function loadCompanyTexts(userId, companyId) {
    const { data, error } = await supabaseClient
        .from("texts")
        .select("id, title, content, created_at")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    companyTextList.innerHTML = "";

    if (!data || data.length === 0) {
        noCompanyTexts.style.display = "block";
        return;
    }

    noCompanyTexts.style.display = "none";

    data.forEach(function(text) {
        const li = document.createElement("li");
        li.classList.add("company-linked-item");

        const title = document.createElement("strong");
        title.textContent = text.title;

        const content = document.createElement("p");
        content.textContent = text.content;

        li.appendChild(title);
        li.appendChild(content);

        companyTextList.appendChild(li);
    });
}

async function loadCompanyTasks(userId, companyId) {
    const { data, error } = await supabaseClient
        .from("tasks")
        .select("id, text, date, priority, completed, created_at")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .order("completed", { ascending: true })
        .order("date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    companyTasks = data || [];

    displayCompanyTasks();
}

function displayCompanyTasks() {
    companyTaskList.innerHTML = "";

    if (companyTasks.length === 0) {
        noCompanyTasks.style.display = "block";
        return;
    }

    noCompanyTasks.style.display = "none";

    companyTasks.forEach(function(task) {
        const li = document.createElement("li");
        li.classList.add("company-task-item");

        if (task.completed) {
            li.classList.add("completed");
        }

        const info = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = task.text;

        const meta = document.createElement("small");

        const dateText = task.date
            ? `期限：${task.date}`
            : "期限：未設定";

        const priorityText = task.priority
            ? ` / 優先度：${task.priority}`
            : "";

        meta.textContent = dateText + priorityText;

        info.appendChild(title);
        info.appendChild(meta);

        const buttons = document.createElement("div");
        buttons.classList.add("item-buttons");

        const completeButton = document.createElement("button");

        completeButton.textContent = task.completed
            ? "未完了に戻す"
            : "完了";

        completeButton.addEventListener("click", async function() {
            await updateTaskCompleted(task);
        });

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "削除";
        deleteButton.classList.add("delete-button");

        deleteButton.addEventListener("click", async function() {
            await deleteCompanyTask(task);
        });

        buttons.appendChild(completeButton);
        buttons.appendChild(deleteButton);

        li.appendChild(info);
        li.appendChild(buttons);

        companyTaskList.appendChild(li);
    });
}

async function updateTaskCompleted(task) {
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
        .eq("user_id", user.id)
        .eq("company_id", getCompanyId());

    if (error) {
        console.error(error);
        return;
    }

    await loadCompanyTasks(user.id, getCompanyId());
}

async function deleteCompanyTask(task) {
    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .delete()
        .eq("id", task.id)
        .eq("user_id", user.id)
        .eq("company_id", getCompanyId());

    if (error) {
        console.error(error);
        return;
    }

    await loadCompanyTasks(user.id, getCompanyId());
}

addCompanyTaskButton.addEventListener("click", async function() {
    const text = companyTaskInput.value.trim();
    const companyId = getCompanyId();

    if (text === "" || !companyId) {
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .insert({
            user_id: user.id,
            company_id: companyId,
            text: text,
            date: companyTaskDate.value || null,
            priority: companyTaskPriority.value || null,
            completed: false
        });

    if (error) {
        console.error(error);
        return;
    }

    companyTaskInput.value = "";
    companyTaskDate.value = "";
    companyTaskPriority.value = "";

    await loadCompanyTasks(user.id, companyId);
});

editCompanyButton.addEventListener("click", function() {
    editCompanySection.classList.remove("hidden");
    editCompanyName.focus();
});

cancelEditButton.addEventListener("click", function() {
    displayCompany();
    editCompanySection.classList.add("hidden");
});

saveCompanyButton.addEventListener("click", async function() {
    const user = await getCurrentUser();
    const companyId = getCompanyId();

    if (!user || !companyId) {
        return;
    }

    const name = editCompanyName.value.trim();

    if (name === "") {
        return;
    }

    const { data, error } = await supabaseClient
        .from("companies")
        .update({
            name: name,
            category: editCompanyCategory.value,
            selection_status: editCompanySelectionStatus.value,
            date: editCompanyDate.value || null,
            priority: Number(editCompanyPriority.value),
            memo: editCompanyMemo.value
        })
        .eq("id", companyId)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        console.error(error);
        return;
    }

    currentCompany = data;

    displayCompany();

    editCompanySection.classList.add("hidden");
});

editResearchButton.addEventListener("click", function() {
    editResearchSection.classList.remove("hidden");
    editResearchBusiness.focus();
});

cancelResearchButton.addEventListener("click", function() {
    displayCompany();
    editResearchSection.classList.add("hidden");
});

saveResearchButton.addEventListener("click", async function() {
    const user = await getCurrentUser();
    const companyId = getCompanyId();

    if (!user || !companyId) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("companies")
        .update({
            research_business: editResearchBusiness.value.trim(),
            research_strengths: editResearchStrengths.value.trim(),
            research_profile: editResearchProfile.value.trim(),
            research_connection: editResearchConnection.value.trim(),
            research_points: editResearchPoints.value.trim()
        })
        .eq("id", companyId)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        console.error(error);
        return;
    }

    currentCompany = data;

    displayCompany();

    editResearchSection.classList.add("hidden");
});

async function loadInterviews(userId, companyId) {
    const { data, error } = await supabaseClient
        .from("interviews")
        .select("*")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    interviews = data || [];

    displayInterviews();
}

function displayInterviews() {
    interviewList.innerHTML = "";

    if (interviews.length === 0) {
        noInterviews.style.display = "block";
        return;
    }

    noInterviews.style.display = "none";

    interviews.forEach(function(interview) {
        const interviewElement = document.createElement("li");
        interviewElement.classList.add("interview-item");

        const info = document.createElement("div");
        info.classList.add("interview-info");

        const heading = document.createElement("h3");
        heading.textContent = interview.stage || "面接";

        const date = document.createElement("p");
        date.textContent = `面接日：${interview.date || "未設定"}`;

        const interviewer = document.createElement("p");
        interviewer.textContent = `面接官：${interview.interviewer || "未設定"}`;

        const questions = createInterviewText(
            "聞かれた質問",
            interview.questions
        );

        const answers = createInterviewText(
            "自分の回答・振り返り",
            interview.answer_notes
        );

        const impression = createInterviewText(
            "面接の感想",
            interview.impression
        );

        const nextAction = createInterviewText(
            "次にやること",
            interview.next_action
        );

        info.appendChild(heading);
        info.appendChild(date);
        info.appendChild(interviewer);
        info.appendChild(questions);
        info.appendChild(answers);
        info.appendChild(impression);
        info.appendChild(nextAction);

        const buttons = document.createElement("div");
        buttons.classList.add("item-buttons");

        const editButton = document.createElement("button");

        editButton.textContent = "編集";

        editButton.addEventListener("click", function() {
            interviewDate.value = interview.date || "";
            interviewStage.value = interview.stage || "一次面接";
            interviewerInput.value = interview.interviewer || "";
            questionsInput.value = interview.questions || "";
            answerNotesInput.value = interview.answer_notes || "";
            impressionInput.value = interview.impression || "";
            nextActionInput.value = interview.next_action || "";

            editingInterviewId = interview.id;

            addInterviewButton.textContent = "面接記録を更新";

            interviewDate.focus();
        });

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "削除";
        deleteButton.classList.add("delete-button");

        deleteButton.addEventListener("click", async function() {
            const user = await getCurrentUser();

            if (!user) {
                return;
            }

            const { error } = await supabaseClient
                .from("interviews")
                .delete()
                .eq("id", interview.id)
                .eq("user_id", user.id)
                .eq("company_id", getCompanyId());

            if (error) {
                console.error(error);
                return;
            }

            await loadInterviews(user.id, getCompanyId());
        });

        buttons.appendChild(editButton);
        buttons.appendChild(deleteButton);

        interviewElement.appendChild(info);
        interviewElement.appendChild(buttons);

        interviewList.appendChild(interviewElement);
    });
}

function createInterviewText(label, value) {
    const p = document.createElement("p");

    const strong = document.createElement("strong");
    strong.textContent = label;

    const br = document.createElement("br");

    const text = document.createElement("span");
    text.textContent = value || "記録なし";

    p.appendChild(strong);
    p.appendChild(br);
    p.appendChild(text);

    return p;
}

addInterviewButton.addEventListener("click", async function() {
    const user = await getCurrentUser();
    const companyId = getCompanyId();

    if (!user || !companyId) {
        return;
    }

    const interviewData = {
        date: interviewDate.value || null,
        stage: interviewStage.value,
        interviewer: interviewerInput.value.trim(),
        questions: questionsInput.value.trim(),
        answer_notes: answerNotesInput.value.trim(),
        impression: impressionInput.value.trim(),
        next_action: nextActionInput.value.trim()
    };

    if (editingInterviewId !== null) {
        const { error } = await supabaseClient
            .from("interviews")
            .update(interviewData)
            .eq("id", editingInterviewId)
            .eq("user_id", user.id)
            .eq("company_id", companyId);

        if (error) {
            console.error(error);
            return;
        }

        editingInterviewId = null;
        addInterviewButton.textContent = "＋ 面接記録を保存";
    } else {
        const { error } = await supabaseClient
            .from("interviews")
            .insert({
                user_id: user.id,
                company_id: companyId,
                ...interviewData
            });

        if (error) {
            console.error(error);
            return;
        }
    }

    interviewDate.value = "";
    interviewStage.value = "一次面接";
    interviewerInput.value = "";
    questionsInput.value = "";
    answerNotesInput.value = "";
    impressionInput.value = "";
    nextActionInput.value = "";

    await loadInterviews(user.id, companyId);
});

loadCompany();