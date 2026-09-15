const textTitle = document.getElementById("textTitle");
const textContent = document.getElementById("textContent");
const addTextButton = document.getElementById("addTextButton");
const textList = document.getElementById("textList");


let texts = JSON.parse(localStorage.getItem("texts")) || [];

let editingTextId = null;


function saveTexts() {

    localStorage.setItem(
        "texts",
        JSON.stringify(texts)
    );

}


function displayTexts() {

    textList.innerHTML = "";


    texts.forEach(function(text) {

        const textElement = document.createElement("li");


        textElement.innerHTML = `

            <div>

                <strong>${text.title}</strong>

                <br>

                <small>
                    ${text.content}
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
            textElement.querySelector(".edit-button");


        editButton.addEventListener("click", function() {

            textTitle.value = text.title;

            textContent.value = text.content;

            editingTextId = text.id;

            addTextButton.textContent = "更新する";

            textTitle.focus();

        });


        // 削除

        const deleteButton =
            textElement.querySelector(".delete-button");


        deleteButton.addEventListener("click", function() {

            texts = texts.filter(function(item) {

                return item.id !== text.id;

            });


            saveTexts();

            displayTexts();

        });


        textList.appendChild(textElement);

    });

}


addTextButton.addEventListener("click", function() {

    const title = textTitle.value;

    const content = textContent.value;


    if (title === "" || content === "") {

        return;

    }


    // 編集中

    if (editingTextId !== null) {

        const text = texts.find(function(item) {

            return item.id === editingTextId;

        });


        text.title = title;

        text.content = content;


        editingTextId = null;

        addTextButton.textContent = "保存";

    }


    // 新規追加

    else {

        const newText = {

            id: Date.now(),

            title: title,

            content: content

        };


        texts.push(newText);

    }


    saveTexts();

    displayTexts();


    textTitle.value = "";

    textContent.value = "";

});


displayTexts();