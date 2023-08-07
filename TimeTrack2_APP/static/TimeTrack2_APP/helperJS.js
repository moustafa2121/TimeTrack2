//const secondsInDay = 86400;
const secondsInDay = 3600;

//holds the current actionables and the current session data in local stroage
//as persistant data to be used when refreshing/reloading the page
let currentSessionHolder;
let currentActionableHolder;
function getNewCurrentSessionData() {
    return {
        previouslySelectedSection: null,
        startFrom: 0,
        endTo: 0,
        activeSession: false,
        totalTimeHolder: 0,
    }
}
function getNewCurrentActionable() {
    return {
        startFrom: 0,
        endTo: 0,
        currentSection: null,
        currentSession: null,
        detail: "",
        actionableName: null,
        actionableColor: null,
    }
}

//handles the closing/refresh of the webpage by storing persistant data in local storage
//on closing
window.addEventListener("unload", () => {
    if (currentSessionHolder.activeSession) {//if there is an active session
        localStorage.setItem("previouslySelectedSectionID", getSectionIdThroughParent(currentSessionHolder.previouslySelectedSection));
        currentActionableHolder.detail = document.querySelector("#currentActionableDiv .singleActionableDetails").value;
        localStorage.setItem("currentSessionData", JSON.stringify(currentSessionHolder));
        localStorage.setItem("currentActionable", JSON.stringify(currentActionableHolder));
    }
}, false);

//on opening the page
//attempts to load any data in the localStroage
//if available it will display them
//Also responsible for handling the archived sessions and displaying them
window.addEventListener("load", () => {
    currentSessionHolder = JSON.parse(localStorage.getItem("currentSessionData"));
    if (currentSessionHolder) {//if there was an active session
        //set the selected section
        const previouslySelectedSectionID = localStorage.getItem("previouslySelectedSectionID");
        currentSessionHolder.previouslySelectedSection = document.querySelector("#" + escapePeriodWithBackslashes(previouslySelectedSectionID) + " span");
        currentSessionHolder.previouslySelectedSection.classList.add("spanSelected");

        //start the actionable and session timer if there is an actionable that has started previously
        currentActionableHolder = JSON.parse(localStorage.getItem("currentActionable"));
        if (currentActionableHolder && currentActionableHolder.startFrom != 0) {
            sessionSwitchFadedButtons();

            startActionable();
            //set the actionable button to be the selected one
            document.querySelector("#actionable_" + escapeSpaceWithBackslashes(currentActionableHolder.actionableName)).classList.add("actionableButtonSelected");
        }
        else
            currentActionableHolder = getNewCurrentActionable();
    }
    else {//else just start a new session data object and new actionable
        currentSessionHolder = getNewCurrentSessionData();
        currentActionableHolder = getNewCurrentActionable();
    }

    //remove the items from the local storage
    localStorage.removeItem("previouslySelectedSectionID");
    localStorage.removeItem("currentSessionData");
    localStorage.removeItem("currentActionable");


    //get all archived sessions from the html JSON
    const archivedSessions = document.getElementById("archivedSessions");
    const sessionsList = JSON.parse(document.getElementById('allSessions').textContent);

    for (const sessionActionables of sessionsList) {
        const session = JSON.parse(sessionActionables[0])[0];
        if (!session["fields"]["archived"]) {//current (active) session
            const actionablesContainer = document.getElementsByClassName("singleSessionActionablesContainer")[0];
            displaySingleSession(actionablesContainer, sessionActionables[1], 2)
        }
        else {//for all archived sessions
            //elements for a single session
            const singleSessionDiv = document.createElement("div");
            singleSessionDiv.className = "singleSessionDiv";
            archivedSessions.appendChild(singleSessionDiv);

            const title = document.createElement("h4");
            const startFrom = session["pk"];
            const endTo = session["fields"].endTo;
            const totalTime = endTo - startFrom;
            title.textContent += "Session of " + epochMilliSecondsToDate(startFrom) + ": Starting from " + epochMilliSecondsToTime(startFrom) + " to " + epochMilliSecondsToTime(endTo) + ", for a total of " + totalSecondsToTime(Math.floor(totalTime / 1000));
            singleSessionDiv.appendChild(title);

            const barRef = document.createElement("div");
            barRef.className = "barClass";
            singleSessionDiv.appendChild(barRef);

            const actionablesContainer = document.createElement("div");
            actionablesContainer.className = "singleSessionActionablesContainer";
            singleSessionDiv.appendChild(actionablesContainer);

            displaySingleSession(actionablesContainer, sessionActionables[1], 1)
        }
    }
}, false);


//function that displays a single session and its actionable as per
//the arguments passed from the load event of the page
function displaySingleSession(actionablesContainer, sessionActionablesList, caseValue) {
    //the list of all actionables of a single session
    const currentActionables = JSON.parse(sessionActionablesList)
    for (const currentActionable of currentActionables) {
        //initialize an actionable object
        actionable = {
            startFrom: currentActionable["startFrom"],
            endTo: currentActionable["endTo"],
            currentSection: currentActionable["currentSection"].sectionedLayer,
            detail: currentActionable["detail"],
            actionableName: currentActionable["name"].name,
            actionableColor: null,
        };
        actionable.actionableColor = getActionableColor(actionable.actionableName);

        //display it
        displayActionable(actionable, actionablesContainer, caseValue)
    }
}


const messagesContainer = document.getElementById("messagesContainer");
let messageContainerCounter = 0;
//todo:fading messages effect is sucky when it comes to stacking
//todo: different messages (e.g. success adding and error when adding section)
//appear differently
//add a message and then hideout after 2 seconds
//it also removes the element after 1 second of the itnerval
function addFadingMessage(message, interval = 4000) {
    let tmp = document.createElement("p");
    tmp.textContent = message;
    messagesContainer.appendChild(tmp);
    tmp.style.top = tmp.getBoundingClientRect().top + (45 * messageContainerCounter) + "px";
    messageContainerCounter += 1;

    setTimeout(function () {
        tmp.classList.add("fade-out");
        setTimeout(function () {
            tmp.remove();
            messageContainerCounter -= 1;
        }, 3000);
    }, interval);

    //X button to close.
    let closeButton = document.createElement("button");
    closeButton.textContent = "X";
    tmp.appendChild(closeButton);

    closeButton.addEventListener("click", function (event) {
        tmp.remove();
        messageContainerCounter -= 1;
    });
}


//helper functions

function escapeSpaceWithBackslashes(inputString) {
    return inputString.replace(/ /g, '\\ ');
}
function escapePeriodWithBackslashes(inputString) {
    return inputString.replace(/\./g, '\\.');
}

//takes epoch
//returns a string object of the date and time
function epochToSpecificTimezone(timeEpoch, offset = 0) {
    var d = new Date(timeEpoch);
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);  //This converts to UTC 00:00
    var nd = new Date(utc + (3600000 * offset));
    return nd.toLocaleString();
}

//takes epoch milliseconds
//returns hh:mm:ss
function epochMilliSecondsToTime(epoch) {
    t = new Date(epoch);
    return ("0" + t.getHours()).slice(-2) + ":" + ("0" + t.getMinutes()).slice(-2) + ":" + ("0" + t.getSeconds()).slice(-2);
}

//takes epoch milliseconds
//returns dd/mm/yyyy
function epochMilliSecondsToDate(epoch) {
    const date = new Date(epoch);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

//takes seconds
//returns hh:mm:ss
function totalSecondsToTime(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainingSeconds = seconds % 60;
    var formattedHours = hours.toString().padStart(2, '0');
    var formattedMinutes = minutes.toString().padStart(2, '0');
    var formattedSeconds = remainingSeconds.toString().padStart(2, '0');
    return formattedHours + ':' + formattedMinutes + ':' + formattedSeconds;
}

function getSectionIdThroughParent(span) {
    return span.parentElement.id;
}

function getCurrentSectionedLayerID() {
    let x = document.getElementsByClassName("spanSelected")[0];
    return x.parentNode.id.split("_")[1];
}

function sectionedLayerIDToSectionName(target) {
    return document.getElementById("sectionContainerInd_" + target).querySelector("span").textContent.trim()
}

function getListOfSections() {
    let t = Array.from(document.querySelectorAll(".sectionContainerInd"));
    let g = t.map(target => target.querySelector("span").textContent.trim());
    return g;
}

function getListOfActionables() {
    let t = Array.from(document.querySelectorAll(".actionableButton"));
    let g = t.map(target => target.textContent);
    return g;
}

function getActionableColor(actionableName) {
    let t = document.querySelectorAll(".actionableButton");
    for (let i of t) {
        if (i.textContent == actionableName) {
            return i.style.backgroundColor;
        }
    }
    return "black";
}

//for testing
document.getElementById("totalButtonReset").addEventListener("click", (event) => {
    localStorage.removeItem("previouslySelectedSectionID");
    localStorage.removeItem("currentSessionData");
    localStorage.removeItem("currentActionable");

    currentSessionHolder = getNewCurrentSessionData();
    currentActionableHolder = getNewCurrentActionable();
    location.reload()
})