//const secondsInDay = 86400;
const secondsInDay = 3600;

let currentSessionData = getNewCurrentSessionData();
let currentActionable = getNewCurrentActionable();

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
window.addEventListener("unload", () => {
    if (currentSessionData.previouslySelectedSection) {
        localStorage.setItem("previouslySelectedSectionID", getSectionIdThroughParent(currentSessionData.previouslySelectedSection));
    }
    currentActionable.detail = document.querySelector("#currentActionableDiv .singleActionableDetails").value;
    localStorage.setItem("currentSessionData", JSON.stringify(currentSessionData));
    localStorage.setItem("currentActionable", JSON.stringify(currentActionable));
}, false);

window.addEventListener("load", () => {
    currentSessionData = JSON.parse(localStorage.getItem("currentSessionData"));
    let t = localStorage.getItem("previouslySelectedSectionID");
    if (t) {
        let span = document.querySelector("#" + escapePeriodWithBackslashes(t) + " span");
        currentSessionData.previouslySelectedSection = span;
        currentSessionData.previouslySelectedSection.classList.add("spanSelected");
    }
    else {
        currentSessionData = getNewCurrentSessionData();
    }
    currentActionable = JSON.parse(localStorage.getItem("currentActionable"));
    if (currentActionable && currentActionable.startFrom != 0) {
        startInterval(null);
        switchFadedButtons();
    }
    else {
        currentActionable = getNewCurrentActionable();
    }

    //remove the items from the local storage
    localStorage.removeItem("previouslySelectedSectionID");
    localStorage.removeItem("currentSessionData");
    localStorage.removeItem("currentActionable");

    //fix the all sessions display
    allSessions = document.querySelectorAll(".singleSessionDiv"); 
    let currentActionableCheck = false;
    for (i of allSessions) {
        if (!i.querySelector("#currentActionableDiv")) {
            let title = i.querySelector("span:nth-child(1)");
            const endTo = parseInt(title.getAttribute("data-raw-endTo"));
            const startFrom = parseInt(title.getAttribute("data-raw-startFrom"));
            const totalTime = endTo - startFrom;
            title.textContent += " >>> Starting from: " + secondsToTime(startFrom) + " to: " + secondsToTime(endTo) + " for a total of: " + formatTime(Math.floor(totalTime / 1000));
            currentActionableCheck = false;
        }
        else
            currentActionableCheck = true;

        const barRef = i.querySelector(".barClass");
        for (actionable of Array.from(i.querySelector(".singleSessionActionablesContainer").querySelectorAll(".singleActionableDiv")).reverse()) {
            const timeSpan = actionable.querySelector(".timeActionableDetail");
            const startFrom = timeSpan.querySelector("span:nth-child(1)");
            const endTo = timeSpan.querySelector("span:nth-child(3)");
            actionable.actionableColor = getActionableColor(actionable.querySelector(".singleActionableName").textContent);
            actionable.startFrom = parseInt(startFrom.getAttribute("data-raw-value"));
            actionable.endTo = parseInt(endTo.getAttribute("data-raw-value"));
            displayBar(barRef, actionable);

            const color = actionable.querySelector(".singleActionableColor");
            color.style.backgroundColor = actionable.actionableColor;
            const section = actionable.querySelector(".singleActionableSection");
            section.textContent = section.textContent.split("_")[1];

            startFrom.textContent = secondsToTime(actionable.startFrom);
            endTo.textContent = secondsToTime(actionable.endTo);
            const totalTime = timeSpan.querySelector("span:nth-child(4)");
            totalTime.textContent = " Total: " + formatTime(Math.floor((parseInt(endTo.getAttribute("data-raw-value")) - parseInt(startFrom.getAttribute("data-raw-value"))) / 1000));

            if (currentActionableCheck) {
                const tmp = actionable.querySelector(".singleActionableDetails");
                const tmpNextSibling = tmp.nextSibling;
                const tmpText = tmp.value;
                tmp.remove();

                let details = document.createElement("input");
                details.className = "singleActionableDetails";
                details.type = "text";
                details.value = tmpText;
                details.placeholder = "Actionable Details";
                details.maxLength = 250;
                actionable.insertBefore(details, tmpNextSibling);

                details.addEventListener("change", updateActionable, false);
                details.name = "detail";
                details.oldValue = details.value;
            }
        }
        
    }
}, false);


document.getElementById("totalButtonReset").addEventListener("click", (event) => {
    localStorage.removeItem("previouslySelectedSectionID");
    localStorage.removeItem("currentSessionData");
    localStorage.removeItem("currentActionable");

    currentSessionData = getNewCurrentSessionData();
    currentActionable = getNewCurrentActionable();
    location.reload()
})

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

function isObject(targetObj) {
    return Object.keys(targetObj).length === 0 && targetObj.constructor === Object;
}

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

//takes seconds
//returns hh:mm:ss
function secondsToTime(epoch) {
    t = new Date(epoch);
    return ("0" + t.getHours()).slice(-2) + ":" + ("0" + t.getMinutes()).slice(-2) + ":" + ("0" + t.getSeconds()).slice(-2);
}

//takes seconds
//returns hh:dd:mm string format
function formatTime(seconds) {
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

function timeDifference(time1, time2) {
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
    const diffMinutes = (h1 * 60 + m1) - (h2 * 60 + m2);
    return `${String(Math.floor(diffMinutes / 60)).padStart(2, "0")}:${String(diffMinutes % 60).padStart(2, "0")}`;
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