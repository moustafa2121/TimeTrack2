//timer stuff
let setIntervalRef;
let delta;

let currentActionableOutput;

//listener for the buttons
let actionableButtons = document.getElementsByClassName("actionableButton");
//todo: modifiable default actionable in the settings
let defaultActionable = document.getElementById("actionable_Working");

//handling sessions
const totalSessionTimeOutput = document.getElementById("totalSessionTimeOutput");
totalSessionTimeOutput.textContent = formatTime(0);
const buttonStartingSession = document.getElementById("buttonStartingSession");

buttonStartingSession.addEventListener("click", (event) => {
    if (!currentSessionData.previouslySelectedSection) {//select a section
        alert("You need to select the current Section");
        return;
    }
    currentSessionData.activeSession = true;
    defaultActionable.click()
    switchFadedButtons();
});
const buttonEndingSession = document.getElementById("buttonEndSession");
buttonEndingSession.addEventListener("click", (event) => {
    if (confirm("Are you sure you want to end this session? Once ended you can no longer edit the actionables of that session.")){
        endActionable(document.querySelector(".actionableButtonSelected"));

        currentSessionData.previouslySelectedSection.classList.remove("spanSelected");
        currentSessionData.activeSession = false;
        updateSession();
        currentSessionData = getNewCurrentSessionData()
        switchFadedButtons();

        totalSessionTimeOutput.textContent = formatTime(0);
    }
});

//when session is active the buttonStartingSession is faded and the buttonEndingSession
//is normal. when inactive session, it is opposive
function switchFadedButtons() {
    if (currentSessionData.activeSession) {
        buttonStartingSession.classList.add("sessionFadedButton");
        buttonEndingSession.classList.remove("sessionFadedButton");
    }
    else {
        buttonEndingSession.classList.add("sessionFadedButton");
        buttonStartingSession.classList.remove("sessionFadedButton");
    }
}

//handles starting and ending sessions
function updateSession() {
    if (!currentSessionData.activeSession) {//ending the session
        currentSessionData.endTo = Date.now();
    }
    fetch("/update-session/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify({ "passedSession": currentSessionData })
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
//assign the event listners
for (i of actionableButtons) {
    i.addEventListener("click", function () {
        if (!currentSessionData.activeSession) {//select a session
            alert("You need to start a session");
            return;
        }
        
        //if the session is active and there is a selected actionable, end it
        const previouslySelectedActionableButton = document.querySelector(".actionableButtonSelected");
        if (previouslySelectedActionableButton) {
            endActionable(previouslySelectedActionableButton);
        }

        //start the timer 
        this.classList.add("actionableButtonSelected");
        startInterval(this);
    })
}

function endActionable(previouslySelectedActionableButton) {
    previouslySelectedActionableButton.classList.remove("actionableButtonSelected");

    //update the current log/actionable
    currentActionable.endTo = Date.now();
    currentActionable.detail = document.querySelector("#currentActionableDiv .singleActionableDetails").value;
    currentActionable.currentSession = currentSessionData.startFrom;
    //send it back to the server using fetchAPI
    addActionable();
    currentSessionData.totalTimeHolder += (currentActionable.endTo - currentActionable.startFrom);

    //draw the actionable
    displayActionable(currentActionable, document.querySelector(".singleSessionActionablesContainer"), true, id = currentActionable.pkID);
    clearInterval(setIntervalRef);
    currentActionableOutput.textContent = formatTime(0);
    currentActionable = getNewCurrentActionable();
}

function startInterval(passedActionable) {
    if (currentSessionData.startFrom == 0) {//happens when switching to new session
        currentSessionData.startFrom = Date.now();
        updateSession();//save the new session
    }
    //happens when switching actionables as opposed to reloading the page
    if (passedActionable) {
        currentActionable.startFrom = Date.now();
        currentActionable.actionableName = passedActionable.textContent;
        currentActionable.actionableColor = passedActionable.style.backgroundColor;
        currentActionable.currentSection = getCurrentSectionedLayerID();
    }
    else {
        document.querySelector("#actionable_" + escapeSpaceWithBackslashes(currentActionable.actionableName)).classList.add("actionableButtonSelected");
    }

    displayCurrentActionable(currentActionable, document.getElementById("currentActionableDiv"));

    setIntervalRef = setInterval(function theIntervalFunction() {
        delta = Date.now() - currentActionable.startFrom;
        currentActionableOutput.textContent = formatTime(Math.floor(delta / 1000));
        totalSessionTimeOutput.textContent = formatTime(Math.floor((delta + currentSessionData.totalTimeHolder) / 1000));
    }, 1000);
}

//sends a new actionable to the DB using fetchAPI
function addActionable() {
    fetch("/add-actionable/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify({ "passedLogObject": currentActionable })
    })
        .then(response => response.json())
        .then(data => {
            currentActionable.pkID = data["actionablePK"];
            addFadingMessage(data.message);
        })
        .catch(error => {
            addFadingMessage(error);
        });
}

function displayCurrentActionable(passedActionable, parentObject) {
    let t1, t2, t3;
    if (parentObject.querySelector(".singleActionableDiv"))
        parentObject.querySelector(".singleActionableDiv").remove()

    //one actionable
    let singleActionableDiv = document.createElement("div");
    singleActionableDiv.className = "singleActionableDiv";
    parentObject.appendChild(singleActionableDiv);

    displayActionable_firstPart(passedActionable, singleActionableDiv, false);

    currentActionableOutput = document.createElement("span");
    currentActionableOutput.id = "currentActionableOutput";
    currentActionableOutput.textContent = formatTime(0);
    currentActionableOutput.style.marginLeft = "150px";
    singleActionableDiv.appendChild(currentActionableOutput);
}

function displayActionable_firstPart(passedActionable, parentObject, actionablesModify=true) {

    //color square
    let actionableColor = document.createElement("div");
    actionableColor.style.backgroundColor = passedActionable.actionableColor;
    actionableColor.className = "singleActionableColor";
    parentObject.appendChild(actionableColor);

    if (actionablesModify) {//a selectable (for modifiable actionables)
        let actionablesSelect = document.createElement("select");
        for (const opt of getListOfActionables()) {
            const newOpt = document.createElement("option");
            newOpt.textContent = opt;
            actionablesSelect.appendChild(newOpt);
            if (newOpt.textContent == passedActionable.actionableName) 
                newOpt.selected = true;
        }
        actionablesSelect.className = "singleActionableSelect";
        parentObject.appendChild(actionablesSelect);

        //section
        let sectionSelect = document.createElement("select");
        for (const sec of getListOfSections()) {
            const newSec = document.createElement("option");
            newSec.textContent = sec;
            sectionSelect.appendChild(newSec);
            if (newSec.textContent == sectionedLayerIDToSectionName(passedActionable.currentSection))
                newSec.selected = true;
        }
        sectionSelect.className = "singleSectionSelect";
        parentObject.appendChild(sectionSelect);
    }
    else {//name&section (for the current actionable)
        let actionableName = document.createElement("span");
        actionableName.className = "singleActionableName";
        actionableName.textContent = passedActionable.actionableName;
        actionableName.title = passedActionable.actionableName;
        parentObject.appendChild(actionableName);

        //section
        let sectionName = document.createElement("span");
        sectionName.textContent = sectionedLayerIDToSectionName(passedActionable.currentSection);
        sectionName.title = sectionedLayerIDToSectionName(passedActionable.currentSection);
        sectionName.className = "singleActionableSection";
        parentObject.appendChild(sectionName);
    }
        
    //details
    let details = document.createElement("input");
    details.className = "singleActionableDetails";
    details.type = "text";
    details.value = passedActionable.detail;
    details.placeholder = "Actionable Details";
    details.maxLength = 250;
    parentObject.appendChild(details);
}

function displayBar(barRef, obj, divider=secondsInDay) {
    //bar stuff
    subBar = document.createElement("span");
    subBar.style.display = "inline-block";
    subBar.style.backgroundColor = obj.actionableColor;
    let currentSeconds = Math.ceil((obj.endTo - obj.startFrom) / 1000);
    currentSeconds *= 100;
    let width = (currentSeconds / divider) + "%";
    subBar.style.width = width;
    subBar.className = "subBarClass"
    barRef.appendChild(subBar);
}

//draws the subbar of a single actionable
function displayActionable(obj, parentObject, actionablesModify=true, id=null) {
    let barRef = parentObject.parentNode.querySelector(".barClass");
    displayBar(barRef, obj);
    
    //one actionable
    let singleActionableDiv = document.createElement("div");
    singleActionableDiv.className = "singleActionableDiv";
    if (parentObject.firstChild)
        parentObject.insertBefore(singleActionableDiv, parentObject.firstChild);
    else
        parentObject.appendChild(singleActionableDiv)
    console.log(id);
    if (id)
        singleActionableDiv.id = id;
    
    //display the first part
    displayActionable_firstPart(obj, singleActionableDiv, actionablesModify=actionablesModify);
        
    //time span
    let timeSpan = document.createElement("span")
    timeSpan.className = "timeActionableDetail";
    singleActionableDiv.appendChild(timeSpan);

    let timeSpanFrom = document.createElement("input");
    timeSpanFrom.value = secondsToTime(obj.startFrom);
    timeSpanFrom.dataset.rawValue = obj.startFrom;
    timeSpanFrom.pattern = "^(?:[01]\\d|2[0-3]):[0-5]\\d$";
    timeSpanFrom.type = "text";
    timeSpanFrom.oninvalid = function () { this.setCustomValidity("Input must be of hh:mm format");};
    timeSpanFrom.onchange = function () { this.setCustomValidity(""); };
    timeSpan.appendChild(timeSpanFrom);

    let timeSpanTo = document.createElement("input");
    timeSpanTo.value = secondsToTime(obj.endTo);
    timeSpanTo.dataset.rawValue = obj.endTo;
    timeSpanTo.pattern = "^(?:[01]\\d|2[0-3]):[0-5]\\d$";
    timeSpanTo.type = "text";
    timeSpanTo.oninvalid = function () { this.setCustomValidity("Input must be of hh:mm format"); };
    timeSpanTo.onchange = function () { this.setCustomValidity(""); };

    let d = document.createTextNode("  -->  ");
    timeSpan.appendChild(d);
    timeSpan.appendChild(timeSpanTo);

    let totalTime = document.createElement("span");
    totalTime.textContent = " Total: " + formatTime(Math.floor((obj.endTo - obj.startFrom) / 1000));
    timeSpan.appendChild(totalTime);

    let actionableDeleteButton = document.createElement("button");
    actionableDeleteButton.textContent = "X";
    timeSpan.appendChild(actionableDeleteButton);

    //make sure only the most recent actionable is can be edited, actionable details can still be edited
    if (parentObject.querySelectorAll(".singleActionableDiv")[1]) {
        let currentSecondChild = parentObject.querySelectorAll(".singleActionableDiv")[1];
        //currentFirstChild.children[1].readOnly = true;
        let t = Array.from(currentSecondChild.querySelectorAll(".timeActionableDetail input"));
        t.map(function (currentObj) {
            currentObj.readOnly = true;
            currentObj.style.cursor = "default";
        });
        //currentSecondChild.querySelector("button").classList.add("sessionFadedButton");
    }

    //edit the actionable, section, details, from and to.
    let actionableSelect = parentObject.querySelector(".singleActionableSelect");
    actionableSelect.addEventListener("change", updateActionable, false);
    actionableSelect.name = "name";

    let sectionSelect = parentObject.querySelector(".singleSectionSelect");
    sectionSelect.addEventListener("change", updateActionable, false);
    sectionSelect.name = "currentSection";

    let details = parentObject.querySelector(".singleActionableDetails");
    details.addEventListener("change", updateActionable, false);
    details.name = "detail";
    details.oldValue = details.value;

    timeSpanFrom.oldValue = timeSpanFrom.value;
    timeSpanFrom.addEventListener("change", updateActionable, false);
    timeSpanFrom.name = "startFrom";

    timeSpanTo.oldValue = timeSpanTo.value;
    timeSpanTo.addEventListener("change", updateActionable, false);
    timeSpanTo.name = "endTo";
        
    actionableSelect.confirmer = confirmerFunction.bind(actionableSelect);
    sectionSelect.confirmer = confirmerFunction.bind(sectionSelect);
    details.confirmer = confirmerFunction.bind(details);
    timeSpanFrom.confirmer = confirmerFunction.bind(timeSpanFrom);
    timeSpanTo.confirmer = confirmerFunction.bind(timeSpanTo);
}

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
    const nextSingleActionableDetail = currentTarget.parentNode.parentNode.nextElementSibling;
    if (nextSingleActionableDetail) {//check if there are siblings
        const endToValue = nextSingleActionableDetail.querySelector('[name="endTo"]').dataset.rawValue;
    }
    else {//no siblings
        currentTarget.confirmer();
    }

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

confirmerFunction = function () {
    console.log("oh yes indeed m8 "+ this.value);
}