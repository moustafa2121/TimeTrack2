//get the sections data from JSON
const data = JSON.parse(document.getElementById('sectionsJson').textContent);
const data2 = JSON.parse(data);
let sectionsDiv = document.getElementById("sections");

let firstClickedAddSectionForm = true;
let addSectionForm = document.getElementById("addSectionForm")


for (let i of data2) {
    displaySection(i);
}


function displaySection(i) {
    //section container, contains the collapseButton and the section
    let sectionContainer = document.createElement("div");
    sectionContainer.className = "sectionContainer"
    sectionContainer.setAttribute("id", "sectionContainer_" + i["fields"]["sectionedLayer"]);

    //section container only for the section itself, not the children
    let sectionContainerInd = document.createElement("div");
    sectionContainerInd.className = "sectionContainerInd"
    sectionContainerInd.setAttribute("id", "sectionContainerInd_" + i["fields"]["sectionedLayer"]);
    sectionContainer.appendChild(sectionContainerInd);

    //adding the collapseButton for the collapsing
    let collapseButton = document.createElement("button");
    collapseButton.textContent = ">";
    sectionContainerInd.appendChild(collapseButton);

    //set the content for the section
    let content = document.createElement("span");
    content.textContent = i["fields"]["name"] + "  ";
    sectionContainerInd.appendChild(content);

    let addSectionButton = document.createElement("button");
    addSectionButton.className = "addSectionButton";
    addSectionButton.textContent = "+";
    sectionContainerInd.appendChild(addSectionButton);

    //set vertical margin for the section container
    let layer = i["fields"]["layer"];
    sectionContainer.style.marginLeft = 12 + "px";;
    sectionContainer.style.marginBottom = "0px";

    //append the sectionContainer to the proper parent
    //if layer 1
    if (layer == "1") {
        sectionContainer.style.marginTop = "10px";
        sectionsDiv.appendChild(sectionContainer);
    }
    else {//all other layers
        sectionContainer.style.marginTop = "3px";
        let fa = i["fields"]["sectionedLayer"].split(".");
        fa.pop();
        let parentSectionedLayer = "sectionContainer_" + fa.join(".");
        let parent = document.getElementById(parentSectionedLayer);
        parent.appendChild(sectionContainer);
    }


    if (layer != "4") {
        //collapsible for the collapseButton
        collapseButton.addEventListener("click", function () {
            let children = sectionContainer.childNodes;
            let atLeastOneChild = false;
            for (let child of children) {
                if (child.getAttribute("class") == "sectionContainerInd") {
                    continue;
                }
                else if (child.getAttribute("class") == "sectionContainer") {
                    child.style.display = (child.style.display == "none") ? "block" : "none";
                    atLeastOneChild = true;
                }
            }
            if (atLeastOneChild)
                collapseButton.textContent = (collapseButton.textContent == ">") ? "U" : ">";
        })

        //section adding button
        addSectionButton.addEventListener("click", function () {
            //set up the form's dispaly
            addSectionForm.style.display = "inline-block";
            addSectionForm.style.left = addSectionButton.getBoundingClientRect().left + 35 + "px";
            addSectionForm.style.top = addSectionButton.getBoundingClientRect().top - 10 + "px";
            firstClickedAddSectionForm = false;

            document.getElementById("addSectionFormTitle").innerHTML = "Add a section to " + "<i>" + content.textContent + "</i>";
            document.getElementById("addSectionFormParent").setAttribute("value", sectionContainer.id);
        })
    }
    else {
        addSectionButton.textContent = "";
    }

    //selecting an individual section as the current section
    content.addEventListener("click", function () {
        if (currentSessionData && currentSessionData.previouslySelectedSection != content) {
            content.className = "spanSelected";
            if (currentSessionData.previouslySelectedSection)
                currentSessionData.previouslySelectedSection.classList.remove("spanSelected");
            currentSessionData.previouslySelectedSection = content;
        }
    })
}

//sends a new section to the DB using fetchAPI
function saveSection(event) {
    event.preventDefault();
    const form = event.target;
    const addSectionFormParentValue = form.elements["addSectionFormParent"].value;
    const name = form.elements["name"].value;
    const dict = { "name": name, "addSectionFormParentValue": addSectionFormParentValue }

    fetch("/add-section/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify({ "passedSection": dict })
    })
        .then(response => {
            if (!response.ok) {
                // Handle error response here
                return response.json().then(data => {
                    throw new Error(data.error);
                });
            }
            return response.json();
        })
        .then(data => {
            displaySection(JSON.parse(data.sectionToSend)[0]);
            addFadingMessage(data.message);

            //reset the form
            form.elements["name"].value = "";
            addSectionForm.style.display = "none";
        })
        .catch(error => {
            addFadingMessage(error.message); // Display the error message
        });
}

//hide the addSectionButton if clicked outside of it
document.body.addEventListener('click', function (event) {
    if (event.target.className == "addSectionButton")
        return;
    if (!addSectionForm.contains(event.target) && addSectionForm.style.display != "none" && !firstClickedAddSectionForm) {
        addSectionForm.style.display = "none";
        firstClickedAddSectionForm = true;
    }
});