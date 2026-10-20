
const companyInput = document.getElementById("companyInput");
const companyIndustry = document.getElementById("companyIndustry");
const companyCategory = document.getElementById("companyCategory");
const companySelectionStatus = document.getElementById("companySelectionStatus");
const companyDate = document.getElementById("companyDate");
const companyPriority = document.getElementById("companyPriority");
const companyMemo = document.getElementById("companyMemo");

const addCompanyButton = document.getElementById("addCompanyButton");
const companyList = document.getElementById("companyList");

const companySearch = document.getElementById("companySearch");
const companyFilterIndustry = document.getElementById("companyFilterIndustry");
const companyFilterCategory = document.getElementById("companyFilterCategory");
const companyFilterStatus = document.getElementById("companyFilterStatus");
const companySort = document.getElementById("companySort");

let companies = [];
let editingCompanyId = null;

const categoryOrder = {
    "本命": 1,
    "目標": 2,
    "有力候補": 3,
    "気になる": 4
};

async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("ユーザー情報の取得に失敗しました:", error);
        alert("ユーザー情報を取得できませんでした。");
        return null;
    }

    return data.user;
}

async function loadCompanies() {
    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("企業一覧の取得に失敗しました:", error);
        alert("企業一覧を取得できませんでした。");
        return;
    }

    companies = data || [];
    displayCompanies();
}

function sortCompanies(companyArray) {
    const sorted = [...companyArray];

    sorted.sort(function(a, b) {
        if (companySort.value === "priority") {
            const priorityDifference =
                Number(b.priority || 1) - Number(a.priority || 1);

            if (priorityDifference !== 0) {
                return priorityDifference;
            }

            const categoryDifference =
                (categoryOrder[a.category] || 99) -
                (categoryOrder[b.category] || 99);

            if (categoryDifference !== 0) {
                return categoryDifference;
            }

            return (a.name || "").localeCompare(b.name || "", "ja");
        }

        if (companySort.value === "date") {
            if (!a.date && b.date) return 1;
            if (a.date && !b.date) return -1;

            if (a.date && b.date) {
                const dateDifference = a.date.localeCompare(b.date);

                if (dateDifference !== 0) {
                    return dateDifference;
                }
            }

            return (a.name || "").localeCompare(b.name || "", "ja");
        }

        return new Date(b.created_at) - new Date(a.created_at);
    });

    return sorted;
}

function createCompanyElement(company) {
    const companyElement = document.createElement("li");
    companyElement.classList.add("company-item");

    const companyInfo = document.createElement("div");
    companyInfo.classList.add("company-info");

    const title = document.createElement("h3");
    title.textContent = company.name || "企業名未設定";
    companyInfo.appendChild(title);

    const industryParagraph = document.createElement("p");
    industryParagraph.textContent =
        `業界：${company.industry || "未設定"}`;
    companyInfo.appendChild(industryParagraph);

    const categoryParagraph = document.createElement("p");
    categoryParagraph.append("志望カテゴリ：");

    const categoryBadge = document.createElement("span");
    categoryBadge.classList.add("status-badge");

    if (company.category) {
        categoryBadge.classList.add(`status-${company.category}`);
    }

    categoryBadge.textContent = company.category || "未設定";
    categoryParagraph.appendChild(categoryBadge);
    companyInfo.appendChild(categoryParagraph);

    const statusParagraph = document.createElement("p");
    statusParagraph.append("選考状況：");

    const statusBadge = document.createElement("span");
    statusBadge.classList.add("status-badge");

    if (company.selection_status) {
        statusBadge.classList.add(`status-${company.selection_status}`);
    }

    statusBadge.textContent = company.selection_status || "未設定";
    statusParagraph.appendChild(statusBadge);
    companyInfo.appendChild(statusParagraph);

    const dateParagraph = document.createElement("p");
    dateParagraph.textContent = `次の予定：${company.date || "未設定"}`;
    companyInfo.appendChild(dateParagraph);

    const priority = Math.min(
        5,
        Math.max(1, Number(company.priority) || 1)
    );

    const starsParagraph = document.createElement("p");
    starsParagraph.classList.add("company-stars");
    starsParagraph.textContent =
        "★".repeat(priority) + "☆".repeat(5 - priority);
    companyInfo.appendChild(starsParagraph);

    const memoParagraph = document.createElement("p");
    memoParagraph.classList.add("company-memo");
    memoParagraph.textContent = company.memo || "メモなし";
    companyInfo.appendChild(memoParagraph);

    const buttons = document.createElement("div");
    buttons.classList.add("item-buttons");

    const detailButton = document.createElement("button");
    detailButton.classList.add("detail-button");
    detailButton.textContent = "詳細";

    detailButton.addEventListener("click", function() {
        window.location.href =
            `company-detail.html?id=${encodeURIComponent(company.id)}`;
    });

    const editButton = document.createElement("button");
    editButton.classList.add("edit-button");
    editButton.textContent = "編集";

    editButton.addEventListener("click", function() {
        companyInput.value = company.name || "";
        companyIndustry.value = company.industry || "";
        companyCategory.value = company.category || "気になる";
        companySelectionStatus.value =
            company.selection_status || "未応募";
        companyDate.value = company.date || "";
        companyPriority.value = String(company.priority || 1);
        companyMemo.value = company.memo || "";

        editingCompanyId = company.id;
        addCompanyButton.textContent = "更新する";

        companyInput.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-company-button");
    deleteButton.textContent = "削除";

    deleteButton.addEventListener("click", async function() {
        const confirmed = window.confirm(
            `「${company.name}」を削除しますか？\n\nこの操作は取り消せません。`
        );

        if (!confirmed) {
            return;
        }

        const user = await getCurrentUser();

        if (!user) {
            return;
        }

        const { error } = await supabaseClient
            .from("companies")
            .delete()
            .eq("id", company.id)
            .eq("user_id", user.id);

        if (error) {
            console.error("企業の削除に失敗しました:", error);
            alert("企業を削除できませんでした。");
            return;
        }

        if (editingCompanyId === company.id) {
            resetCompanyForm();
        }

        await loadCompanies();
    });

    buttons.append(detailButton, editButton, deleteButton);
    companyElement.append(companyInfo, buttons);

    return companyElement;
}

function displayCompanies() {
    companyList.replaceChildren();

    const searchText =
        companySearch.value.trim().toLocaleLowerCase("ja");

    let displayedCompanies = companies.filter(function(company) {
        const name = (company.name || "").toLocaleLowerCase("ja");
        const memo = (company.memo || "").toLocaleLowerCase("ja");

        const matchesSearch =
            name.includes(searchText) || memo.includes(searchText);

        const matchesIndustry =
            companyFilterIndustry.value === "すべて" ||
            (company.industry || "") === companyFilterIndustry.value;

        const matchesCategory =
            companyFilterCategory.value === "すべて" ||
            company.category === companyFilterCategory.value;

        const matchesStatus =
            companyFilterStatus.value === "すべて" ||
            company.selection_status === companyFilterStatus.value;

        return (
            matchesSearch &&
            matchesIndustry &&
            matchesCategory &&
            matchesStatus
        );
    });

    displayedCompanies = sortCompanies(displayedCompanies);

    if (displayedCompanies.length === 0) {
        const emptyMessage = document.createElement("li");

        emptyMessage.textContent = companies.length === 0
            ? "登録企業はまだありません。"
            : "条件に一致する企業がありません。";

        companyList.appendChild(emptyMessage);
        return;
    }

    displayedCompanies.forEach(function(company) {
        companyList.appendChild(createCompanyElement(company));
    });
}

function resetCompanyForm() {
    companyInput.value = "";
    companyIndustry.value = "";
    companyCategory.value = "本命";
    companySelectionStatus.value = "未応募";
    companyDate.value = "";
    companyPriority.value = "5";
    companyMemo.value = "";

    editingCompanyId = null;
    addCompanyButton.textContent = "＋ 企業を登録";
}

addCompanyButton.addEventListener("click", async function() {
    const companyName = companyInput.value.trim();

    if (companyName === "") {
        alert("企業名を入力してください。");
        companyInput.focus();
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    const companyData = {
        name: companyName,
        industry: companyIndustry.value || null,
        category: companyCategory.value,
        selection_status: companySelectionStatus.value,
        date: companyDate.value || null,
        priority: Number(companyPriority.value),
        memo: companyMemo.value.trim()
    };

    if (editingCompanyId !== null) {
        const { error } = await supabaseClient
            .from("companies")
            .update(companyData)
            .eq("id", editingCompanyId)
            .eq("user_id", user.id);

        if (error) {
            console.error("企業の更新に失敗しました:", error);
            alert("企業を更新できませんでした。");
            return;
        }
    } else {
        const { error } = await supabaseClient
            .from("companies")
            .insert({
                user_id: user.id,
                ...companyData
            });

        if (error) {
            console.error("企業の登録に失敗しました:", error);
            alert("企業を登録できませんでした。");
            return;
        }
    }

    resetCompanyForm();
    await loadCompanies();
});

companySearch.addEventListener("input", displayCompanies);
companyFilterIndustry.addEventListener("change", displayCompanies);
companyFilterCategory.addEventListener("change", displayCompanies);
companyFilterStatus.addEventListener("change", displayCompanies);
companySort.addEventListener("change", displayCompanies);

loadCompanies();
