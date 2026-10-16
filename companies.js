const companyInput = document.getElementById("companyInput");
const companyCategory = document.getElementById("companyCategory");
const companySelectionStatus = document.getElementById("companySelectionStatus");
const companyDate = document.getElementById("companyDate");
const companyPriority = document.getElementById("companyPriority");
const companyMemo = document.getElementById("companyMemo");

const addCompanyButton = document.getElementById("addCompanyButton");
const companyList = document.getElementById("companyList");

const companySearch = document.getElementById("companySearch");
const companyFilterCategory = document.getElementById("companyFilterCategory");
const companyFilterStatus = document.getElementById("companyFilterStatus");
const companySort = document.getElementById("companySort");

let companies = [];

let editingCompanyId = null;

async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error(error);
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
        console.error(error);
        return;
    }

    companies = data;

    displayCompanies();
}

function displayCompanies() {
    companyList.innerHTML = "";

    let displayedCompanies = [...companies];

    const searchText = companySearch.value.toLowerCase();

    displayedCompanies = displayedCompanies.filter(function(company) {
        return company.name.toLowerCase().includes(searchText);
    });

    if (companyFilterCategory.value !== "すべて") {
        displayedCompanies = displayedCompanies.filter(function(company) {
            return company.category === companyFilterCategory.value;
        });
    }

    if (companyFilterStatus.value !== "すべて") {
        displayedCompanies = displayedCompanies.filter(function(company) {
            return company.selection_status === companyFilterStatus.value;
        });
    }

    if (companySort.value === "priority") {
        displayedCompanies.sort(function(a, b) {
            return Number(b.priority || 0) - Number(a.priority || 0);
        });
    }

    if (companySort.value === "date") {
        displayedCompanies.sort(function(a, b) {
            if (!a.date) return 1;
            if (!b.date) return -1;

            return a.date.localeCompare(b.date);
        });
    }

    if (companySort.value === "new") {
        displayedCompanies.sort(function(a, b) {
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }

    displayedCompanies.forEach(function(company) {
        const companyElement = document.createElement("li");

        companyElement.classList.add("company-item");

        const priority = Number(company.priority) || 1;

        companyElement.innerHTML = `
            <div class="company-info">
                <h3>${company.name}</h3>

                <p>
                    志望カテゴリ：
                    <span class="status-badge status-${company.category}">
                        ${company.category || "未設定"}
                    </span>
                </p>

                <p>
                    選考状況：
                    <span class="status-badge status-${company.selection_status}">
                        ${company.selection_status || "未設定"}
                    </span>
                </p>

                <p>
                    次の予定：${company.date || "未設定"}
                </p>

                <p class="company-stars">
                    ${"★".repeat(priority)}
                    ${"☆".repeat(5 - priority)}
                </p>

                <p class="company-memo">
                    ${company.memo || "メモなし"}
                </p>
            </div>

            <div class="item-buttons">
                <button class="detail-button">
                    詳細
                </button>

                <button class="edit-button">
                    編集
                </button>

                <button class="delete-company-button">
                    削除
                </button>
            </div>
        `;

        const detailButton = companyElement.querySelector(".detail-button");

        detailButton.addEventListener("click", function() {
            window.location.href = `company-detail.html?id=${company.id}`;
        });

        const editButton = companyElement.querySelector(".edit-button");

        editButton.addEventListener("click", function() {
            companyInput.value = company.name;
            companyCategory.value = company.category || "気になる";
            companySelectionStatus.value = company.selection_status || "未応募";
            companyDate.value = company.date || "";
            companyPriority.value = company.priority || 1;
            companyMemo.value = company.memo || "";

            editingCompanyId = company.id;

            addCompanyButton.textContent = "更新する";

            companyInput.focus();
        });

        const deleteButton = companyElement.querySelector(".delete-company-button");

        deleteButton.addEventListener("click", async function() {
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
                console.error(error);
                return;
            }

            loadCompanies();
        });

        companyList.appendChild(companyElement);
    });
}

addCompanyButton.addEventListener("click", async function() {
    const companyName = companyInput.value.trim();

    if (companyName === "") {
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    if (editingCompanyId !== null) {
        const { error } = await supabaseClient
            .from("companies")
            .update({
                name: companyName,
                category: companyCategory.value,
                selection_status: companySelectionStatus.value,
                date: companyDate.value || null,
                priority: Number(companyPriority.value),
                memo: companyMemo.value
            })
            .eq("id", editingCompanyId)
            .eq("user_id", user.id);

        if (error) {
            console.error(error);
            return;
        }

        editingCompanyId = null;
        addCompanyButton.textContent = "＋ 企業を登録";
    } else {
        const { error } = await supabaseClient
            .from("companies")
            .insert({
                user_id: user.id,
                name: companyName,
                category: companyCategory.value,
                selection_status: companySelectionStatus.value,
                date: companyDate.value || null,
                priority: Number(companyPriority.value),
                memo: companyMemo.value
            });

        if (error) {
            console.error(error);
            return;
        }
    }

    companyInput.value = "";
    companyDate.value = "";
    companyMemo.value = "";

    loadCompanies();
});

companySearch.addEventListener("input", displayCompanies);
companyFilterCategory.addEventListener("change", displayCompanies);
companyFilterStatus.addEventListener("change", displayCompanies);
companySort.addEventListener("change", displayCompanies);

loadCompanies();