const textTitle = document.getElementById("textTitle");
const textCompany = document.getElementById("textCompany");
const textContent = document.getElementById("textContent");
const textCount = document.getElementById("textCount");
const addTextButton = document.getElementById("addTextButton");
const textList = document.getElementById("textList");

let texts = [];
let companies = [];

function updateTextCount() {
    textCount.textContent = `${textContent.value.length}文字`;
}

textContent.addEventListener("input", updateTextCount);

updateTextCount();

let editingTextId = null;

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
        .select("id, name")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    companies = data;

    textCompany.innerHTML = `
        <option value="">企業を指定しない</option>
    `;

    companies.forEach(function(company) {
        const option = document.createElement("option");

        option.value = company.id;
        option.textContent = company.name;

        textCompany.appendChild(option);
    });
}

async function loadTexts() {
    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("texts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    texts = data;

    displayTexts();
}

function getCompanyName(companyId) {
    if (!companyId) {
        return "企業未指定";
    }

    const company = companies.find(function(company) {
        return company.id === companyId;
    });

    if (!company) {
        return "企業未指定";
    }

    return company.name;
}

function displayTexts() {
    textList.innerHTML = "";

    texts.forEach(function(text) {
        const textElement = document.createElement("li");

        const companyName = getCompanyName(text.company_id);

        textElement.innerHTML = `
            <div>
                <strong>${text.title}</strong>
                <br>
                <small>企業：${companyName}</small>
                <br>
                <small>${text.content}</small>
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

        const editButton = textElement.querySelector(".edit-button");

        editButton.addEventListener("click", function() {
            textTitle.value = text.title;
            textCompany.value = text.company_id || "";
            textContent.value = text.content;

            editingTextId = text.id;

            addTextButton.textContent = "更新する";

            textTitle.focus();
        });

        const deleteButton = textElement.querySelector(".delete-button");

        deleteButton.addEventListener("click", async function() {
            const user = await getCurrentUser();

            if (!user) {
                return;
            }

            const { error } = await supabaseClient
                .from("texts")
                .delete()
                .eq("id", text.id)
                .eq("user_id", user.id);

            if (error) {
                console.error(error);
                return;
            }

            loadTexts();
        });

        textList.appendChild(textElement);
    });
}

addTextButton.addEventListener("click", async function() {
    const title = textTitle.value.trim();
    const companyId = textCompany.value || null;
    const content = textContent.value.trim();

    if (title === "" || content === "") {
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    if (editingTextId !== null) {
        const { error } = await supabaseClient
            .from("texts")
            .update({
                title: title,
                company_id: companyId,
                content: content
            })
            .eq("id", editingTextId)
            .eq("user_id", user.id);

        if (error) {
            console.error(error);
            return;
        }

        editingTextId = null;
        addTextButton.textContent = "保存";
    } else {
        const { error } = await supabaseClient
            .from("texts")
            .insert({
                user_id: user.id,
                title: title,
                company_id: companyId,
                content: content
            });

        if (error) {
            console.error(error);
            return;
        }
    }

    textTitle.value = "";
    textCompany.value = "";
    textContent.value = "";

    loadTexts();
});

async function initialize() {
    await loadCompanies();
    await loadTexts();
}

initialize();