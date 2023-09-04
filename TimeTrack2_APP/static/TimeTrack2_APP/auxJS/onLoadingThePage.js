//on opening the page
//attempts to load any data from the DB
//if available it will display them
//Also responsible for handling the archived sessions and displaying them
window.addEventListener("load", (event) => {
    //load all the sections in the left panel
    loadLeftNavPanel();

    //load the actionables buttons and their events
    loadActionables();

    //load current session and current actionable
    loadCurrentSession();

    //load archived sessions
    loadArchivedSessions();
}, false);

//load current session and current actionable
function loadCurrentSession() {
    //get current archived session from the html JSON
    const currentSessionDB = JSON.parse(document.getElementById('currentSessionDB').textContent);
    //if the length is not 0, there is a current session form the DB
    if (currentSessionDB.length !== 0) {
        //set the first block to be visible
        document.querySelectorAll(".singleSessionDiv")[0].style.display = "block";

        //get the data from the json
        currentSessionDBValues = JSON.parse(currentSessionDB[0])[0];
        currentSessionDBActionables = JSON.parse(currentSessionDB[1]);

        //currentSessionDB to currentSessionHolder
        currentSessionHolder(true).startFrom = currentSessionDBValues["pk"];

        //set the current section
        currentlySelectedSection(currentSessionDBActionables[currentSessionDBActionables.length - 1].currentSection.sectionedLayer);

        //current actionable db to the currentActionableHolder
        const currentActionableFromDB = currentSessionDBActionables[currentSessionDBActionables.length - 1]
        currentActionableHolder(true, [
            currentActionableFromDB.startFrom,
            currentActionableFromDB.name.name,
            getActionableColor(currentActionableFromDB.name.name),
            currentActionableFromDB.currentSection.sectionedLayer,
            currentActionableFromDB.currentSession,
        ]);
        currentActionableHolder().detail = currentActionableFromDB.detail;
        currentActionableHolder().pk = currentActionableFromDB.id;


        //start session and actionable and display them
        buttonEndingSession().on;
        startActionable();
        //set the actionable button to be the selected one
        toggleActionablButtonSelected(document.querySelector("#actionable_" + escapeSpaceWithBackslashes(currentActionableHolder().actionableName)), true);

        //list of the actionables of the current session (excluding the current actionable)
        const actionablesContainer = document.getElementsByClassName("singleSessionActionablesContainer")[0];
        displaySingleSession(actionablesContainer, currentSessionDBActionables.slice(0, currentSessionDBActionables.length - 1), 2)


        //add the minimizing arrow
        const tmp = document.querySelectorAll(".singleSessionDiv")[0].querySelector(".singleSessionActionablesContainer")
        tmp.id = currentSessionHolder().startFrom;
        document.querySelectorAll(".singleSessionDiv")[0].insertBefore(createMinimizingArrow(currentSessionHolder().startFrom), tmp);
        
        //check if the session has expired
        //if it did, then end the session
        //the endTo value of both the session and the currentActionable
        //will be set at the end of the remainingtime
        const sessionExpireValue = currentSessionHolder().sessionExpiredValue();
        if (sessionExpireValue === -1) //end the session
            buttonEndingSession().button.click();
        else {
            //if not expired, set an interval that will trigger at the end of the
            //remaining time, and it will automatically end the session
            setInterval(() => {
                currentSessionHolder().sessionExpiredValue();
                buttonEndingSession().button.click();
            }, sessionExpireValue)
        }
    }
}

//load the most recent archived sessions
function loadArchivedSessions() {
    //get all archived sessions from the html JSON
    const archivedSessionsDiv = document.getElementById("archivedSessions");
    const sessionsList = JSON.parse(document.getElementById('allSessions').textContent);
    //iterate over each archived session
    for (const sessionActionables of sessionsList) {
        const givenSession = JSON.parse(sessionActionables[0])[0];
        //for all archived sessions
        //elements for a single session
        const singleSessionDiv = document.createElement("div");
        singleSessionDiv.classList.add("singleSessionDiv");
        singleSessionDiv.classList.add("rounded");
        singleSessionDiv.classList.add("shadow-sm");
        archivedSessionsDiv.appendChild(singleSessionDiv);

        //set the title of the session
        const titleDiv = document.createElement("div")
        titleDiv.style.borderBottom = "1px black solid"
        titleDiv.style.paddingBottom = "0px"
        singleSessionDiv.appendChild(titleDiv);
        setSessionTitle(givenSession, titleDiv);

        //the parent bar of the subBars
        const barParent = document.createElement("div");
        barParent.style.position = "relative";
        singleSessionDiv.appendChild(barParent);
        const barRef = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        barRef.classList.add("barClass");
        barParent.appendChild(barRef)

        //ruler for the bar
        displayBarRuler(singleSessionDiv, 0, 24);

        //minimizing arrow
        singleSessionDiv.appendChild(createMinimizingArrow(`${givenSession["pk"]}`));

        //the container for all the actionables
        const actionablesContainer = document.createElement("div");
        actionablesContainer.className = "singleSessionActionablesContainer";
        actionablesContainer.id = givenSession["pk"];
        actionablesContainer.classList.add("show");
        singleSessionDiv.appendChild(actionablesContainer);

        displaySingleSession(actionablesContainer, JSON.parse(sessionActionables[1]), 1);
    }
}

function createMinimizingArrow(givenSessionKey) {
    const minimizingArrow = document.createElement("button");
    minimizingArrow.classList.add("minimizeActionablesButton");
    minimizingArrow.classList.add("btn");
    minimizingArrow.classList.add("btn-outline-dark");
    minimizingArrow.setAttribute("data-bs-toggle", "collapse");
    minimizingArrow.setAttribute("data-bs-target", `#${givenSessionKey}`);
    minimizingArrow.appendChild(minimizingArrowIcon(true));
    //event listener to hide the actionables
    minimizingArrow.addEventListener("click", () => {
        toggleMinimizingArrowIcon(minimizingArrow);
    });
    return minimizingArrow;
}

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

//passedMaxValue is used to dynamically change for the current session
//function displayBarRuler(singleSessionDiv, passedMaxValue = constantValues().displayBarMaxValue) {
//    const barRuler = document.createElement("div");
//    const bar = singleSessionDiv.querySelector(".barClass");
//    barRuler.className = "barRuler";
//    singleSessionDiv.insertBefore(barRuler, bar.nextElementSibling);
//    for (let i = 0; i < 5; i++) {
//        const rulerLabel = document.createElement("div");
//        rulerLabel.className = "barRulerLabel";
//        const position = (i / 4) * 100;
//        rulerLabel.textContent = Math.round((position / 100) * passedMaxValue);
//        barRuler.appendChild(rulerLabel);
//    }
//}

function displayBarRuler(singleSessionDiv, min=0, max=6) {
    const rulerContainer = document.createElement('div');
    rulerContainer.classList.add("ruler");
    singleSessionDiv.insertBefore(rulerContainer, singleSessionDiv.querySelector(".singleSessionActionablesContainer"));

    // Create 5 points and labels on the ruler
    const tread = (max - min) / 6;
    for (let i = min; i <= max; i++) {
        const left = ((i - 1) * 20);

        // Create ruler point
        const point = document.createElement('div');
        point.className = 'ruler-point';
        if (i === max)
            point.style.left = left - 0.1 + "%";
        else
            point.style.left = left + "%";

        rulerContainer.appendChild(point);

        // Create ruler label
        const label = document.createElement('div');
        label.className = 'ruler-label';
        label.style.left = left-0.2+"%";
        label.innerText = i;
        rulerContainer.appendChild(label);
    }
}

function divideTimeRange(minTime, maxTime) {
    // Parse the minimum and maximum times
    const minParts = minTime.split(':');
    const maxParts = maxTime.split(':');

    const minHours = parseInt(minParts[0]);
    const minMinutes = parseInt(minParts[1]);
    const maxHours = parseInt(maxParts[0]);
    const maxMinutes = parseInt(maxParts[1]);

    // Calculate the time intervals
    const timeIntervals = [];

    // Calculate the step size
    const totalMinutes = (maxHours * 60 + maxMinutes) - (minHours * 60 + minMinutes);
    const stepSize = totalMinutes / 4;

    // Generate the time intervals
    for (let i = 0; i < 5; i++) {
        const totalMinutesInInterval = minMinutes + i * stepSize;
        const hoursInInterval = Math.floor(totalMinutesInInterval / 60);
        const minutesInInterval = totalMinutesInInterval % 60;
        const formattedTime = `${String(hoursInInterval).padStart(2, '0')}:${String(minutesInInterval).padStart(2, '0')}`;
        timeIntervals.push(formattedTime);
    }

    return [minTime, ...timeIntervals, maxTime];
}
