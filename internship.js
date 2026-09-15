const internshipCompany =
    document.getElementById("internshipCompany");

const internshipContent =
    document.getElementById("internshipContent");

const addInternshipButton =
    document.getElementById("addInternshipButton");

const internshipList =
    document.getElementById("internshipList");


let internships =
    JSON.parse(localStorage.getItem("internships")) || [];

let editingInternshipId = null;


function saveInternships() {

    localStorage.setItem(
        "internships",
        JSON.stringify(internships)
    );

}


function displayInternships() {

    internshipList.innerHTML = "";


    internships.forEach(function(internship) {

        const internshipElement =
            document.createElement("li");


        internshipElement.innerHTML = `

            <div>

                <strong>
                    ${internship.company}
                </strong>

                <br>

                <small>
                    ${internship.content}
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


        // 編集

        const editButton =
            internshipElement.querySelector(".edit-button");


        editButton.addEventListener("click", function() {

            internshipCompany.value =
                internship.company;

            internshipContent.value =
                internship.content;

            editingInternshipId =
                internship.id;

            addInternshipButton.textContent =
                "更新する";

            internshipCompany.focus();

        });


        // 削除

        const deleteButton =
            internshipElement.querySelector(".delete-button");


        deleteButton.addEventListener("click", function() {

            internships =
                internships.filter(function(item) {

                    return item.id !== internship.id;

                });


            saveInternships();

            displayInternships();

        });


        internshipList.appendChild(internshipElement);

    });

}


addInternshipButton.addEventListener("click", function() {

    const company =
        internshipCompany.value;

    const content =
        internshipContent.value;


    if (company === "" || content === "") {

        return;

    }


    // 編集中

    if (editingInternshipId !== null) {

        const internship =
            internships.find(function(item) {

                return item.id === editingInternshipId;

            });


        internship.company = company;

        internship.content = content;


        editingInternshipId = null;

        addInternshipButton.textContent =
            "保存";

    }


    // 新規追加

    else {

        const newInternship = {

            id: Date.now(),

            company: company,

            content: content

        };


        internships.push(newInternship);

    }


    saveInternships();

    displayInternships();


    internshipCompany.value = "";

    internshipContent.value = "";

});


displayInternships();