//on opening the page
//attempts to load any data from the DB
//if available it will display them
//Also responsible for handling the archived sessions and displaying them
window.addEventListener("load", () => {
    //load all the sections in the left panel
    loadLeftNavPanel();

    //start a new session and actionable holders
    currentSessionHolder(true);
    currentActionableHolder = getNewCurrentActionable();
    //get current archived session from the html JSON
    const currentSessionDB = JSON.parse(document.getElementById('currentSessionDB').textContent);
    //if the length is not 0, there is a current session form the DB
    if (currentSessionDB.length !== 0) {
        //get the data from the json
        currentSessionDBValues = JSON.parse(currentSessionDB[0])[0];
        currentSessionDBActionables = JSON.parse(currentSessionDB[1]);

        //currentSessionDB to currentSessionHolder
        currentSessionHolder().startFrom = currentSessionDBValues["pk"];

        //set the current section
        currentlySelectedSection(currentSessionDBActionables[currentSessionDBActionables.length - 1].currentSection.sectionedLayer);

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


        //start session and actionable and display them
        buttonEndingSession.classList.remove("sessionFadedButton");
        startActionable();
        //set the actionable button to be the selected one
        document.querySelector("#actionable_" + escapeSpaceWithBackslashes(currentActionableHolder.actionableName)).classList.add("actionableButtonSelected");

        //list of the actionables of the current session (excluding the current actionable)
        const actionablesContainer = document.getElementsByClassName("singleSessionActionablesContainer")[0];
        displaySingleSession(actionablesContainer, currentSessionDBActionables.slice(0, currentSessionDBActionables.length - 1), 2)
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

        //the parent bar of the subBars
        const barRef = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        barRef.classList.add("barClass");
        singleSessionDiv.appendChild(barRef)

        const minimizingArrow = document.createElement("button");
        minimizingArrow.textContent = "^";
        singleSessionDiv.appendChild(minimizingArrow);

        //ruler for the bar
        displayBarRuler(singleSessionDiv);

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

//passedMaxValue is used to dynamically change for the current session
function displayBarRuler(singleSessionDiv, passedMaxValue = constantValues().displayBarMaxValue) {
    const barRuler = document.createElement("div");
    const bar = singleSessionDiv.querySelector(".barClass");
    barRuler.className = "barRuler";
    singleSessionDiv.insertBefore(barRuler, bar.nextElementSibling);
    for (let i = 0; i < 5; i++) {
        const rulerLabel = document.createElement("div");
        rulerLabel.className = "barRulerLabel";
        const position = (i / 4) * 100;
        rulerLabel.textContent = Math.round((position / 100) * passedMaxValue);
        barRuler.appendChild(rulerLabel);
    }
}