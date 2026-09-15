const companyInput = document.getElementById("companyInput");
const companyStatus = document.getElementById("companyStatus");
const companyDate = document.getElementById("companyDate");
const companyPriority = document.getElementById("companyPriority");
const companyMemo = document.getElementById("companyMemo");

const addCompanyButton = document.getElementById("addCompanyButton");
const companyList = document.getElementById("companyList");

const companySearch = document.getElementById("companySearch");
const companyFilter = document.getElementById("companyFilter");
const companySort = document.getElementById("companySort");


let companies = JSON.parse(localStorage.getItem("companies")) || [];

let editingCompanyId = null;


/* =========================
   保存
========================= */

function saveCompanies() {

    localStorage.setItem(
        "companies",
        JSON.stringify(companies)
    );

}


/* =========================
   企業表示
========================= */

function displayCompanies() {

    companyList.innerHTML = "";


    let displayedCompanies = [...companies];


    /* 検索 */

    const searchText =
        companySearch.value.toLowerCase();


    displayedCompanies =
        displayedCompanies.filter(function(company) {

            return company.name
                .toLowerCase()
                .includes(searchText);

        });


    /* 選考状況で絞り込み */

    if (companyFilter.value !== "すべて") {

        displayedCompanies =
            displayedCompanies.filter(function(company) {

                return company.status === companyFilter.value;

            });

    }


    /* 並び替え */

    if (companySort.value === "priority") {

        displayedCompanies.sort(function(a, b) {

            return Number(b.priority || 0)
                - Number(a.priority || 0);

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

            return b.id - a.id;

        });

    }


    /* 企業を表示 */

    displayedCompanies.forEach(function(company) {

        const companyElement =
            document.createElement("li");

        companyElement.classList.add("company-item");


        const priority =
            Number(company.priority) || 1;


        companyElement.innerHTML = `

            <div class="company-info">

                <h3>${company.name}</h3>


                <p>
                    選考状況：
                    <strong>${company.status}</strong>
                </p>


                <p>
                    次の予定：
                    ${company.date || "未設定"}
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

                <button class="edit-button">
                    編集
                </button>


                <button class="delete-company-button">
                    削除
                </button>

            </div>

        `;


        /* 編集 */

        const editButton =
            companyElement.querySelector(".edit-button");


        editButton.addEventListener("click", function() {

            companyInput.value = company.name;

            companyStatus.value = company.status;

            companyDate.value = company.date || "";

            companyPriority.value =
                company.priority || 1;

            companyMemo.value =
                company.memo || "";


            editingCompanyId = company.id;


            addCompanyButton.textContent =
                "更新する";


            companyInput.focus();

        });


        /* 削除 */

        const deleteButton =
            companyElement.querySelector(
                ".delete-company-button"
            );


        deleteButton.addEventListener("click", function() {

            companies =
                companies.filter(function(item) {

                    return item.id !== company.id;

                });


            saveCompanies();

            displayCompanies();

        });


        companyList.appendChild(companyElement);

    });

}


/* =========================
   登録・更新
========================= */

addCompanyButton.addEventListener("click", function() {

    const companyName =
        companyInput.value;


    if (companyName === "") {

        return;

    }


    /* 編集中 */

    if (editingCompanyId !== null) {

        const company =
            companies.find(function(item) {

                return item.id === editingCompanyId;

            });


        company.name = companyName;

        company.status =
            companyStatus.value;

        company.date =
            companyDate.value;

        company.priority =
            Number(companyPriority.value);

        company.memo =
            companyMemo.value;


        editingCompanyId = null;


        addCompanyButton.textContent =
            "＋ 企業を登録";

    }


    /* 新規登録 */

    else {

        const newCompany = {

            id: Date.now(),

            name: companyName,

            status: companyStatus.value,

            date: companyDate.value,

            priority: Number(companyPriority.value),

            memo: companyMemo.value

        };


        companies.push(newCompany);

    }


    saveCompanies();

    displayCompanies();


    companyInput.value = "";

    companyDate.value = "";

    companyMemo.value = "";

});


/* =========================
   検索・絞り込み・並び替え
========================= */

companySearch.addEventListener(
    "input",
    displayCompanies
);


companyFilter.addEventListener(
    "change",
    displayCompanies
);


companySort.addEventListener(
    "change",
    displayCompanies
);


/* 最初に表示 */

displayCompanies();