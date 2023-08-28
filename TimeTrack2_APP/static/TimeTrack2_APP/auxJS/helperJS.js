//constants
const constantValues = (function () {
    //const secondsInDay = 86400;
    const secondsInDay = 86400 / 4;
    const displayBarMaxValue = secondsInDay / 3600;
    return function () {
        return {
            secondsInDay: secondsInDay,
            displayBarMaxValue: displayBarMaxValue,
        }
    }
})();

/* references */

//list of actionables buttons in the html
const actionableButtons = (function () {
    const actionableButtonsRef = document.getElementsByClassName("actionableButton");
    return function () { return actionableButtonsRef; };
})();

/* messages */
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


/* time format functions */

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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
    return formattedHours + ':' + formattedMinutes + ':' + formattedSeconds;
}

//takes two strings of the format "Total: 00:04:08"
//returns their added value in hh:mm:ss format
function addTimeStrings(timeString1, timeString2) {
    const formattedTimeString1 = timeString1.replace(/^Total: /, "");
    const formattedTimeString2 = timeString2.replace(/^Total: /, "");

    const timeParts1 = formattedTimeString1.split(":");
    const timeParts2 = formattedTimeString2.split(":");

    const hours1 = parseInt(timeParts1[0]);
    const minutes1 = parseInt(timeParts1[1]);
    const seconds1 = parseInt(timeParts1[2]);
    const hours2 = parseInt(timeParts2[0]);
    const minutes2 = parseInt(timeParts2[1]);
    const seconds2 = parseInt(timeParts2[2]);

    const totalSeconds = (hours1 + hours2) * 3600 + (minutes1 + minutes2) * 60 + (seconds1 + seconds2);

    const newHours = Math.floor(totalSeconds / 3600);
    const newMinutes = Math.floor((totalSeconds % 3600) / 60);
    const newSeconds = totalSeconds % 60;

    return ("00" + newHours).slice(-2) + ":" +
        ("00" + newMinutes).slice(-2) + ":" +
        ("00" + newSeconds).slice(-2);
}

//updates the total time of a given actionable (element)
//start and end are epoch
function updateTotalTime(element, start, end) {
    element.textContent = "Total: " + totalSecondsToTime(Math.floor((end - start) / 1000));
}

/* section helper functions */

//pass a section id e.g. 1.1.1
//returns the element's layer name
function sectionedLayerIDToSectionName(target) {
    return target+"_"+document.getElementById("sectionContainerInd_" + target).querySelector("span").textContent.trim();
}

//pass a section id e.g. 1.1.1
//returns the element in the html
function sectionedLayerIDToSectionElement(target) {
    return document.getElementById("sectionContainerInd_" + target).querySelector("span");
}

//returns an array of sections
function getListOfSections() {
    let t = Array.from(document.querySelectorAll(".sectionContainerInd"));
    let g = t.map(target => target.id.split("_")[1]+"_"+target.querySelector("span").textContent.trim());
    return g;
}

//pass a section element
//returns the id of the section (held by the parent)
function getSectionIdThroughParent(span) {
    return span.parentElement.id.split("_")[1];
}


/* actionable helper functions */

//pass an actionable name
//returns its color
function getActionableColor(actionableName) {
    let t = document.querySelectorAll(".actionableButton");
    for (let i of t) {
        if (i.textContent == actionableName) {
            return i.style.backgroundColor;
        }
    }
    return "black";
}

//disables/enables the actionable buttons
//usually used in starting and ending sessions so the user
//does not start a new actionable while saving a new session
function enableActionableButtons(enable) {
    Array.from(actionableButtons()).map(target => target.disabled = !enable)
}

//return an array of actionable names
function getListOfActionablesNames() {
    let t = Array.from(document.querySelectorAll(".actionableButton"));
    let g = t.map(target => target.textContent);
    return g;
}

//returns an object that holds the total time for
//each actionable type in one session
//each intialized to 00:00:00
function getNewTotalTimeActionablesHolder() {
    let actionablesTimeHolder = {};
    for (const actionableName of getListOfActionablesNames())
        actionablesTimeHolder[actionableName] = "00:00:00";
    return actionablesTimeHolder;
}

//if there is a second child to the parent, then
//enables or diables the delete button of an actionable
function enableDeleteButton(parentObject, enable) {
    const currentSecondChild = parentObject.querySelectorAll(".singleActionableDiv")[1];
    if (currentSecondChild)
        currentSecondChild.querySelector("button").classList.toggle("sessionFadedButton", enable);
}



/* utility functions */

function XOR(a, b) {
    return (a || b) && !(a && b);
}

function escapeSpaceWithBackslashes(inputString) {
    return inputString.replace(/ /g, '\\ ');
}

function escapePeriodWithBackslashes(inputString) {
    return inputString.replace(/\./g, '\\.');
}