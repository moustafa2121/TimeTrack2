//constants
const constantValues = (function () {
    //total hours displayed in the barClass, 24 hours by default
    const totalBarHours = 24;
    //total time per session, 24 hours by default
    const maxSessionSeconds = 24 * 3600;
    //if false it displays the time from min to max
    //if true, it will start from the session's starting time
    //till a max of +24 hours from start
    const displaySessionDuration = true;
    //the min and max of the starting/end point of the bar
    const minBarHours = "00:00";
    const maxBarHours = "24:00";
    return function () {
        return {
            totalBarHours: totalBarHours,
            minBarHours: minBarHours,
            maxBarHours: maxBarHours,
            maxSessionSeconds: maxSessionSeconds,
            displaySessionDuration: displaySessionDuration,
        }
    }
})();


//add a message and then hideout after x seconds
//it also removes the element after y second of the itnerval
const addFadingMessage = (() => {
    const toastLiveExample = document.getElementById('liveToast')
    const toastBody = toastLiveExample.getElementsByClassName('toast-body')[0]
    return (message, interval = 4000) => {
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
        toastBootstrap.show()
        toastBody.textContent = message;
    }
})();

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
    const formattedTimeString1 = timeString1.replace(/^[A-Za-z]+: /, "");
    const formattedTimeString2 = timeString2.replace(/^[A-Za-z]+: /, "");

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
    element.textContent = "T: " + totalSecondsToTime(Math.floor((end - start) / 1000));
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

//a function that is called on when an actionable is selected
//it handles how the style of the selected actioanble
function toggleActionablButtonSelected(buttonSelected, enable) {
    if (enable) {
        buttonSelected.classList.add("actionableButtonSelected");
        buttonSelected.style.backgroundColor = buttonSelected.style.borderColor;
        buttonSelected.style.color = "white";
    }
    else {
        buttonSelected.classList.remove("actionableButtonSelected");
        buttonSelected.style.color = buttonSelected.style.borderColor;
        buttonSelected.style.backgroundColor = "transparent";
    }
}

//list of actionables buttons in the html
const actionableButtons = (function () {
    const actionableButtonsRef = document.getElementsByClassName("actionableButton");
    return function () { return actionableButtonsRef; };
})();

//a closure, pass an actionable name
//returns its color
const getActionableColor = (function () {
    const actionables = document.querySelectorAll(".actionableButton");
    const actionablesColor = {};
    for (const actionable of actionables)
        actionablesColor[actionable.textContent] = actionable.style.color;

    return function (actionableName) {
        return actionablesColor[actionableName];
    }
})();

//disables/enables the actionable buttons
//usually used in starting and ending sessions so the user
//does not start a new actionable while saving a new session
function enableActionableButtons(enable) {
    Array.from(actionableButtons()).map(target => target.disabled = !enable)
}

//return an array of actionable names
const getListOfActionablesNames = (function () {
    let t = Array.from(document.querySelectorAll(".actionableButton"));
    let g = t.map(target => target.textContent);
    return function () { return g; }
})();

//returns an object that holds the total time for
//each actionable type in one session
//each intialized to 00:00:00
function getNewTotalTimeActionablesHolder() {
    const actionablesTimeHolderObject = {};
    for (const actionableName of getListOfActionablesNames())
        actionablesTimeHolderObject[actionableName] = "00:00:00";
    return actionablesTimeHolderObject;
}

//if there is a second child to the parent, then
//enables or diables the delete button of an actionable
function enableDeleteButton(parentObject, enable) {
    const currentSecondChild = parentObject.querySelectorAll(".singleActionableDiv")[1];
    if (currentSecondChild)
        currentSecondChild.querySelector("button").classList.toggle("sessionFadedButton", enable);
}


//given an actionable name, return the color
function getActionableColor_old(actionableName) {
    if (actionableName === "Working")
        return "blue";
    else if (actionableName === "Break")
        return "green";
    else if (actionableName === "Natural Break")
        return "Darkgreen";
    else if (actionableName === "Interrupted")
        return "Yellow";
    else if (actionableName === "Wasted")
        return "red";
    else if (actionableName === "Sleep")
        return "pink";
    else
        return "white";
}

/* utility functions */

//sets the title of the session and their display
function setSessionTitle(session, titleParent) {
    const startFrom = session["pk"];
    const endTo = session["fields"].endTo;
    const totalTime = endTo - startFrom;
    const title = document.createElement("h5");
    title.style.display = "inline-block";
    title.style.margin = "0px";
    title.style.font = "0.6em";
    title.textContent += "Session of " + epochMilliSecondsToDate(startFrom);
    titleParent.appendChild(title);

    const title2 = document.createElement("span");
    title2.style.position = "absolute";
    title2.style.right = "8%";
    titleParent.appendChild(title2);

    const t1 = document.createElement("h6");
    t1.textContent = epochMilliSecondsToTime(startFrom);
    title2.appendChild(t1);

    const t2 = document.createElement("h6");
    t2.textContent = "-";
    t2.style.marginLeft = "8px";
    t2.style.marginRight = "8px";
    title2.appendChild(t2);

    const t3 = document.createElement("h6");
    t3.textContent = epochMilliSecondsToTime(endTo);
    title2.appendChild(t3);

    const t4 = document.createElement("h6");
    t4.style.marginLeft = "20px";
    t4.textContent = "T: " + totalSecondsToTime(Math.floor(totalTime / 1000));
    title2.appendChild(t4);
}


function toggleTimeSpanPosition(enable) {

}

//rturns an svg element that has the trash icon
//for the delete actionable button
function actionableTrashIcon() {
    // Create an SVG element using createElementNS
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "20");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("class", "bi bi-trash");
    svg.setAttribute("viewBox", "0 0 16 20");

    // Append the SVG path elements to the SVG element
    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path1.setAttribute("d", "M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Z");
    svg.appendChild(path1);

    const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path2.setAttribute("d", "M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z");
    svg.appendChild(path2);

    return svg;
}

//returns an svg element that has the button icon
//for the minimizing button of the actionables
//true for an up arrow, false for a down arrow
function minimizingArrowIcon(isUpArrow) {
    // Create an SVG element
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    // Set common SVG attributes
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "6");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("class", isUpArrow ? "bi bi-arrow-bar-up" : "bi bi-arrow-bar-down");
    svg.setAttribute("viewBox", "0 5 16 8");

    // Create and set the path element
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute(
        "d",
        isUpArrow
            ? "M8 10a.5.5 0 0 0 .5-.5V3.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 3.707V9.5a.5.5 0 0 0 .5.5zm-7 2.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5"
            : "M1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zM8 6a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L7.5 12.293V6.5A.5.5 0 0 1 8 6z"
    );

    svg.appendChild(path);
    return svg;
}

//creates and returns the icon for the collapse button of the sections
function createArrowRightIcon() {
    // Create the SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("class", "bi bi-caret-right-fill");
    svg.setAttribute("viewBox", "0 0 16 16");

    // Create the path element
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("d", "m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z");

    // Append the path element to the SVG element
    svg.appendChild(path);
    svg.style.opacity = "0.5";
    svg.style.scale = "0.6";

    // Return the created SVG element
    return svg;
}
//toggles the arrows of collapsing/uncollapsing of sections
function toggleRotateArrow(svg) {
    const currentTransform = svg.style.transform;
    if (currentTransform === 'rotate(45deg)')
        svg.style.transform = 'none';
    else
        svg.style.transform = 'rotate(45deg)';
}

//close the modal on submission
(() => {
    const closeBtn = document.querySelector("#statsModalRequest .btn-close")
    document.getElementById('statsForm').addEventListener('submit', e => closeBtn.click());
})();


//takes the minimizingArrow element
//if it is up arrow it will switch to down arrow and vice verca
//Also
//has a line that will change the time span items (startFrom, endTo, and total)
//to have the position value form absolute to relative
//this is because of the position is absolute the collapse animation
//is wrong. switches back when clicked again
function toggleMinimizingArrowIcon(element) {
    //disable to prevent user spaming it
    element.disabled = true;
    setTimeout(() => element.disabled = false, 1000);

    // Check if the element contains an SVG with the class 'bi-arrow-bar-up'
    const upArrowSVG = element.querySelector(".bi-arrow-bar-up");
    if (upArrowSVG) {
        // If an up arrow SVG is found, replace it with a down arrow SVG
        element.replaceChild(minimizingArrowIcon(false), upArrowSVG);
        //Array.from(element.parentNode.querySelectorAll(".singleSessionActionablesContainer .singleActionableDiv .timeActionableDetail")).map(x => x.style.position = "static");
    }
    else {
        // If no up arrow SVG is found, assume there's a down arrow SVG and replace it with an up arrow SVG
        const downArrowSVG = element.querySelector(".bi-arrow-bar-down");
        element.replaceChild(minimizingArrowIcon(true), downArrowSVG);
        //Array.from(element.parentNode.querySelectorAll(".singleSessionActionablesContainer .singleActionableDiv .timeActionableDetail")).map(x => x.style.position = "");
    }
}

function XOR(a, b) {
    return (a || b) && !(a && b);
}

function escapeSpaceWithBackslashes(inputString) {
    return inputString.replace(/ /g, '\\ ');
}

function escapePeriodWithBackslashes(inputString) {
    return inputString.replace(/\./g, '\\.');
}


//used by the ruler for the barClass
//it takes two arguments in the format "hh:mm"
//and optional divideValue
//returns time intervals between the two arguments as a labels for the ruler
function divideTimeRange(minTime, maxTime, divideValue = 6) {
    const minTotalMin = parseInt(minTime.split(':')[0]) * 60 + parseInt(minTime.split(':')[1]);

    const timeIntervals = [];
    const totalMinutes = calculateTimeDifference(minTime, maxTime);
    const stepSize = totalMinutes / (divideValue - 1);

    // Generate the time intervals
    for (let i = 0; i < divideValue; i++) {
        // Calculate the total minutes in the interval, taking modulo 1440 for 24 hours
        const totalMinutesInInterval = (minTotalMin + i * stepSize) % 1440;

        // Calculate hours and minutes
        const hoursInInterval = Math.floor(totalMinutesInInterval / 60);
        const minutesInInterval = totalMinutesInInterval % 60;

        const formattedTime = `${String(hoursInInterval).padStart(2, '0')}:${String(minutesInInterval).padStart(2, '0')}`;
        timeIntervals.push(formattedTime);
    }
    return timeIntervals;
}

//takes two arguments of type "hh:mm"
//returns the total minutes between them
//time range should not exceed 23:59 between the two arguments
//if endTime is given as -1 it will just assume that the duration is 
//24 hours (by default)
function calculateTimeDifference(startTime, endTime=-1) {
    // Parse the start and end times
    const startParts = startTime.split(':');
    const startHours = parseInt(startParts[0]);
    const startMinutes = parseInt(startParts[1]);

    let endHours, endMinutes;

    // Check if endTime is -1, and if so, assume 24 hours after startTime
    if (endTime === -1) {
        endHours = startHours + constantValues().totalBarHours;
        endMinutes = startMinutes;
    } else {
        const endParts = endTime.split(':');
        endHours = parseInt(endParts[0]);
        endMinutes = parseInt(endParts[1]);
    }

    // Calculate the time difference in minutes
    let minutesDifference = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

    // Adjust for negative differences (crossing midnight)
    if (minutesDifference < 0) {
        minutesDifference += 24 * 60; // Add 24 hours in minutes
    }
    return minutesDifference;
}

//reduce the given time in the "hh:mm" format by one minute
//used by the ruler
function reduceTimeByOneMinute(time) {
    if (time === '00:00') {
        return '23:59';
    }

    const [hours, minutes] = time.split(':');
    let reducedHours = parseInt(hours);
    let reducedMinutes = parseInt(minutes);

    if (reducedMinutes > 0) {
        reducedMinutes--;
    } else {
        if (reducedHours > 0) {
            reducedHours--;
            reducedMinutes = 59;
        } else {
            // Time cannot go below 00:00
            return '00:00';
        }
    }

    // Format the reduced time
    const formattedHours = String(reducedHours).padStart(2, '0');
    const formattedMinutes = String(reducedMinutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}

//takes an epoch
//returns "hh:mm"
function timestampToHHMM(epochMilliseconds) {
    const date = new Date(epochMilliseconds);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

//media queries functions
(() => {
    const navBarLeft = document.getElementById("navBarLeft");
    let whaleWidth = true;
    const navBarLeftEvent = () => {
        if (window.innerWidth < 1400 && whaleWidth) {
            navBarLeft.classList.add("offcanvas");
            navBarLeft.classList.add("offcanvas-start");
            whaleWidth = false;
        }
        else if (window.innerWidth >= 1400 && !whaleWidth) {
            navBarLeft.classList.remove("offcanvas");
            navBarLeft.classList.remove("offcanvas-start");
            whaleWidth = true;
        }
    }
    window.addEventListener("load", navBarLeftEvent);
    window.addEventListener("resize", navBarLeftEvent);
})();