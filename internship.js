const internshipCompany = document.getElementById("internshipCompany");
const internshipContent = document.getElementById("internshipContent");
const addInternshipButton = document.getElementById("addInternshipButton");
const internshipList = document.getElementById("internshipList");

let internships = [];

let editingInternshipId = null;

async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error(error);
        return null;
    }

    return data.user;
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
        console.error(error);
        return;
    }

    internships = data;

    displayInternships();
}

function displayInternships() {
    internshipList.innerHTML = "";

    internships.forEach(function(internship) {
        const internshipElement = document.createElement("li");

        internshipElement.innerHTML = `
            <div>
                <strong>${internship.company}</strong>
                <br>
                <small>${internship.content}</small>
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

        const editButton = internshipElement.querySelector(".edit-button");

        editButton.addEventListener("click", function() {
            internshipCompany.value = internship.company;
            internshipContent.value = internship.content;

            editingInternshipId = internship.id;

            addInternshipButton.textContent = "更新する";

            internshipCompany.focus();
        });

        const deleteButton = internshipElement.querySelector(".delete-button");

        deleteButton.addEventListener("click", async function() {
            const { error } = await supabaseClient
                .from("internships")
                .delete()
                .eq("id", internship.id);

            if (error) {
                console.error(error);
                return;
            }

            loadInternships();
        });

        internshipList.appendChild(internshipElement);
    });
}

addInternshipButton.addEventListener("click", async function() {
    const company = internshipCompany.value.trim();
    const content = internshipContent.value.trim();

    if (company === "" || content === "") {
        return;
    }

    const user = await getCurrentUser();

    if (!user) {
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
            console.error(error);
            return;
        }

        editingInternshipId = null;
        addInternshipButton.textContent = "保存";
    } else {
        const { error } = await supabaseClient
            .from("internships")
            .insert({
                user_id: user.id,
                company: company,
                content: content
            });

        if (error) {
            console.error(error);
            return;
        }
    }

    internshipCompany.value = "";
    internshipContent.value = "";

    loadInternships();
});

loadInternships();