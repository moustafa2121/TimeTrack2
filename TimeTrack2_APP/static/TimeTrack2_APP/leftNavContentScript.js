//this script handles the left panel of the homepage
//it displays the sections available for the user

//get the sections data from JSON from the HTML
const data = JSON.parse(document.getElementById('sectionsJson').textContent);
const sectionsList = JSON.parse(data);

//the container for all sections
const sectionsDiv = document.getElementById("sections");

//hides the addSectionForm if clicked outside of it
let firstClickedAddSectionForm = true;
let addSectionForm = document.getElementById("addSectionForm")

//add an addSectionButton that can be used to add sections of layer 1
const addSectionButton_layer1 = document.createElement("button");
addSectionButton_layer1.className = "addSectionButton";
addSectionButton_layer1.textContent = "+";
addSectionButton_layer1.style.textDecorationThickness = "3px";
addSectionButton_layer1.title = "Add a subsection"
sectionsDiv.appendChild(addSectionButton_layer1);
addSectionButtonFunction(addSectionButton_layer1, sectionsDiv.querySelector("h3"))


//loop over the sections
for (const section of sectionsList)
    displaySection(section);

//display each section
function displaySection(passedSection) {
    //section container: contains the section and its children (i.e. subsections)
    const sectionContainer = document.createElement("div");
    sectionContainer.className = "sectionContainer"
    sectionContainer.setAttribute("id", "sectionContainer_" + passedSection["fields"]["sectionedLayer"]);

    //section container only for the section itself
    //contains the collapse button, section name, and the add subsection
    const sectionContainerInd = document.createElement("div");
    sectionContainerInd.className = "sectionContainerInd"
    sectionContainerInd.setAttribute("id", "sectionContainerInd_" + passedSection["fields"]["sectionedLayer"]);
    sectionContainer.appendChild(sectionContainerInd);

    //adding the collapseButton for section collapse
    const collapseButton = document.createElement("button");
    collapseButton.textContent = ">";
    collapseButton.className = "collapseButton";
    collapseButton.title = "Collapse this section"
    sectionContainerInd.appendChild(collapseButton);

    //set the content for the section (i.e. the name)
    const content = document.createElement("span");
    content.textContent = passedSection["fields"]["name"];
    sectionContainerInd.appendChild(content);

    //button that adds subsections to this section
    const addSectionButton = document.createElement("button");
    addSectionButton.className = "addSectionButton";
    addSectionButton.textContent = "+";
    addSectionButton.title = "Add a subsection"
    sectionContainerInd.appendChild(addSectionButton);

    //set vertical margin for the section container
    //needed for tree-view
    const layer = passedSection["fields"]["layer"];
    sectionContainer.style.marginLeft = 12 + "px";;
    sectionContainer.style.marginBottom = "0px";

    //append the sectionContainer to the proper parent
    //if it is the first layer (i.e. a section with no parent)
    //append it to the main section container (sectionsDiv)
    if (layer == "1") {
        sectionContainer.style.marginTop = "10px";
        sectionsDiv.appendChild(sectionContainer);
    }
    else {//all other layers
        //get the parent of this section and append this section to the parrent
        sectionContainer.style.marginTop = "3px";
        const parentSectionedLayer = passedSection["fields"]["sectionedLayer"].split(".");
        parentSectionedLayer.pop();
        const parentSection = document.getElementById("sectionContainer_" + parentSectionedLayer.join("."));
        //ensures the display matches the parent's collapse button
        sectionContainer.style.display = (parentSection.querySelector(".sectionContainerInd button").textContent === ">") ? "block" : "none";
        parentSection.appendChild(sectionContainer);
    }

    //if the section is not last layer, add a collapsible and add subsection button events
    if (layer != "4") {
        //collapsible button for each section that can hold a subsection
        collapseButton.addEventListener("click", () => {
            const subSections = Array.from(sectionContainer.querySelectorAll(".sectionContainer"));
            if (subSections && subSections.length>0) {
                subSections.map(target => target.style.display = (target.style.display == "none") ? "block" : "none");
                collapseButton.textContent = (collapseButton.textContent == ">") ? "U" : ">";
            }
        })

        //subsection adding button
        addSectionButtonFunction(addSectionButton, content, sectionContainer);
    }
    else//remove the add button if the section is layer 4
        addSectionButton.remove();
    
    //selecting an individual section as the current section
    content.addEventListener("click", function () {
        //first time choosing a section
        if (currentSessionHolder && currentSessionHolder.previouslySelectedSection != content) {
            content.className = "spanSelected";
            if (currentSessionHolder.previouslySelectedSection)//switching between sections
                currentSessionHolder.previouslySelectedSection.classList.remove("spanSelected");
            currentSessionHolder.previouslySelectedSection = content;

        }
    })
}

//sends a new section to the DB using fetchAPI
function saveSection(event) {
    //prevent from submitting the form
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

//subsection adding button
function addSectionButtonFunction(addSectionButton, content, sectionContainer=-1) {
    addSectionButton.addEventListener("click", function () {
        //set up the form's dispaly
        addSectionForm.style.display = "inline-block";
        addSectionForm.style.left = addSectionButton.getBoundingClientRect().left + 35 + "px";
        addSectionForm.style.top = addSectionButton.getBoundingClientRect().top - 10 + "px";
        firstClickedAddSectionForm = false;

        document.getElementById("addSectionFormTitle").innerHTML = "Add a section to " + "<i>" + content.textContent + "</i>";
        //a reference to the parent of the new added section to be added properly in the backened
        const parentIDValue = (sectionContainer === -1) ? "-1" : sectionContainer.id;
        document.getElementById("addSectionFormParent").setAttribute("value", parentIDValue);
    })
}

//hide the addSectionButton if clicked outside of it
document.body.addEventListener('click', function (event) {
    //if clicked on the form itself, just ignore
    if (event.target.className == "addSectionButton")
        return;

    //if the click is outside the form, and the form is not hidden
    //and the click was not on the addSection '+' button
    //the last argument to make sure that if the form is already visible, and if we
    //click on another +, the form will appear on for that section
    if (!addSectionForm.contains(event.target) && addSectionForm.style.display != "none" && !firstClickedAddSectionForm) {
        addSectionForm.style.display = "none";
        firstClickedAddSectionForm = true;
    }
});