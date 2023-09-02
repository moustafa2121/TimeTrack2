//starting and ending the actionable timer
const timerIntervalRef = (function () {
    let timerIntervalRef_;
    return function (reset = false, intervalSet=null) {
        if (reset)//start the timer
            timerIntervalRef_ = intervalSet;
        else//end it
            clearInterval(timerIntervalRef_);
    };
})();

//output of the total time of the current session
const totalSessionTimeOutput = (function () {
    const totalSessionTimeOutputRef = document.getElementById("totalSessionTimeOutput");
    totalSessionTimeOutputRef.textContent = totalSecondsToTime(0);
    return function (value) {
        totalSessionTimeOutputRef.textContent = value;
    };
})();

//on starting a session
//called on by the first actionable click
//return a promise so the caller waits for the session to be saved in the DB
//this is because so the followup actionable(s) have a sessionTime
//object in the DB to relate to
function startSession(){    
    //set the session to be active
    currentSessionHolder().startFrom = Date.now();

    //set up an interval that will auto end the session if exeeds the max time for session
    setInterval(() => {
        currentSessionHolder().sessionExpiredValue();
        buttonEndingSession().button.click();
    }, currentSessionHolder().sessionExpiredValue())

    //disabled the actionable buttons - until the session is finished saving
    enableActionableButtons(false);
    //save the new session and return a fetch
    return fetch("/update-session/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify(currentSessionHolder())
        })
        .then(response => response.json())
        .then(data => {
            enableActionableButtons(true);
            addFadingMessage(data.message);
            //after the session in the DB, activate the button ending session
            buttonEndingSession().on;
            document.querySelectorAll(".singleSessionDiv")[0].style.display = "block";
        })
        .catch(error => {
            addFadingMessage(error);
            enableActionableButtons(true);
        });
}

//ending session button
const buttonEndingSession = (function () {
    const buttonEndingSessionRef = document.getElementById("buttonEndSession");
    return function () {
        //define the listener for ending the session
        buttonEndingSessionRef.addEventListener("click", function () {
            //make sure the user wants to end the session
            if (currentSessionHolder().expiredSession !== 0 || confirm("Are you sure you want to end this session? Once ended you can no longer edit the actionables of that session.")) {
                //end the actionable
                endActionable();

                //update the session in the db
                //end the sessiona and reload the page
                endSession();
            }
        });
        return {
            button: buttonEndingSessionRef,
            off: buttonEndingSessionRef.classList.add("sessionFadedButton"),
            on: buttonEndingSessionRef.classList.remove("sessionFadedButton"),
        }
    };
})();

//saves the session when ending it
function endSession() {
    //disable actionables temorarily, wait for the session to save
    enableActionableButtons(false);
    if (currentSessionHolder().expiredSession === 0)
        currentSessionHolder().endTo = Date.now();
    else
        currentSessionHolder().endTo = currentSessionHolder().expiredSession;

    fetch("/update-session/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify(currentSessionHolder())
    })
    .then(response => response.json())
    .then(data => {
        //switch the fading effect of the start/end button
        buttonEndingSession().off;

        //reload the page so the previous session is placed within the archived ones in the homepage
        location.reload();
        addFadingMessage(data.message);
        enableActionableButtons(true);

    })
    .catch(error => {
        location.reload();
        addFadingMessage(error);
        enableActionableButtons(true);
    });                
}


//display the actionables
//assign the event listners for each button
//called on when the page loads
function loadActionables(){
    for (const actionableButton of actionableButtons()) {
        //styling
        actionableButton.addEventListener("mouseover", function () {
            if (!this.classList.contains("actionableButtonSelected")) {
                this.style.backgroundColor = this.style.color;
                this.style.color = "white";
            }
        });
        actionableButton.addEventListener("mouseout", function () {
            if (!this.classList.contains("actionableButtonSelected")) {
                this.style.color = this.style.backgroundColor;
                this.style.backgroundColor = "transparent";
            }
        });

        //listener when an actionable is clicked
        actionableButton.addEventListener("click", async function () {
            if (!currentlySelectedSection().sectionElement) {//select a section
                alert("You need to select a section");
                return;
            }

            //start a session
            //a promise to wait for a session to be saved
            if (!currentSessionHolder().isActiveSession())
                await startSession();

            //end the previous actionable if there was one
            if (currentActionableHolder().startFrom !== undefined)
                endActionable();

            //actionable selected class
            toggleActionablButtonSelected(this, true);

            //start a new actionable
            currentActionableHolder(true, [
                Date.now(),
                actionableButton.textContent,
                actionableButton.style.backgroundColor,
                currentlySelectedSection().sectionLayer,
                currentSessionHolder().startFrom,
            ]);

            //add it to the DB. this function will add the pk
            //from DB to the currentActionableHolder
            //await for it to assign the pk from DB
            await addActionable(currentActionableHolder());
            //start the timer 
            startActionable();
        })
    }
}

//starts the life-cycle of the actionable
function startActionable() {    
    //display the  currentactionable and its data under the currentActionableDi
    //and remove the old one
    displayCurrentActionable();

    //begin the interval of the actionable that triggers every 1 second
    timerIntervalRef(true, setInterval(() => {
        const delta = Date.now() - currentActionableHolder().startFrom;
        currentActionableOutput.textContent = totalSecondsToTime(Math.floor(delta / 1000));
        totalSessionTimeOutput(totalSecondsToTime(Math.floor((Date.now() - currentSessionHolder().startFrom) / 1000)));
        //change the tab title
        document.title = currentActionableHolder().actionableName + " : " + currentActionableOutput.textContent;
    }, 1000));
}

//ends the life-cycle of the actionable
function endActionable() {
    //remove the selected actionable class from the previous actionable
    if (document.querySelector(".actionableButtonSelected"))
        toggleActionablButtonSelected(document.querySelector(".actionableButtonSelected"), false);

    //update the current actionable with the final data
    //if the session is expired, get the auto endTo value which is
    //the end point of the remaining time of the session
    if (currentSessionHolder().expiredSession === 0) 
        currentActionableHolder().endTo = Date.now();
    else
        currentActionableHolder().endTo = currentSessionHolder().expiredSession;
    currentActionableHolder().detail = document.querySelector("#currentActionableDiv .singleActionableDetails").value;

    //display the current actionable in the current session actionables
    displayActionable(currentActionableHolder(), document.querySelector(".singleSessionActionablesContainer"), 2);

    //get the endTo for the current actionable we just displayed
    const currentActionableEndTo = document.querySelectorAll(`[id="${currentActionableHolder().pk}"].singleActionableDiv .timeActionableDetail input`)[1];
    //send the endTo element to the update method
    //no need to preUpdateActionable method since the endTo value
    //here is not required to be validated
    //this will update the actionable's endTo in the databse
    updateActionable(currentActionableEndTo);

    //clear the interval of the actionable
    timerIntervalRef(false);
    currentActionableOutput.textContent = totalSecondsToTime(0);
}

//displays the current running actionable under the currentActionableDiv
function displayCurrentActionable() {
    //remove the previous currentActionable display
    const parentObject = document.getElementById("currentActionableDiv");
    if (parentObject.querySelector(".singleActionableDiv")) 
        parentObject.querySelector(".singleActionableDiv").remove()

    //display the bar ruler if it is not already displayed
    if (!parentObject.parentElement.querySelector(".barClass").firstChild)
        displayBarRuler(parentObject.parentElement);

    //modify the favicon    
    const faviconLink = document.querySelector("link[rel~='icon']");
    //faviconLink.href = faviconLink.href.replace(/\/[^/]+\.ico$/, `/${currentActionableHolder().actionableColor}.ico`)

    //singleActionableDiv
    const singleActionableDiv = document.createElement("div");
    singleActionableDiv.classList.add("singleActionableDiv");
    singleActionableDiv.id = currentActionableHolder().pk;
    parentObject.appendChild(singleActionableDiv);

    //display the color square, the actionable name, the section, and the details
    displayActionable_firstPart(currentActionableHolder(), singleActionableDiv, 4);

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
    actionableColor.classList.add("singleActionableColor");
    parentObject.appendChild(actionableColor);
    
    //the actionable name and section can be changed
    if (caseValue == 2 || caseValue == 3) {//a selectable
        //populate the actionable name
        initializeSelect("singleActionableSelect", parentObject, getListOfActionablesNames(),
                        passedActionable.actionableName, "name", validatorFunction);
        //populate the section
        initializeSelect("singleSectionSelect", parentObject, getListOfSections(),
                        sectionedLayerIDToSectionName(passedActionable.currentSection),
                        "currentSection", validatorFunction);
    }
    else {//1 or 4
        const actionableName = document.createElement("span");
        actionableName.classList.add("singleActionableName");
        actionableName.textContent = passedActionable.actionableName;
        actionableName.title = passedActionable.actionableName;
        parentObject.appendChild(actionableName);

        //section
        const sectionName = document.createElement("span");
        sectionName.textContent = sectionedLayerIDToSectionName(passedActionable.currentSection);
        sectionName.title = sectionedLayerIDToSectionName(passedActionable.currentSection);
        sectionName.classList.add("singleActionableSection");
        parentObject.appendChild(sectionName);
    }

    //details
    let details;
    if (caseValue != 1 ) {
        details = document.createElement("input");
        details.placeholder = "Actionable Details";
        details.type = "text";
        details.maxLength = 250;
        details.name = "detail";
        details.oldValue = details.value;
        details.validator = validatorFunction.bind(details);
        details.value = passedActionable.detail;

        //add an event listener
        details.addEventListener("change", preUpdateActionable, false);
    }
    else 
        details = document.createElement("span");
        details.textContent = passedActionable.detail;

    details.classList.add("singleActionableDetails");
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
    singleActionableDiv.classList.add("singleActionableDiv");
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
    timeSpan.classList.add("timeActionableDetail");
    singleActionableDiv.appendChild(timeSpan);

    //startFrom value
    initializeActionableTimeField(timeSpan, "startFrom", passedActionable.startFrom, caseValue);
    //set between the startFrom and endTo
    const dividerText = document.createTextNode("-");
    timeSpan.appendChild(dividerText);
    //endTo value
    initializeActionableTimeField(timeSpan, "endTo", passedActionable.endTo, caseValue);

    //total time display
    const totalTime = document.createElement("span");
    totalTime.textContent = "T: " + totalSecondsToTime(Math.floor((passedActionable.endTo - passedActionable.startFrom) / 1000));
    timeSpan.appendChild(totalTime);

    //if the actionable is not part of an archived session
    if (caseValue != 1) {
        //option to delete an actionable. only active for the most 
        //recent actionable in the current active session
        const actionableDeleteButton = document.createElement("button");
        actionableDeleteButton.classList.add("actionableDeleteButton");
        actionableDeleteButton.classList.add("btn");
        actionableDeleteButton.classList.add("btn-outline-dark");
        timeSpan.appendChild(actionableDeleteButton);
        actionableDeleteButton.appendChild(actionableTrashIcon());

        //if there is a second child to the parent, then
        //make sure only the most recent actionable can be deleted
        enableDeleteButton(parentObject, true);

        //add an event listener for the delete button
        actionableDeleteButton.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete this actionable?")) {
                //delete the object from the DB
                fetch("/delete-actionable/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
                    },
                    body: JSON.stringify({ "pk": passedActionable.pk })
                    })
                    .then(response => response.json())
                    .then(data => {
                        //if sucessfully deleted
                        addFadingMessage(data.message);

                        //add the total epochs of this actionable to the current actionable
                        const startFrom = timeSpan.querySelectorAll("input")[0].getAttribute("data-raw-value");
                        const endTo = timeSpan.querySelectorAll("input")[1].getAttribute("data-raw-value");
                        const totalEpochs = endTo - startFrom;
                        currentActionableHolder().startFrom = currentActionableHolder().startFrom - totalEpochs;

                        //update the current actionable in the DB
                        const constObjSend = {
                            "pk": currentActionableHolder().pk,
                            "startFrom": currentActionableHolder().startFrom,
                        };
                        updateActionable(null, constObjSend);

                        //enable the button for the below actionable, if any
                        enableDeleteButton(parentObject, false);

                        //remove the actionable from the page
                        parentObject.querySelectorAll(".singleActionableDiv")[0].remove();

                        //remove the display subbar
                        document.getElementById(`subBar_${passedActionable.pk}`).remove();
                    })
                    .catch(error => {
                        addFadingMessage(error);
                    });
            }
        });
    }
}

//displays the subBar of the actionable on the progress bar of the session
//also sets up the hovering effect on the subBar
//the divider is currently just for testing (its in hours)
function displayBar(barRef, passedActionable, divider = constantValues().displayBarMaxValue) {
    //handles the graphics of the subBar
    const rect = displayBar_aux(barRef, passedActionable, divider)

    //the parent container of a single session
    const parentSessionsContainer = rect.closest(".singleSessionDiv").querySelector(".singleSessionActionablesContainer");

    //the hover effect: dispalys the total of each actionable
    rect.addEventListener("mouseenter", (event) => {
        rect.setAttribute("style", `fill: ${passedActionable.actionableColor}; stroke-width:1; stroke:rgb(0,0,0)`);
        const x = event.clientX;
        const y = rect.getBoundingClientRect();
        const barOverlay = document.getElementById("barOverlay");

        barOverlay.style.left = `${x}px`;
        barOverlay.style.top = (y.top - 170)+"px";
        barOverlay.classList.add('active');

        //zoom in the actionable
        parentSessionsContainer.querySelector(`[id="${passedActionable.pk}"`).classList.add("zoomEffect");

        //remove the previous children
        while (barOverlay.firstChild)
            barOverlay.removeChild(barOverlay.firstChild);

        //total time of each actionable
        const totalTimeActionablesHolder = getNewTotalTimeActionablesHolder();

        //add up the total time of each actionable
        //check if the this session has a current actionable
        const currentActionableCheck = parentSessionsContainer.parentElement.querySelector("#currentActionableDiv");
        if (currentActionableCheck) {
            const actionableName = currentActionableCheck.querySelector(".singleActionableName").textContent;
            totalTimeActionablesHolder[actionableName] = addTimeStrings(totalTimeActionablesHolder[actionableName], document.querySelector("#currentActionableOutput").textContent);
        }
        //all the remaining actionables
        for (const actionableDiv of parentSessionsContainer.querySelectorAll(".singleActionableDiv")) {
            const actionableNameEle = actionableDiv.querySelector(":is(.singleActionableName, .singleActionableSelect)")
            let actionableName = "";
            if (actionableNameEle.tagName === "SPAN")
                actionableName = actionableNameEle.textContent;
            else 
                actionableName = actionableNameEle.options[actionableNameEle.selectedIndex].text;

            const actionableTotalTime = Array.from(actionableDiv.querySelector(".timeActionableDetail").querySelectorAll("span")).at(-1).textContent;
            totalTimeActionablesHolder[actionableName] = addTimeStrings(totalTimeActionablesHolder[actionableName], actionableTotalTime);
        }

        //display title for the barOverlay
        const totalTextNode = document.createElement("div");
        totalTextNode.classList.add("title");
        totalTextNode.textContent = "Total per Actionable"
        barOverlay.appendChild(totalTextNode);

        //populate the barOverLay
        for (const [key, value] of Object.entries(totalTimeActionablesHolder)) {
            const actionableValue = document.createElement("div");
            actionableValue.classList.add("subElement");
            actionableValue.textContent = value;
            actionableValue.setAttribute("colorvalue", getActionableColor(key))
            barOverlay.appendChild(actionableValue);
        }
    });

    //remove the zoom effect
    rect.addEventListener("mouseleave", () => {
        rect.setAttribute("style", `fill:${passedActionable.actionableColor}`);
        barOverlay.classList.remove('active');
        parentSessionsContainer.querySelector(".zoomEffect").classList.remove("zoomEffect");;
    });
}

//handles the display of the subBar's graphics
function displayBar_aux(parentBar, passedActionable, divider) {
    const currentSecondsAsPercentage = Math.ceil((passedActionable.endTo - passedActionable.startFrom) / 1000) * 100;
    const width = currentSecondsAsPercentage / (divider * 3600);

    //subBar element
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", `${width}%`);
    rect.setAttribute("height", "16px");
    rect.setAttribute("style", `fill:${passedActionable.actionableColor}`);
    rect.classList.add("subBarClass");
    rect.id = "subBar_" + passedActionable.pk;

    //set the starting point from the last sibling
    const barRefLastChild = Array.from(parentBar.querySelectorAll(".subBarClass")).at(-1);
    if (barRefLastChild) {
        const w1 = parseFloat(barRefLastChild.getAttribute('x'));
        const w2 = parseFloat(barRefLastChild.getAttribute('width'));
        const startingX = w1 + w2;
        rect.setAttribute("x", startingX + "%");
    }
    else
        rect.setAttribute("x", 0);
    parentBar.appendChild(rect);

    return rect;
}

//when a subbar is deleted or changed in length (in case endTo/startFrom changes)
//this functions redraws it and all its succeeding siblings
//the subBar must already exist
function displayBar_update(updatedActionableEle, divider=constantValues().displayBarMaxValue) {
    //the changes in the passed actionable
    const startFrom = parseInt(updatedActionableEle.querySelectorAll(".timeActionableDetail input[data-raw-value]")[0].getAttribute("data-raw-value"));
    const endTo = parseInt(updatedActionableEle.querySelectorAll(".timeActionableDetail input")[1].getAttribute("data-raw-value"));

    //reference to the subbbar of the passed actionable
    let currentSubbar = document.querySelector(`[id='subBar_${updatedActionableEle.closest(".singleActionableDiv").id}']`);

    //calculate the new width
    const currentSecondsAsPercentage = Math.ceil((endTo - startFrom) / 1000) * 100;
    const width = currentSecondsAsPercentage / (divider * 3600);
    currentSubbar.setAttribute("width", `${width}%`);

    //set the new color
    currentSubbar.setAttribute("style", `fill:${updatedActionableEle.querySelector(".singleActionableColor").style.backgroundColor}`);

    ////change the next siblings's starting point
    while (currentSubbar.nextSibling) {
        const previousSibling = currentSubbar;
        currentSubbar = currentSubbar.nextSibling;

        const w1 = parseFloat(previousSibling.getAttribute('x'));
        const w2 = parseFloat(previousSibling.getAttribute('width'));
        currentSubbar.setAttribute("x", (w1 + w2) + "%");
    }
}


//pre-processing for the function updateActionable
//responsible for validating input and changing values in the field
//if it is validated by other functions.
//called only by the actionables of the current session (but not the currentActionable)
function preUpdateActionable(event) {
    const currentTarget = event.currentTarget;
    //first: input checks
    if (currentTarget.readOnly)//if it is not editable, return
        return;
    
    //get the new value (the user input)
    const newValue = currentTarget.value.trim();

    //check validity of the input
    if (currentTarget.validator(newValue)) {//validate
        currentTarget.oldValue = newValue;//assign the old value to the new value
    }
    else {//if invalid
        //change the current value to the old value since the
        //former is invalid
        currentTarget.value = currentTarget.oldValue;
        return;
    }

    //change the color of the square if the actionable name changed
    if (currentTarget.name == "name") {
        currentTarget.previousSibling.style.backgroundColor = getActionableColor(newValue);
        displayBar_update(currentTarget.closest(".singleActionableDiv"));
    }

    //second:go to the DB
    updateActionable(currentTarget);
}

//called on when the actionable is ready to be updated in the DB
//in all cases the 'target' passed is the field that is being changed of the actionable
//however, only in the case of the current actionable when changing the endTo values
//of the actioanble below it, we opt instead to send target=null and populate the
//constObjSend from the calling function
function updateActionable(target, constObjSend={}) {
    //if the target is not null then use it to get the values to send
    //otherwise the constObjSend is already populated by the calling function
    if (target) {
        constObjSend["pk"] = target.closest(".singleActionableDiv").id;
        if (target.name == "startFrom" || target.name == "endTo")
            constObjSend[target.name] = target.getAttribute("data-raw-value");
        else
            constObjSend[target.name] = target.value;
    }
    //send to the DB
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

//sends a new actionable to the DB using fetchAPI, when resolved
//it will give the passedActionable id (from the DB)
function addActionable(passedActionable) {
    return fetch("/add-actionable/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify(passedActionable)
    })
    .then(response => response.json())
    .then(data => {
        addFadingMessage(data.message);
        passedActionable.pk = data["pk"];//set the id
    })
    .catch(error => {
        addFadingMessage(error);
    });
}

//inititalize a select, used to set up a modifiable actionable name and its section in
//the actionable list of the current session
//also attaches a listener to the select
function initializeSelect(selectClassName, parentObject, listOfOptions,
    selectedOption, selectName, passedValidatorFunction) {
    const currentSelect = document.createElement("select");
    currentSelect.classList.add(selectClassName);
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
    currentSelect.addEventListener("change", preUpdateActionable, false);
    currentSelect.name = selectName;
    currentSelect.validator = passedValidatorFunction.bind(currentSelect);
    return currentSelect;
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
        //listener
        timeSpanField.oldValue = timeSpanField.value;
        timeSpanField.addEventListener("change", preUpdateActionable, false);
        timeSpanField.validator = timeInputValidatorFunction.bind(timeSpanField);
    }
    else {
        timeSpanField = document.createElement("span");
        timeSpanField.textContent = epochMilliSecondsToTime(value);
    }

    timeSpanField.name = fieldName;
    timeSpanField.dataset.rawValue = value;
    parentObject.appendChild(timeSpanField);
}