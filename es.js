const $ = (id) => document.getElementById(id);

const applicationTitle = $("applicationTitle");
const applicationCompany = $("applicationCompany");
const applicationType = $("applicationType");
const applicationDeadline = $("applicationDeadline");
const applicationStatus = $("applicationStatus");
const applicationMemo = $("applicationMemo");
const saveApplicationButton = $("saveApplicationButton");
const applicationList = $("applicationList");

const questionApplication = $("questionApplication");
const questionPrompt = $("questionPrompt");
const questionCategory = $("questionCategory");
const questionCharLimit = $("questionCharLimit");
const questionDeadline = $("questionDeadline");
const questionStatus = $("questionStatus");
const questionSourceText = $("questionSourceText");
const questionAnswer = $("questionAnswer");
const questionMemo = $("questionMemo");
const questionTextCount = $("questionTextCount");
const saveQuestionButton = $("saveQuestionButton");
const questionList = $("questionList");

const materialTitle = $("materialTitle");
const materialCategory = $("materialCategory");
const materialTags = $("materialTags");
const materialCompany = $("materialCompany");
const materialContent = $("materialContent");
const materialTextCount = $("materialTextCount");
const saveMaterialButton = $("saveMaterialButton");
const materialList = $("materialList");

let companies = [];
let applications = [];
let questions = [];
let texts = [];

let editingApplicationId = null;
let editingQuestionId = null;
let editingMaterialId = null;

const params = new URLSearchParams(window.location.search);
const initialCompanyId = params.get("company");
const initialTextId = params.get("id");

async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        console.error("ユーザー情報を取得できません:", error);
        return null;
    }

    return data.user;
}

function makeElement(tag, text, className) {
    const element = document.createElement(tag);

    if (text !== undefined && text !== null) {
        element.textContent = text;
    }

    if (className) {
        element.className = className;
    }

    return element;
}

function makeButton(text, className, handler) {
    const button = makeElement("button", text, className);
    button.type = "button";
    button.addEventListener("click", handler);
    return button;
}

function makeOption(value, text) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    return option;
}

function setSelectOptions(select, firstLabel, rows, valueField, labelField) {
    const previousValue = select.value;
    select.replaceChildren(makeOption("", firstLabel));

    rows.forEach((row) => {
        select.appendChild(makeOption(row[valueField], row[labelField]));
    });

    if ([...select.options].some((option) => option.value === previousValue)) {
        select.value = previousValue;
    }
}

function companyName(companyId) {
    const company = companies.find((item) => item.id === companyId);
    return company ? company.name : "企業未指定";
}

function applicationName(applicationId) {
    const application = applications.find((item) => item.id === applicationId);

    if (!application) {
        return "選考未指定";
    }

    return `${companyName(application.company_id)} / ${application.title}`;
}

function updateCharacterCount(textarea, output, limitInput) {
    const count = textarea.value.length;
    const limit = limitInput ? Number(limitInput.value) : 0;

    output.textContent = limit > 0
        ? `${count}文字 / ${limit}文字（${count > limit ? `${count - limit}文字超過` : `残り${limit - count}文字`}）`
        : `${count}文字`;

    output.style.color = limit > 0 && count > limit ? "red" : "";
}

function updateQuestionCount() {
    updateCharacterCount(questionAnswer, questionTextCount, questionCharLimit);
}

function updateMaterialCount() {
    updateCharacterCount(materialContent, materialTextCount, null);
}

async function loadAll() {
    const user = await getCurrentUser();

    if (!user) {
        alert("ログイン状態を確認できません。再度ログインしてください。");
        return;
    }

    const results = await Promise.all([
        supabaseClient
            .from("companies")
            .select("id, name")
            .eq("user_id", user.id)
            .order("name", { ascending: true }),

        supabaseClient
            .from("es_applications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),

        supabaseClient
            .from("es_questions")
            .select("*")
            .eq("user_id", user.id)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),

        supabaseClient
            .from("texts")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
    ]);

    const errorResult = results.find((result) => result.error);

    if (errorResult) {
        console.error("ESデータの読み込みに失敗しました:", errorResult.error);
        alert("データを読み込めませんでした。画面を再読み込みしてください。");
        return;
    }

    companies = results[0].data || [];
    applications = results[1].data || [];
    questions = results[2].data || [];
    texts = results[3].data || [];

    setSelectOptions(applicationCompany, "企業を指定しない", companies, "id", "name");
    setSelectOptions(materialCompany, "企業を指定しない", companies, "id", "name");
    setSelectOptions(questionApplication, "選考を選択してください", applications, "id", "title");
    setSelectOptions(questionSourceText, "素材を選択してください", texts, "id", "title");

    setQuestionApplicationLabels();
    displayApplications();
    displayQuestions();
    displayMaterials();
    updateDashboard();

    if (initialCompanyId && companies.some((company) => company.id === initialCompanyId)) {
        applicationCompany.value = initialCompanyId;
        materialCompany.value = initialCompanyId;
    }

    if (initialTextId) {
        const text = texts.find((item) => item.id === initialTextId);

        if (text) {
            editMaterial(text);
            showView("materials");
        }
    }
}

function setQuestionApplicationLabels() {
    const select = $("questionFilterApplication");
    const previous = select.value;

    select.replaceChildren(makeOption("すべて", "すべての選考"));

    applications.forEach((application) => {
        select.appendChild(makeOption(
            application.id,
            applicationName(application.id)
        ));
    });

    if ([...select.options].some((option) => option.value === previous)) {
        select.value = previous;
    }
}

function updateDashboard() {
    const total = questions.length;
    const completed = questions.filter((item) =>
        item.status === "完成" || item.status === "提出済み"
    ).length;
    const submitted = questions.filter((item) => item.status === "提出済み").length;
    const inProgress = questions.filter((item) => item.status === "作成中").length;
    const untouched = questions.filter((item) => item.status === "未着手").length;

    const dashboard = $("esDashboard");
    dashboard.replaceChildren();

    const stats = [
        ["選考", applications.length],
        ["設問", total],
        ["完成・提出済み", completed],
        ["提出済み", submitted],
        ["作成中", inProgress],
        ["未着手", untouched]
    ];

    stats.forEach(([label, value]) => {
        const card = makeElement("div", undefined, "es-stat");
        card.append(
            makeElement("p", label),
            makeElement("strong", String(value))
        );
        dashboard.appendChild(card);
    });

    const progress = total ? Math.round(completed / total * 100) : 0;
    dashboard.appendChild(makeElement("p", `設問の完成率：${progress}%`));
}

function displayApplications() {
    const search = $("applicationSearch").value.trim().toLocaleLowerCase("ja");
    const typeFilter = $("applicationFilterType").value;
    const statusFilter = $("applicationFilterStatus").value;

    applicationList.replaceChildren();

    const filtered = applications.filter((item) => {
        const searchTarget =
            `${item.title} ${companyName(item.company_id)} ${item.memo || ""}`
                .toLocaleLowerCase("ja");

        return searchTarget.includes(search)
            && (typeFilter === "すべて" || item.selection_type === typeFilter)
            && (statusFilter === "すべて" || item.status === statusFilter);
    });

    if (!filtered.length) {
        applicationList.appendChild(makeElement("li", "条件に合う選考がありません。"));
        return;
    }

    filtered.forEach((application) => {
        const li = makeElement("li", undefined, "es-application-item");
        const info = makeElement("div");
        const questionCount = questions.filter(
            (question) => question.application_id === application.id
        ).length;
        const completedCount = questions.filter(
            (question) => question.application_id === application.id
                && ["完成", "提出済み"].includes(question.status)
        ).length;

        info.append(
            makeElement("h3", application.title),
            makeElement("p", `企業：${companyName(application.company_id)}`),
            makeElement("p", `区分：${application.selection_type} / 進捗：${application.status}`),
            makeElement("p", `設問：${questionCount}件 / 完成：${completedCount}件`),
            makeElement("p", `提出期限：${application.deadline || "未設定"}`)
        );

        if (application.memo) {
            info.appendChild(makeElement("p", `メモ：${application.memo}`));
        }

        const buttons = makeElement("div", undefined, "item-buttons");

        buttons.append(
            makeButton("設問を見る", "", () => {
                questionApplication.value = application.id;
                $("questionFilterApplication").value = application.id;
                $("selectedApplicationMessage").textContent =
                    `選択中：${applicationName(application.id)}`;
                displayQuestions();
                $("questionsSection").scrollIntoView({ behavior: "smooth" });
            }),
            makeButton("編集", "edit-button", () => editApplication(application)),
            makeButton("削除", "delete-button", () => deleteApplication(application))
        );

        li.append(info, buttons);
        applicationList.appendChild(li);
    });
}

function editApplication(application) {
    editingApplicationId = application.id;
    applicationTitle.value = application.title;
    applicationCompany.value = application.company_id || "";
    applicationType.value = application.selection_type || "本選考";
    applicationDeadline.value = application.deadline || "";
    applicationStatus.value = application.status || "準備中";
    applicationMemo.value = application.memo || "";

    $("applicationFormHeading").textContent = "選考を編集";
    saveApplicationButton.textContent = "変更を保存";
    $("cancelApplicationEditButton").hidden = false;
    applicationTitle.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetApplicationForm() {
    editingApplicationId = null;
    applicationTitle.value = "";
    applicationCompany.value = "";
    applicationType.value = "本選考";
    applicationDeadline.value = "";
    applicationStatus.value = "準備中";
    applicationMemo.value = "";

    $("applicationFormHeading").textContent = "選考を追加";
    saveApplicationButton.textContent = "選考を登録";
    $("cancelApplicationEditButton").hidden = true;
}

async function deleteApplication(application) {
    if (!window.confirm(
        `「${application.title}」を削除しますか？\n紐づく設問も削除されます。`
    )) {
        return;
    }

    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabaseClient
        .from("es_applications")
        .delete()
        .eq("id", application.id)
        .eq("user_id", user.id);

    if (error) {
        console.error(error);
        alert("選考を削除できませんでした。");
        return;
    }

    if (editingApplicationId === application.id) resetApplicationForm();
    if (editingQuestionId && questions.some(
        (item) => item.id === editingQuestionId && item.application_id === application.id
    )) {
        resetQuestionForm();
    }

    await loadAll();
}

async function saveApplication() {
    const title = applicationTitle.value.trim();

    if (!title) {
        alert("選考名を入力してください。");
        applicationTitle.focus();
        return;
    }

    const user = await getCurrentUser();
    if (!user) return;

    const record = {
        user_id: user.id,
        title,
        company_id: applicationCompany.value || null,
        selection_type: applicationType.value,
        deadline: applicationDeadline.value || null,
        status: applicationStatus.value,
        memo: applicationMemo.value.trim() || null,
        updated_at: new Date().toISOString()
    };

    let result;

    if (editingApplicationId) {
        result = await supabaseClient
            .from("es_applications")
            .update(record)
            .eq("id", editingApplicationId)
            .eq("user_id", user.id);
    } else {
        result = await supabaseClient.from("es_applications").insert(record);
    }

    if (result.error) {
        console.error(result.error);
        alert("選考を保存できませんでした。");
        return;
    }

    resetApplicationForm();
    await loadAll();
}

function displayQuestions() {
    const search = $("questionSearch").value.trim().toLocaleLowerCase("ja");
    const applicationFilter = $("questionFilterApplication").value;
    const categoryFilter = $("questionFilterCategory").value;
    const statusFilter = $("questionFilterStatus").value;

    questionList.replaceChildren();

    const filtered = questions.filter((question) => {
        const searchTarget = [
            question.prompt,
            question.answer,
            question.memo || "",
            applicationName(question.application_id)
        ].join(" ").toLocaleLowerCase("ja");

        return searchTarget.includes(search)
            && (applicationFilter === "すべて" || question.application_id === applicationFilter)
            && (categoryFilter === "すべて" || question.category === categoryFilter)
            && (statusFilter === "すべて" || question.status === statusFilter);
    });

    if (!filtered.length) {
        questionList.appendChild(makeElement("li", "条件に合う設問がありません。"));
        return;
    }

    filtered.forEach((question) => {
        const li = makeElement("li", undefined, "es-question-item");
        const info = makeElement("div");

        info.append(
            makeElement("h3", question.prompt),
            makeElement("p", applicationName(question.application_id)),
            makeElement("p", `カテゴリ：${question.category} / 進捗：${question.status}`),
            makeElement("p", `文字数：${(question.answer || "").length} / ${question.char_limit || "制限なし"}`),
            makeElement("p", `期限：${question.deadline || "未設定"}`)
        );

        const preview = makeElement("p", question.answer || "回答は未入力です。");
        preview.style.whiteSpace = "pre-wrap";
        info.appendChild(preview);

        if (question.memo) info.appendChild(makeElement("p", `メモ：${question.memo}`));

        const buttons = makeElement("div", undefined, "item-buttons");
        buttons.append(
            makeButton("編集", "edit-button", () => editQuestion(question)),
            makeButton("回答をコピー", "", async () => {
                try {
                    await navigator.clipboard.writeText(question.answer || "");
                    alert("回答をコピーしました。");
                } catch (error) {
                    console.error(error);
                    alert("コピーできませんでした。回答欄からコピーしてください。");
                }
            }),
            makeButton("削除", "delete-button", () => deleteQuestion(question))
        );

        li.append(info, buttons);
        questionList.appendChild(li);
    });
}

function editQuestion(question) {
    editingQuestionId = question.id;
    questionApplication.value = question.application_id;
    questionPrompt.value = question.prompt;
    questionCategory.value = question.category || "その他";
    questionCharLimit.value = question.char_limit || "";
    questionDeadline.value = question.deadline || "";
    questionStatus.value = question.status || "未着手";
    questionSourceText.value = question.source_text_id || "";
    questionAnswer.value = question.answer || "";
    questionMemo.value = question.memo || "";

    $("questionFormHeading").textContent = "設問を編集";
    saveQuestionButton.textContent = "変更を保存";
    $("cancelQuestionEditButton").hidden = false;
    $("selectedApplicationMessage").textContent =
        `選択中：${applicationName(question.application_id)}`;

    updateQuestionCount();
    questionPrompt.focus();
    $("questionsSection").scrollIntoView({ behavior: "smooth" });
}

function resetQuestionForm() {
    editingQuestionId = null;
    questionPrompt.value = "";
    questionCategory.value = "ガクチカ";
    questionCharLimit.value = "";
    questionDeadline.value = "";
    questionStatus.value = "未着手";
    questionSourceText.value = "";
    questionAnswer.value = "";
    questionMemo.value = "";

    $("questionFormHeading").textContent = "設問を追加";
    saveQuestionButton.textContent = "設問を登録";
    $("cancelQuestionEditButton").hidden = true;
    updateQuestionCount();
}

async function saveQuestion() {
    const applicationId = questionApplication.value;
    const prompt = questionPrompt.value.trim();

    if (!applicationId) {
        alert("対象の選考を選択してください。");
        questionApplication.focus();
        return;
    }

    if (!prompt) {
        alert("設問文を入力してください。");
        questionPrompt.focus();
        return;
    }

    const user = await getCurrentUser();
    if (!user) return;

    const limit = questionCharLimit.value === ""
        ? null
        : Number(questionCharLimit.value);

    if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
        alert("文字数制限は1以上の整数で入力してください。");
        questionCharLimit.focus();
        return;
    }

    const record = {
        user_id: user.id,
        application_id: applicationId,
        prompt,
        category: questionCategory.value,
        answer: questionAnswer.value,
        char_limit: limit,
        status: questionStatus.value,
        source_text_id: questionSourceText.value || null,
        deadline: questionDeadline.value || null,
        memo: questionMemo.value.trim() || null,
        updated_at: new Date().toISOString()
    };

    let result;

    if (editingQuestionId) {
        result = await supabaseClient
            .from("es_questions")
            .update(record)
            .eq("id", editingQuestionId)
            .eq("user_id", user.id);
    } else {
        record.sort_order = questions.filter(
            (item) => item.application_id === applicationId
        ).length;

        result = await supabaseClient.from("es_questions").insert(record);
    }

    if (result.error) {
        console.error(result.error);
        alert("設問を保存できませんでした。");
        return;
    }

    $("questionFilterApplication").value = applicationId;
    resetQuestionForm();
    await loadAll();
}

async function deleteQuestion(question) {
    if (!window.confirm("この設問を削除しますか？")) return;

    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabaseClient
        .from("es_questions")
        .delete()
        .eq("id", question.id)
        .eq("user_id", user.id);

    if (error) {
        console.error(error);
        alert("設問を削除できませんでした。");
        return;
    }

    if (editingQuestionId === question.id) resetQuestionForm();
    await loadAll();
}

function displayMaterials() {
    const search = $("materialSearch").value.trim().toLocaleLowerCase("ja");
    const categoryFilter = $("materialFilterCategory").value;

    materialList.replaceChildren();

    const filtered = texts.filter((text) => {
        const tagText = Array.isArray(text.tags) ? text.tags.join(" ") : "";
        const searchTarget =
            `${text.title} ${text.content} ${tagText}`.toLocaleLowerCase("ja");

        return searchTarget.includes(search)
            && (categoryFilter === "すべて" || (text.category || "その他") === categoryFilter);
    });

    if (!filtered.length) {
        materialList.appendChild(makeElement("li", "条件に合う素材がありません。"));
        return;
    }

    filtered.forEach((text) => {
        const li = makeElement("li", undefined, "es-material-item");
        const info = makeElement("div");

        info.append(
            makeElement("h3", text.title),
            makeElement("p", `カテゴリ：${text.category || "その他"}`),
            makeElement("p", `企業：${companyName(text.company_id)}`),
            makeElement("p", `文字数：${(text.content || "").length}`)
        );

        if (text.tags && text.tags.length) {
            info.appendChild(makeElement("p", `タグ：${text.tags.join("、")}`));
        }

        const content = makeElement("p", text.content || "");
        content.style.whiteSpace = "pre-wrap";
        info.appendChild(content);

        const buttons = makeElement("div", undefined, "item-buttons");
        buttons.append(
            makeButton("設問の回答に使う", "", () => {
                questionSourceText.value = text.id;
                questionAnswer.value = text.content || "";
                updateQuestionCount();
                showView("applications");
                $("questionsSection").scrollIntoView({ behavior: "smooth" });
            }),
            makeButton("編集", "edit-button", () => editMaterial(text)),
            makeButton("削除", "delete-button", () => deleteMaterial(text))
        );

        li.append(info, buttons);
        materialList.appendChild(li);
    });
}

function editMaterial(text) {
    editingMaterialId = text.id;
    materialTitle.value = text.title || "";
    materialCategory.value = text.category || "その他";
    materialTags.value = Array.isArray(text.tags) ? text.tags.join(", ") : "";
    materialCompany.value = text.company_id || "";
    materialContent.value = text.content || "";

    $("materialFormHeading").textContent = "ES素材を編集";
    saveMaterialButton.textContent = "変更を保存";
    $("cancelMaterialEditButton").hidden = false;

    updateMaterialCount();
    materialTitle.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetMaterialForm() {
    editingMaterialId = null;
    materialTitle.value = "";
    materialCategory.value = "ガクチカ";
    materialTags.value = "";
    materialCompany.value = "";
    materialContent.value = "";

    $("materialFormHeading").textContent = "ES素材を追加";
    saveMaterialButton.textContent = "素材を保存";
    $("cancelMaterialEditButton").hidden = true;

    updateMaterialCount();
}

async function saveMaterial() {
    const title = materialTitle.value.trim();
    const content = materialContent.value.trim();

    if (!title || !content) {
        alert("タイトルと文章を入力してください。");
        return;
    }

    const user = await getCurrentUser();
    if (!user) return;

    const tags = materialTags.value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

    const record = {
        user_id: user.id,
        title,
        content,
        category: materialCategory.value,
        tags,
        company_id: materialCompany.value || null,
        updated_at: new Date().toISOString()
    };

    let result;

    if (editingMaterialId) {
        result = await supabaseClient
            .from("texts")
            .update(record)
            .eq("id", editingMaterialId)
            .eq("user_id", user.id);
    } else {
        result = await supabaseClient.from("texts").insert(record);
    }

    if (result.error) {
        console.error(result.error);
        alert("素材を保存できませんでした。");
        return;
    }

    resetMaterialForm();
    await loadAll();
}

async function deleteMaterial(text) {
    if (!window.confirm(
        `「${text.title}」を削除しますか？\n設問にコピー済みの回答本文はそのまま残ります。`
    )) return;

    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabaseClient
        .from("texts")
        .delete()
        .eq("id", text.id)
        .eq("user_id", user.id);

    if (error) {
        console.error(error);
        alert("素材を削除できませんでした。");
        return;
    }

    if (editingMaterialId === text.id) resetMaterialForm();
    await loadAll();
}

function showView(view) {
    const materials = view === "materials";
    $("applicationsView").hidden = materials;
    $("materialsView").hidden = !materials;
    $("showApplicationsButton").disabled = !materials;
    $("showMaterialsButton").disabled = materials;
}

$("showApplicationsButton").addEventListener("click", () => showView("applications"));
$("showMaterialsButton").addEventListener("click", () => showView("materials"));

saveApplicationButton.addEventListener("click", saveApplication);
saveQuestionButton.addEventListener("click", saveQuestion);
saveMaterialButton.addEventListener("click", saveMaterial);

$("cancelApplicationEditButton").addEventListener("click", resetApplicationForm);
$("cancelQuestionEditButton").addEventListener("click", resetQuestionForm);
$("cancelMaterialEditButton").addEventListener("click", resetMaterialForm);

questionAnswer.addEventListener("input", updateQuestionCount);
questionCharLimit.addEventListener("input", updateQuestionCount);
materialContent.addEventListener("input", updateMaterialCount);

$("copyMaterialButton").addEventListener("click", () => {
    const text = texts.find((item) => item.id === questionSourceText.value);

    if (!text) {
        alert("コピーする素材を選択してください。");
        return;
    }

    questionAnswer.value = text.content || "";
    updateQuestionCount();
});

$("applicationSearch").addEventListener("input", displayApplications);
$("applicationFilterType").addEventListener("change", displayApplications);
$("applicationFilterStatus").addEventListener("change", displayApplications);

$("questionSearch").addEventListener("input", displayQuestions);
$("questionFilterApplication").addEventListener("change", displayQuestions);
$("questionFilterCategory").addEventListener("change", displayQuestions);
$("questionFilterStatus").addEventListener("change", displayQuestions);

$("materialSearch").addEventListener("input", displayMaterials);
$("materialFilterCategory").addEventListener("change", displayMaterials);

questionApplication.addEventListener("change", () => {
    $("selectedApplicationMessage").textContent = questionApplication.value
        ? `選択中：${applicationName(questionApplication.value)}`
        : "先に選考を選択してください。";
});

async function initialize() {
    updateQuestionCount();
    updateMaterialCount();
    await loadAll();

    if (initialCompanyId) {
        applicationCompany.value = initialCompanyId;
        materialCompany.value = initialCompanyId;
    }
}

initialize();