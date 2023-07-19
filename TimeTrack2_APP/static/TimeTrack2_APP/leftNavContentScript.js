//get the sections data from JSON
const data = JSON.parse(document.getElementById('sectionsJson').textContent);
const data2 = JSON.parse(data);
let sectionsDiv = document.getElementById("sections");

let firstClickedAddSectionForm = true;
let addSectionForm = document.getElementById("addSectionForm")

let previouslySelectedSection;

for (i of data2) {
    //section container, contains the plus and the section
    let sectionContainer = document.createElement("div");
    sectionContainer.className = "sectionContainer"
    sectionContainer.setAttribute("id", "sectionContainer_"+i["fields"]["sectionedLayer"]);

    //section container only for the section itself, not the children
    let sectionContainerInd = document.createElement("div");
    sectionContainerInd.className = "sectionContainerInd"
    sectionContainerInd.setAttribute("id", "sectionContainerInd_" + i["fields"]["sectionedLayer"]);
    sectionContainer.appendChild(sectionContainerInd);

    //adding the plus for the collapsing
    let plus = document.createElement("button");
    plus.textContent = ">";
    sectionContainerInd.appendChild(plus);

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
    sectionContainer.style.marginLeft = 12 * (layer - 1) + "px";;
    sectionContainer.style.marginBottom = "0px";

    //append the sectionContainer to the proper parent
    //if layer 1
    if (layer == "1") {
        sectionContainer.style.marginTop = "10px";
        sectionsDiv.appendChild(sectionContainer);
    }
    else {//all other layers
        sectionContainer.style.marginTop = "3px";
        let parentSectionedLayer = "sectionContainer_" + i["fields"]["sectionedLayer"].slice(0, -2);
        let parent = document.getElementById(parentSectionedLayer);
        parent.appendChild(sectionContainer);
    }

    //collapsible for the plus
    plus.addEventListener("click", function () {
        let tmp = sectionContainer.childNodes;
        let atLeastOneChild = false;
        for (j of tmp) {
            if (j.getAttribute("class") == "sectionContainerInd") {
                continue;
            }
            else if (j.getAttribute("class") == "sectionContainer") {
                j.style.display = (j.style.display == "none") ? "block" : "none";
                atLeastOneChild = true;
            }
        }
        if (atLeastOneChild)
            plus.textContent = (plus.textContent == ">") ? "U" : ">";
    })

    //form adding button
    addSectionButton.addEventListener("click", function () {
        addSectionForm.style.display = "inline-block";
        addSectionForm.style.left = addSectionButton.getBoundingClientRect().left+35+"px";
        addSectionForm.style.top = addSectionButton.getBoundingClientRect().top - 10 + "px";
        firstClickedAddSectionForm = false;

        document.getElementById("addSectionFormTitle").innerHTML = "Add a section to " + "<i>" + content.textContent + "</i>";
        document.getElementById("addSectionFormParent").setAttribute("value", sectionContainer.id);
    })

    //selecting an individual section as the current section
    content.addEventListener("click", function () {
        if (previouslySelectedSection != content) {
            content.className = "spanSelected";
            if (previouslySelectedSection)
                previouslySelectedSection.classList.remove("spanSelected");
            previouslySelectedSection = content;
        }
    })
}


//sends a new section to the DB using fetchAPI
function saveActionable(passedSectionObject) {
    fetch("/add-section/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify({ "passedSectionObject": passedSectionObject })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById("responseMessage").textContent = data.message;
        })
        .catch(error => {
            console.error("Error:", error);
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