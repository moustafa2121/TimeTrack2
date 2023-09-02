//this script handles the left panel of the homepage

//the container for all sections
const sectionsDiv = (function () {
    const sectionsDiv = document.getElementById("sections");
    return function () { return sectionsDiv; }    
})();

//handles holding and switching the currently selected section
const currentlySelectedSection = (function () {
    const currentlySelectedSectionObject = {
        sectionElement: null,
        sectionLayer: null,
        sectionName: null,
    };
    return function (id="-1") {
        if (id !== "-1") {
            if (currentlySelectedSectionObject.sectionElement)
                currentlySelectedSectionObject.sectionElement.classList.remove("spanSelected");
            currentlySelectedSectionObject.sectionLayer = id;
            currentlySelectedSectionObject.sectionElement = sectionedLayerIDToSectionElement(id);
            currentlySelectedSectionObject.sectionName = sectionedLayerIDToSectionName(id);
            currentlySelectedSectionObject.sectionElement.classList.add("spanSelected");
        }
        return currentlySelectedSectionObject;
    }
})();

//called on when the page loads
function loadLeftNavPanel() {
    //add an addSectionButton that can be used to add sections of layer 1
    const parent = document.getElementById("sectionsTitle");
    const addSectionButton_layer1 = document.createElement("button");
    addSectionButton_layer1.className = "addSectionButton";
    addSectionButton_layer1.textContent = "+";
    addSectionButton_layer1.style.textDecorationThickness = "3px";
    addSectionButton_layer1.title = "Add a subsection"
    parent.appendChild(addSectionButton_layer1);
    addSectionButtonFunction(addSectionButton_layer1, sectionsDiv().querySelector("h3"))

    //get the sections data from JSON from the HTML
    const data = JSON.parse(document.getElementById('sectionsJson').textContent);
    const sectionsList = JSON.parse(data);

    //display each section
    for (const section of sectionsList)
        displaySection(section);
}

//display each section
function displaySection(passedSection) {
    //section container: contains the section and its children (i.e. subsections)
    const sectionedLayer = passedSection["fields"]["sectionedLayer"];//e.g. 1.1
    const sectionContainer = document.createElement("div");
    sectionContainer.classList.add("sectionContainer");
    sectionContainer.setAttribute("id", "sectionContainer_" + sectionedLayer);

    //section container only for the section itself
    //contains the collapse button, section name, and the add subsection
    const sectionContainerInd = document.createElement("div");
    sectionContainerInd.className = "sectionContainerInd"
    sectionContainerInd.setAttribute("id", "sectionContainerInd_" + sectionedLayer);
    sectionContainer.appendChild(sectionContainerInd);

    //adding the collapseButton for section collapse
    const collapseButton = document.createElement("button");
    collapseButton.textContent = ">";
    collapseButton.classList.add("collapseButton");
    collapseButton.title = "Collapse this section"
    collapseButton.setAttribute("data-bs-toggle", "collapse");
    collapseButton.setAttribute("data-bs-target", `#sectionChildren_${sectionedLayer}`);
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

    //append the sectionContainer to the proper parent
    //if it is the first layer (i.e. a section with no parent)
    //append it to the main section container (sectionsDiv)
    if (layer == "1") {
        sectionContainer.style.marginTop = "10px";
        sectionContainer.style.marginLeft ="0px";
        sectionsDiv().appendChild(sectionContainer);
    }
    else {//all other layers
        //get the parent of this section and append this section to the parent's children container'
        sectionContainer.style.marginTop = "3px";
        const parentSectionedLayer = sectionedLayer.split(".");
        parentSectionedLayer.pop();
        const parentSectionChildrenContainerID = "sectionChildren_" + parentSectionedLayer.join(".");
        const parentSectionChildrenContainer = document.getElementById(parentSectionChildrenContainerID);
        //ensures the display matches the parent's collapse button
        sectionContainer.style.display = (parentSectionChildrenContainer.parentNode.querySelector(".sectionContainerInd button").textContent === ">") ? "block" : "none";
        parentSectionChildrenContainer.appendChild(sectionContainer);

        sectionContainer.style.marginLeft = 12 + "px";;
        sectionContainer.style.marginBottom = "0px";
    }


    //collapseButton
    //if the section is not last layer allowed (i.e. only 4 layers allowed),
    //add a collapsible and a group for this section's children'
    if (layer != "4") {
        //group for children
        const childrenDiv = document.createElement("div");
        childrenDiv.id = "sectionChildren_" + sectionedLayer;
        childrenDiv.classList.add("show");
        sectionContainer.appendChild(childrenDiv);

        //subsection adding button
        addSectionButtonFunction(addSectionButton, content, sectionContainer);
    }
    else//remove the add button if the section is layer 4
        addSectionButton.remove();
    
    //selecting an individual section as the current section
    content.addEventListener("click", function () {
        if (currentlySelectedSection().sectionElement != content)
            currentlySelectedSection(getSectionIdThroughParent(content));
    })
}

//sends a new section to the DB using fetchAPI
function saveSection(event) {
    //prevent submitting the form
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
    .then(response => response.json())
    .then(data => {
        displaySection(JSON.parse(data.sectionToSend)[0]);
        addFadingMessage(data.message);

        //reset the form
        form.elements["name"].value = "";
        document.getElementById("addSectionForm").style.display = "none";
    })
    .catch(error => {
        addFadingMessage(error.message); // Display the error message
    });
}

//hides the addSectionForm if clicked outside of it
const firstClickedAddSectionForm = (function () {
    let value;
    return function (passedValue="-1") {
        if (passedValue !== "-1")
            value = passedValue;
        return value;
    }
})();

//subsection adding button
function addSectionButtonFunction(addSectionButton, content, sectionContainer=-1) {
    addSectionButton.addEventListener("click", function () {
        const addSectionForm = document.getElementById("addSectionForm")
        //set up the form's dispaly
        addSectionForm.style.display = "inline-block";
        addSectionForm.style.left = addSectionButton.getBoundingClientRect().left + 35 + "px";
        addSectionForm.style.top = addSectionButton.getBoundingClientRect().top - 10 + "px";
        firstClickedAddSectionForm(false);

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
    if (!addSectionForm.contains(event.target) && addSectionForm.style.display != "none" && !firstClickedAddSectionForm()) {
        addSectionForm.style.display = "none";
        firstClickedAddSectionForm(true);
    }
});