
const internshipCompany = document.getElementById("internshipCompany");
const internshipContent = document.getElementById("internshipContent");
const addInternshipButton = document.getElementById("addInternshipButton");
const internshipList = document.getElementById("internshipList");

let internships = [];
let internshipCompanies = [];
let editingInternshipId = null;

async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("ユーザー情報の取得に失敗しました:", error);
        return null;
    }

    return data.user;
}

async function loadInternshipCompanies() {
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

    internshipCompanies = data || [];
    updateCompanyOptions();
}

function updateCompanyOptions(selectedCompany = "") {
    internshipCompany.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "企業を選択してください";
    internshipCompany.appendChild(defaultOption);

    internshipCompanies.forEach(company => {
        const option = document.createElement("option");
        option.value = company.name;
        option.textContent = company.name;
        internshipCompany.appendChild(option);
    });

    if (
        selectedCompany &&
        !internshipCompanies.some(company => company.name === selectedCompany)
    ) {
        const oldOption = document.createElement("option");
        oldOption.value = selectedCompany;
        oldOption.textContent = `${selectedCompany}（登録企業にありません）`;
        internshipCompany.appendChild(oldOption);
    }

    internshipCompany.value = selectedCompany;
}

async function loadInternships() {
    const user = await getCurrentUser();

    if (!user) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("internships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("振り返りの取得に失敗しました:", error);
        alert("振り返りを取得できませんでした。");
        return;
    }

    internships = data || [];
    displayInternships();
}

function displayInternships() {
    internshipList.replaceChildren();

    if (internships.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "振り返りはまだありません。";
        internshipList.appendChild(emptyMessage);
        return;
    }

    internships.forEach(internship => {
        const internshipElement = document.createElement("li");

        const contentContainer = document.createElement("div");

        const companyTitle = document.createElement("strong");
        companyTitle.textContent = internship.company || "企業名未設定";

        const contentText = document.createElement("p");
        contentText.textContent = internship.content || "";

        contentContainer.append(companyTitle, contentText);

        const buttons = document.createElement("div");
        buttons.classList.add("item-buttons");

        const editButton = document.createElement("button");
        editButton.classList.add("edit-button");
        editButton.textContent = "編集";

        editButton.addEventListener("click", function() {
            updateCompanyOptions(internship.company || "");
            internshipContent.value = internship.content || "";

            editingInternshipId = internship.id;
            addInternshipButton.textContent = "更新する";

            internshipCompany.focus();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-button");
        deleteButton.textContent = "削除";

        deleteButton.addEventListener("click", async function() {
            const confirmed = window.confirm(
                `「${internship.company || "企業名未設定"}」の振り返りを削除しますか？`
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
                .from("internships")
                .delete()
                .eq("id", internship.id)
                .eq("user_id", user.id);

            if (error) {
                console.error("振り返りの削除に失敗しました:", error);
                alert("振り返りの削除に失敗しました。");
                return;
            }

            if (editingInternshipId === internship.id) {
                resetInternshipForm();
            }

            await loadInternships();
        });

        buttons.append(editButton, deleteButton);
        internshipElement.append(contentContainer, buttons);
        internshipList.appendChild(internshipElement);
    });
}

function resetInternshipForm() {
    internshipCompany.value = "";
    internshipContent.value = "";

    editingInternshipId = null;
    addInternshipButton.textContent = "保存";
}

addInternshipButton.addEventListener("click", async function() {
    const company = internshipCompany.value;
    const content = internshipContent.value.trim();

    if (!company) {
        alert("企業を選択してください。");
        internshipCompany.focus();
        return;
    }

    if (!content) {
        alert("振り返りの内容を入力してください。");
        internshipContent.focus();
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
        alert("ログイン状態を確認できませんでした。");
        return;
    }

    if (editingInternshipId !== null) {
        const { error } = await supabaseClient
            .from("internships")
            .update({
                company: company,
                content: content
            })
            .eq("id", editingInternshipId)
            .eq("user_id", user.id);

        if (error) {
            console.error("振り返りの更新に失敗しました:", error);
            alert("振り返りの更新に失敗しました。");
            return;
        }
    } else {
        const { error } = await supabaseClient
            .from("internships")
            .insert({
                user_id: user.id,
                company: company,
                content: content
            });

        if (error) {
            console.error("振り返りの保存に失敗しました:", error);
            alert("振り返りの保存に失敗しました。");
            return;
        }
    }

    resetInternshipForm();
    await loadInternships();
});

async function initializeInternships() {
    await loadInternshipCompanies();
    await loadInternships();
}

initializeInternships();
