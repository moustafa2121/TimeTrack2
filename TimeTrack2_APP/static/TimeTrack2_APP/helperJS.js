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
        pk: -1,
    }
}


//on opening the page
//attempts to load any data from the DB
//if available it will display them
//Also responsible for handling the archived sessions and displaying them
window.addEventListener("load", () => {
    //get current archived session from the html JSON
    const currentSessionDB = JSON.parse(document.getElementById('currentSessionDB').textContent);
    //if the length is not 0, there is a current session form the DB
    if (currentSessionDB.length !== 0) {
        //get the data from the json
        currentSessionDBValues = JSON.parse(currentSessionDB[0])[0];
        currentSessionDBActionables = JSON.parse(currentSessionDB[1]);

        //currentSessionDB to currentSessionHolder
        currentSessionHolder = getNewCurrentSessionData();
        currentSessionHolder.previouslySelectedSection = sectionedLayerIDToSectionElement(currentSessionDBActionables[0].currentSection.sectionedLayer);
        currentSessionHolder.startFrom = currentSessionDBValues["pk"];
        currentSessionHolder.activeSession = true;
        currentSessionHolder.totalTimeHolder = currentSessionDBActionables[currentSessionDBActionables.length-1].startFrom - currentSessionDBActionables[0].startFrom;

        //current actionable db to the currentActionableHolder
        const currentActionableFromDB = currentSessionDBActionables[currentSessionDBActionables.length - 1]
        currentActionableHolder = getNewCurrentActionable();
        currentActionableHolder.startFrom = currentActionableFromDB.startFrom;
        currentActionableHolder.currentSection = currentActionableFromDB.currentSection.sectionedLayer;
        currentActionableHolder.currentSession = currentActionableFromDB.currentSession;
        currentActionableHolder.detail = currentActionableFromDB.detail;
        currentActionableHolder.actionableName = currentActionableFromDB.name.name;
        currentActionableHolder.actionableColor = getActionableColor(currentActionableHolder.actionableName);
        currentActionableHolder.pk = currentActionableFromDB.id;

        //set the session to be spanSelected
        currentSessionHolder.previouslySelectedSection.classList.add("spanSelected");

        //start session and actionable and display them
        buttonEndingSession.classList.remove("sessionFadedButton");
        startActionable();
        //set the actionable button to be the selected one
        document.querySelector("#actionable_" + escapeSpaceWithBackslashes(currentActionableHolder.actionableName)).classList.add("actionableButtonSelected");

        //list of the actionables of the current session (excluding the current actionable)
        const actionablesContainer = document.getElementsByClassName("singleSessionActionablesContainer")[0];
        displaySingleSession(actionablesContainer, currentSessionDBActionables.slice(0, currentSessionDBActionables.length-1), 2)
    }
    else {//else there is no current session
        currentSessionHolder = getNewCurrentSessionData();
        currentActionableHolder = getNewCurrentActionable();
    }

    //get all archived sessions from the html JSON
    const archivedSessionsDiv = document.getElementById("archivedSessions");
    const sessionsList = JSON.parse(document.getElementById('allSessions').textContent);
    //iterate over each archived session
    for (const sessionActionables of sessionsList) {
        const session = JSON.parse(sessionActionables[0])[0];
        //for all archived sessions
        //elements for a single session
        const singleSessionDiv = document.createElement("div");
        singleSessionDiv.className = "singleSessionDiv";
        archivedSessionsDiv.appendChild(singleSessionDiv);

        const title = document.createElement("h4");
        const startFrom = session["pk"];
        const endTo = session["fields"].endTo;
        const totalTime = endTo - startFrom;
        title.style.display = "inline-block";
        title.textContent += "Session of " + epochMilliSecondsToDate(startFrom) + ": Starting from " + epochMilliSecondsToTime(startFrom) + " to " + epochMilliSecondsToTime(endTo) + ", for a total of " + totalSecondsToTime(Math.floor(totalTime / 1000));
        singleSessionDiv.appendChild(title);

        const barRef = document.createElement("div");
        barRef.className = "barClass";
        singleSessionDiv.appendChild(barRef);

        const minimizingArrow = document.createElement("button");
        minimizingArrow.textContent = "^";
        singleSessionDiv.appendChild(minimizingArrow);

        const actionablesContainer = document.createElement("div");
        actionablesContainer.className = "singleSessionActionablesContainer";
        singleSessionDiv.appendChild(actionablesContainer);

        //event listener to hide the actionables
        minimizingArrow.addEventListener("click", () => {
            actionablesContainer.style.display = actionablesContainer.style.display === "none" ? "block" : "none";
        });

        displaySingleSession(actionablesContainer, JSON.parse(sessionActionables[1]), 1)
    }
}, false);


//function that displays a single session and its actionable as per
//the arguments passed from the load event of the page
function displaySingleSession(actionablesContainer, currentActionables, caseValue) {
    //the list of all actionables of a single session
    for (const currentActionable of currentActionables) {
        //initialize an actionable object
        actionable = {
            pk: currentActionable["id"],
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

function getSectionIdThroughParent(span) {
    return span.parentElement.id;
}

function getCurrentSectionedLayerID() {
    let x = document.getElementsByClassName("spanSelected")[0];
    return x.parentNode.id.split("_")[1];
}

//pass a section id e.g. 1.1.1
//returns the element's layer_name
function sectionedLayerIDToSectionName(target) {
    return target+"_"+document.getElementById("sectionContainerInd_" + target).querySelector("span").textContent.trim();
}

//pass a section id e.g. 1.1.1
//returns the element
function sectionedLayerIDToSectionElement(target) {
    return document.getElementById("sectionContainerInd_" + target).querySelector("span");
}

function getListOfSections() {
    let t = Array.from(document.querySelectorAll(".sectionContainerInd"));
    let g = t.map(target => target.id.split("_")[1]+"_"+target.querySelector("span").textContent.trim());
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
    localStorage.clear();
    currentSessionHolder = getNewCurrentSessionData();
    currentActionableHolder = getNewCurrentActionable();
    location.reload()
})

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


//start and end is in epoch time
//userInput is in hh:mm:ss
//if the input is not in range, it returns false
//if it is in range, it will return a Date object of the userInput
function inputInRange(start, end, userInput) {
    //esnure that end > start
    if (start > end)
        return false;
    //get the date of the start and end
    const startDate = new Date(start);
    const endDate = new Date(end);
    //get time in hh:mm:ss
    const startTime = epochMilliSecondsToTime(start);
    const endTime = epochMilliSecondsToTime(end);
    

    //if the start and end are in the same day, just make sure that 
    //user input  is between these two values
    if (areDatesInSameDay(startDate, endDate)) {
        //console.log("they are on the same day")
        if (isTimeBetween_threeValues(startTime, endTime, userInput)) {
            return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), ...userInput.split(":"));
        }
        else {
            return false;
        }
    }
    else {//if they are not the same day
        //check if the userInput is between the startTime and 12am
        //or it is between 12am and endTime
        if (isTimeBetween_threeValues(startTime, "00:00:00", userInput)) {
            //console.log("user input is between start and 12 am");
            return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), ...userInput.split(":"));
        }
        else if (isTimeBetween_threeValues("00:00:00", endTime, userInput)) {
            //console.log("user input is between 12am and end");
            return new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), ...userInput.split(":"));
        }
        else {
            //console.log("user input is NOT between");
            return false;
        }
    }
}

//checks if the user input is between start and end time
function isTimeBetween_threeValues(startTime, endTime, userTime) {
    const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number);
    const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number);
    const [userHours, userMinutes, userSeconds] = userTime.split(':').map(Number);

    const startDate = new Date(0);
    startDate.setUTCHours(startHours);
    startDate.setUTCMinutes(startMinutes);
    startDate.setUTCSeconds(startSeconds);

    const endDate = new Date(0);
    endDate.setUTCHours(endHours);
    endDate.setUTCMinutes(endMinutes);
    endDate.setUTCSeconds(endSeconds);

    const userDate = new Date(0);
    userDate.setUTCHours(userHours);
    userDate.setUTCMinutes(userMinutes);
    userDate.setUTCSeconds(userSeconds);

    return userDate >= startDate && userDate <= endDate;
}

//takes two dates of type Date
//returns if they are in the same EXACT day or not
function areDatesInSameDay(date1, date2) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}





//below are test functions (not very good) for checking usertimeinput in range

//as per the function name
function getRandomDateWithin24Hours(inputDate) {
    const inputTime = inputDate.getTime();
    const maxOffset = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const randomOffset = random() * maxOffset;
    const randomTime = inputTime + randomOffset;
    return new Date(randomTime);
}

//takes a start and end Date object
//start must be less than end date
//the total duration between start and must be less than 24 hours
//returns a time between the start in the hh:mm:ss format
//does NOT work as intended
function getRandomInputInRange(start, end, isInRange) {
    const startTime = start.getTime();
    const endTime = end.getTime();

    let randomTime;
    if (isInRange) {
        randomTime = random() * Math.abs(endTime - startTime) + startTime;
        return new Date(randomTime).toTimeString().slice(0, 8);
    }
    else
        return getRandomInputInRange(end, start, true);
}

//takes a yyyy,mm,dd and generates random time
//returns a Date object
function getRandomDate(yyyy, mm, dd) {
    const randomHours = Math.floor(random() * 24);      // 0 to 23
    const randomMinutes = Math.floor(random() * 60);    // 0 to 59
    const randomSeconds = Math.floor(random() * 60);    // 0 to 59
    const randomTime = new Date(yyyy, mm - 1, dd, randomHours, randomMinutes, randomSeconds);
    return randomTime;
}

//get random int from 0 to max
function getRandomInt(max) {
    return Math.floor(random() * max);
}
//seeds the random number
// Takes any integer
let m_w = 123456789;
let m_z = 987654321;
const mask = 0xffffffff;
function seed(tmp) {
    const i = Date.now() + tmp
    m_w = (123456789 + i) & mask;
    m_z = (987654321 - i) & mask;
}
// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like Math.random().
function random() {
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
}



//generates startDate and endDate that may or may not be on the same day
//the startDate is always less than the endDate
//user input is randomly generated between them
//does NOT work as intended
function automatedTimeComparisonTesting() {
    //set the startDate
    const startDate = getRandomDate(2023, 6, 22);
    //seed the random
    seed(startDate.getHours());
    const endDate = getRandomDateWithin24Hours(startDate);

    //randomly generate user input
    let inRangeCheck = true;
    if (Date.now() % 2 === 0)
        inRangeCheck = false;

    const userInput = getRandomInputInRange(startDate, endDate, inRangeCheck);
    console.log(new Array(startDate, endDate, userInput));
    console.log("hours difference: " + (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
    console.log(inRangeCheck + " " + inputInRange(startDate, endDate, userInput));
}

//manuel values for time testing
//same day, between two values in the pm
const testTimeValues1 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 08, 23, 07, 00), "23:05:01"];
//same day, between two values in the am
const testTimeValues2 = [new Date(2023, 08, 08, 00, 59, 59), new Date(2023, 08, 08, 10, 01, 00), "07:00:00"];
//same day, not between them
const testTimeValues3 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 08, 23, 30, 00), "01:29:01"];
//not same day, between them in the pm
const testTimeValues4 = [new Date(2023, 08, 08, 23, 59, 59), new Date(2023, 08, 09, 00, 01, 00), "00:00:01"];
//not same day, between them in the am
const testTimeValues5 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 09, 5, 01, 00), "00:00:01"];
//not same day, between them on 12 am
const testTimeValues6 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 09, 17, 01, 00), "00:00:01"];
//not same day, between them on 12 am
const testTimeValues7 = [new Date(2023, 08, 08, 23, 00, 00), new Date(2023, 08, 09, 23, 01, 00), "00:00:00"];
//not same day, not between them
const testTimeValues8 = [new Date(2023, 08, 08, 23, 07, 00), new Date(2023, 08, 09, 23, 01, 00), "23:05:01"];

const arrayTester = [testTimeValues1, testTimeValues2, testTimeValues3, testTimeValues4, testTimeValues5, testTimeValues6, testTimeValues7, testTimeValues8]
const expectedValues = [true, true, false, true, true, true, true, false]

function testTimeComparison(arrayForTesting, expectedValuesOfArray) {
    arrayForTesting.forEach((dateArray, index) => {
        const t1 = new Date(dateArray[0]).getTime();
        const t2 = new Date(dateArray[1]).getTime();
        console.log(dateArray);
        console.log("Results: " + inputInRange(t1, t2, dateArray[2]));
        console.log("Expected results: " + expectedValuesOfArray[index]);
    });
}