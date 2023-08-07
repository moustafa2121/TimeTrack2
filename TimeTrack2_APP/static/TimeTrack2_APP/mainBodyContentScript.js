//reference to the timer
let timerIntervalRef;

//list of actionables buttons
const actionableButtons = document.getElementsByClassName("actionableButton");
const defaultActionable = document.getElementById("actionable_Working");

//handling sessions
const totalSessionTimeOutput = document.getElementById("totalSessionTimeOutput");
totalSessionTimeOutput.textContent = totalSecondsToTime(0);

//on starting a session
const buttonStartingSession = document.getElementById("buttonStartingSession");
buttonStartingSession.addEventListener("click", () => {
    if (!currentSessionHolder.previouslySelectedSection) {//select a section
        alert("You need to select the current Section");
        return;
    }

    //set the session to be active
    currentSessionHolder.activeSession = true;
    currentSessionHolder.startFrom = Date.now();
    updateSession();//save the new session

    //click on the default actionable
    defaultActionable.click();

    //switch the fading effect of the start/end button
    sessionSwitchFadedButtons();
});

//on ending a session
const buttonEndingSession = document.getElementById("buttonEndSession");
buttonEndingSession.addEventListener("click", () => {
    //make sure the user wants to end the session
    if (confirm("Are you sure you want to end this session? Once ended you can no longer edit the actionables of that session.")) {
        //end the actionable
        endActionable();

        //remove the spanSelected class from the current section
        currentSessionHolder.previouslySelectedSection.classList.remove("spanSelected");
        //set the session to false
        currentSessionHolder.activeSession = false;
        //update the session in the db
        updateSession();

        //switch the fading effect of the start/end button
        sessionSwitchFadedButtons();

        //reset the timer display of the total session time
        totalSessionTimeOutput.textContent = totalSecondsToTime(0);
        //intialize a new currentSessionData
        currentSessionHolder = getNewCurrentSessionData();
    }
});

//when session is active the buttonStartingSession is faded and the buttonEndingSession
//is normal. when inactive session, it is opposite
function sessionSwitchFadedButtons() {
    if (currentSessionHolder.activeSession) {
        buttonStartingSession.classList.add("sessionFadedButton");
        buttonEndingSession.classList.remove("sessionFadedButton");
    }
    else {
        buttonEndingSession.classList.add("sessionFadedButton");
        buttonStartingSession.classList.remove("sessionFadedButton");
    }
}

//saves the session when starting/ending it
function updateSession() {
    if (!currentSessionHolder.activeSession) {//ending the session
        currentSessionHolder.endTo = Date.now();
    }
    fetch("/update-session/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify({ "passedSession": currentSessionHolder })
    })
        .then(response => response.json())
        .then(data => {
            addFadingMessage(data.message);            
        })
        .catch(error => {
            addFadingMessage(error);
        });
}

//display the actionables
//assign the event listners for each button
for (const actionableButton of actionableButtons) {
    actionableButton.addEventListener("click", function () {
        if (!currentSessionHolder.activeSession) {//need to start a session
            alert("You need to start a session");
            return;
        }

        //end the previous actionable if there was one
        //this is not triggered when the startSession event clicks on the
        //default actionable (since the currentActionable has startFrom == 0)
        if (currentActionableHolder && currentActionableHolder.startFrom != 0)
            endActionable();

        //start a new actionable
        this.classList.add("actionableButtonSelected");
        currentActionableHolder = getNewCurrentActionable();
        currentActionableHolder.startFrom = Date.now();
        currentActionableHolder.actionableName = actionableButton.textContent;
        currentActionableHolder.actionableColor = actionableButton.style.backgroundColor;
        currentActionableHolder.currentSection = getCurrentSectionedLayerID();
        currentActionableHolder.currentSession = currentSessionHolder.startFrom;

        //start the timer 
        startActionable();
    })
}

//starts the life-cycle of the actionable
function startActionable() {    
    //display the  currentactionable and its data under the currentActionableDi
    //and remove the old one
    displayCurrentActionable();

    //begin the interval of the actionable that triggers every 1 second
    timerIntervalRef = setInterval(() => {
        const delta = Date.now() - currentActionableHolder.startFrom;
        currentActionableOutput.textContent = totalSecondsToTime(Math.floor(delta / 1000));
        totalSessionTimeOutput.textContent = totalSecondsToTime(Math.floor((delta + currentSessionHolder.totalTimeHolder) / 1000));
    }, 1000);
}

//ends the life-cycle of the actionable
function endActionable() {
    //remove the selected actionable class from the previous actionable
    document.querySelector(".actionableButtonSelected").classList.remove("actionableButtonSelected");

    //update the current actionable with the final data
    currentActionableHolder.endTo = Date.now();
    currentActionableHolder.detail = document.querySelector("#currentActionableDiv .singleActionableDetails").value;

    //send it back to the server using fetchAPI
    addActionable();

    //add the total time of the actionable to the totam time of the session
    currentSessionHolder.totalTimeHolder += (currentActionableHolder.endTo - currentActionableHolder.startFrom);

    //display the actionable under the current session
    displayActionable(currentActionableHolder, document.querySelector(".singleSessionActionablesContainer"), 2);

    //clear the interval of the actionable
    clearInterval(timerIntervalRef);
    currentActionableOutput.textContent = totalSecondsToTime(0);
}

//displays the current running actionable under the currentActionableDiv
function displayCurrentActionable() {
    //remove the previous currentActionable display
    const parentObject = document.getElementById("currentActionableDiv");
    if (parentObject.querySelector(".singleActionableDiv"))
        parentObject.querySelector(".singleActionableDiv").remove()

    //singleActionableDiv
    const singleActionableDiv = document.createElement("div");
    singleActionableDiv.className = "singleActionableDiv";
    parentObject.appendChild(singleActionableDiv);

    //display the color square, the actionable name, the section, and the details
    displayActionable_firstPart(currentActionableHolder, singleActionableDiv, 4);

    //display the total time of the actionable
    currentActionableOutput = document.createElement("span");
    currentActionableOutput.id = "currentActionableOutput";
    currentActionableOutput.textContent = totalSecondsToTime(0);
    currentActionableOutput.style.marginLeft = "150px";
    singleActionableDiv.appendChild(currentActionableOutput);
}

//display the color square, the actionable name, the section, and the details
//called on in 4 cases
//1- when the page is reloaded and the actionables of the archived session are displayed
// -- nothing is modifiable
//2- when the endActionable function removes the previous actionable, it calls this function
//to draw the removed actionable (the most recent finished actionable)
// -- everything is modifiable
//3- when the page is reloaded and the actionables of the current session are displayed
// -- only the firstpart is modifiable (can't change the time or use the delete buttong)
//4- called by the displayCurrentActionable to display the current actionable,
//nothing is modifiable but for the details
function displayActionable_firstPart(passedActionable, parentObject, caseValue) {
    //color square
    const actionableColor = document.createElement("div");
    actionableColor.style.backgroundColor = passedActionable.actionableColor;
    actionableColor.className = "singleActionableColor";
    parentObject.appendChild(actionableColor);
    
    //the actionable name and section can be changed
    if (caseValue == 2 || caseValue == 3) {//a selectable
        //populate the actionable name
        initializeSelect("singleActionableSelect", parentObject, getListOfActionables(),
                        passedActionable.actionableName, "name", confirmerFunction);
        //populate the section
        initializeSelect("singleSectionSelect", parentObject, getListOfSections(),
                        sectionedLayerIDToSectionName(passedActionable.currentSection),
                        "currentSection", confirmerFunction);
    }
    else {//1 or 4
        const actionableName = document.createElement("span");
        actionableName.className = "singleActionableName";
        actionableName.textContent = passedActionable.actionableName;
        actionableName.title = passedActionable.actionableName;
        parentObject.appendChild(actionableName);

        //section
        const sectionName = document.createElement("span");
        sectionName.textContent = sectionedLayerIDToSectionName(passedActionable.currentSection);
        sectionName.title = sectionedLayerIDToSectionName(passedActionable.currentSection);
        sectionName.className = "singleActionableSection";
        parentObject.appendChild(sectionName);
    }

    //details
    let details;
    if (caseValue != 1) {
        details = document.createElement("input");
        details.placeholder = "Actionable Details";
        details.type = "text";
        details.maxLength = 250;
        //add an event listener
        details.addEventListener("change", updateActionable, false);
        details.name = "detail";
        details.oldValue = details.value;
        details.confirmer = confirmerFunction.bind(details);
    }
    else 
        details = document.createElement("span");
    details.className = "singleActionableDetails";
    details.value = passedActionable.detail;
    parentObject.appendChild(details);
}

//displays an actionable, called on in 3 cases
//1- when the page is reloaded and the actionables of the archived session are displayed
// -- nothing is modifiable
//2- when the endActionable function removes the previous actionable, it calls this function
//to draw the removed actionable (the most recent finished actionable)
// -- everything is modifiable
//3- when the page is reloaded and the actionables of the current session are displayed
// -- only the firstpart is modifiable (can't change the time or use the delete button)
function displayActionable(passedActionable, parentObject, caseValue) {
    //draws the subbar of a single actionable
    const barRef = parentObject.parentNode.querySelector(".barClass");
    displayBar(barRef, passedActionable);
    
    //the parent of a single actionable
    const singleActionableDiv = document.createElement("div");
    singleActionableDiv.className = "singleActionableDiv";
    singleActionableDiv.id = passedActionable.pk;
    //if the parent has a child, add the child in a stacking order (on top)
    if (parentObject.firstChild)
        parentObject.insertBefore(singleActionableDiv, parentObject.firstChild);
    else//else, add the child directly
        parentObject.appendChild(singleActionableDiv)
    
    //display the first part of the actionable
    displayActionable_firstPart(passedActionable, singleActionableDiv, caseValue);
        
    //time span is a span that holds the start, end and the total time of the actionable
    const timeSpan = document.createElement("span")
    timeSpan.className = "timeActionableDetail";
    singleActionableDiv.appendChild(timeSpan);

    //startFrom value
    initializeActionableTimeField(timeSpan, "startFrom", passedActionable.startFrom, caseValue);
    //set between the startFrom and endTo
    const dividerText = document.createTextNode("  -->  ");
    timeSpan.appendChild(dividerText);
    //endTo value
    initializeActionableTimeField(timeSpan, "endTo", passedActionable.endTo, caseValue);

    //total time display
    const totalTime = document.createElement("span");
    totalTime.textContent = " Total: " + totalSecondsToTime(Math.floor((passedActionable.endTo - passedActionable.startFrom) / 1000));
    timeSpan.appendChild(totalTime);

    //if the actionable is not part of an archived session, it can be edited
    if (caseValue != 1) {
        //option to delete an actionable. only active for the most 
        //recent actionable in the current active session
        const actionableDeleteButton = document.createElement("button");
        actionableDeleteButton.textContent = "X";
        timeSpan.appendChild(actionableDeleteButton);

        //if there is a second child to the parent, then
        //make sure only the most recent actionable is can be edited, actionable details can still be edited
        if (parentObject.querySelectorAll(".singleActionableDiv")[1]) {
            const currentSecondChild = parentObject.querySelectorAll(".singleActionableDiv")[1];
            //disable any possible changes to the time values
            const timeChildren = Array.from(currentSecondChild.querySelectorAll(".timeActionableDetail input"));
            timeChildren.map((target) => {
                target.readOnly = true;
                target.style.cursor = "default";
            });
            //disable the delete button for the non-most recent actionable
            currentSecondChild.querySelector("button").classList.add("sessionFadedButton");
        }
    }
}

//displays the subBar of the actionable on the progress bar of the session
//the divider is currently just for testing
function displayBar(barRef, passedActionable, divider=secondsInDay) {
    const subBar = document.createElement("span");
    subBar.className = "subBarClass"
    subBar.style.backgroundColor = passedActionable.actionableColor;
    const currentSecondsAsPercentage = Math.ceil((passedActionable.endTo - passedActionable.startFrom) / 1000) * 100;
    const width = (currentSecondsAsPercentage / divider) + "%";
    subBar.style.width = width;
    barRef.appendChild(subBar);
}

confirmerFunction = function () {
    console.log("oh yes indeed m8 " + this.value);
}


//updates the actionable details when they are changed
//applies only to the actionables of the current session (but not the currentActionable)
function updateActionable(event) {
    let currentTarget = event.currentTarget;
    //first: input checks
    if (currentTarget.readOnly){//if it is not editable, return
        return;
    }
    const newValue = currentTarget.value.trim();

    //check validity
    currentTarget.reportValidity();
    if (!currentTarget.checkValidity()) {//if invalid
        currentTarget.value = currentTarget.oldValue;
        return;
    }
    else  {//valid
        currentTarget.oldValue = newValue;
    }

    //second: check if the range is proper
    //this is only for startFrom
    //const nextSingleActionableDetail = currentTarget.parentNode.parentNode.nextElementSibling;
    //if (nextSingleActionableDetail) {//check if there are siblings
    //    const endToValue = nextSingleActionableDetail.querySelector('[name="endTo"]').dataset.rawValue;
    //}
    //else {//no siblings
    //    currentTarget.confirmer();
    //}

    //change the color of the square if the actionable name changed
    if (currentTarget.name == "name") {
        currentTarget.previousSibling.style.backgroundColor = getActionableColor(newValue);
    }

    //:go to the DB
    let constObjSend = {};
    constObjSend["actionablePK"] = currentTarget.closest(".singleActionableDiv").id
    constObjSend[currentTarget.name] = newValue;
    currentTarget.oldValue = newValue;

    //return;

    fetch("/update-actionable/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify(constObjSend)
    })
        .then(response => response.json())
        .then(data => {
            addFadingMessage(data.message);
        })
        .catch(error => {
            addFadingMessage(error);
        });
}

//sends a new actionable to the DB using fetchAPI
function addActionable() {
    fetch("/add-actionable/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify({ "currentActionableHolder": currentActionableHolder })
    })
        .then(response => response.json())
        .then(data => {
            currentActionableHolder.pk = data["actionablePK"];
            addFadingMessage(data.message);
        })
        .catch(error => {
            addFadingMessage(error);
        });
}


//inititalize a select, used to set up a modifiable actionable name and its section in
//the actionable list of the current session
//also attaches a listener to the select
function initializeSelect(selectClassName, parentObject, listOfOptions,
    selectedOption, selectName, passedConfirmerFunction) {
    const currentSelect = document.createElement("select");
    currentSelect.className = selectClassName;
    parentObject.appendChild(currentSelect);
    //popualte the actionable
    for (const option of listOfOptions) {
        const newOption = document.createElement("option");
        newOption.textContent = option;
        currentSelect.appendChild(newOption);
        if (newOption.textContent === selectedOption)
            newOption.selected = true;
    }

    //listener for the select
    currentSelect.addEventListener("change", updateActionable, false);
    currentSelect.name = selectName;
    currentSelect.confirmer = passedConfirmerFunction.bind(currentSelect);
}

//intitalizes the fields for startFrom and endTo of a single actionable
//if the case is 1 (i.e. an archived session) it will have the field as a span instead of an input
//also sets listeners for the field
function initializeActionableTimeField(parentObject, fieldName, value, caseValue) {
    let timeSpanField;
    if (caseValue != 1) {
        timeSpanField = document.createElement("input");
        timeSpanField.value = epochMilliSecondsToTime(value);

        timeSpanField.pattern = "^(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$";
        timeSpanField.type = "text";
        timeSpanField.oninvalid = function () { this.setCustomValidity("Input must be of hh:mm:ss format"); };
        timeSpanField.onchange = function () { this.setCustomValidity(""); };
        //listener
        timeSpanField.oldValue = timeSpanField.value;
        timeSpanField.addEventListener("change", updateActionable, false);
        timeSpanField.confirmer = confirmerFunction.bind(timeSpanField);
    }
    else {
        timeSpanField = document.createElement("span");
        timeSpanField.textContent = epochMilliSecondsToTime(value);
    }

    timeSpanField.name = fieldName;
    timeSpanField.dataset.rawValue = value;
    parentObject.appendChild(timeSpanField);
}
