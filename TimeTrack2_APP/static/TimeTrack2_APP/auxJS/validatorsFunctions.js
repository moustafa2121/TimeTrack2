
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
        if (isTimeBetween_threeValues(startTime, "23:59:59", userInput)) {
            //console.log("user input is between start and 12 am");
            return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), ...userInput.split(":"));
        }
        else if (isTimeBetween_threeValues("00:00:01", endTime, userInput)) {
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

//takes an element and message
//sets a message that will timeout after duration
function setInvalidityMessage(element, theMessage, duration = 1000) {
    element.setCustomValidity(theMessage);
    element.reportValidity();
    setTimeout(() => {
        element.setCustomValidity("");
    }, duration);
}

//used by actionable fields to validate their input
function validatorFunction() {
    return true;
}

//used by the time input field of actionables
//it makes sure that the time input (changed in actionable time)
//is valid and falls between the proper values
//first: check if the input is of pattern hh:mm:ss
//second: check if the input is between the proper range
//1- if it is startFrom, get next actionable sibling
//1a- startFrom = sibling.endTo > sibling.startFrom
//1b- if no next actionable sibling, dont change
//2- if it is endTo, get previous actionable sibling
//2a- endTo = sibling.startFrom < sibling.endTo
//2b- if the previous actionable is the current actionable, dont change
//input value is in "hh:mm:ss" format
function timeInputValidatorFunction(userInput) {
    //check if the input is of the pattern hh:mm:ss
    if (!this.checkValidity()) {//if invalid
        setInvalidityMessage(this, "Input must be of hh:mm:ss format");
        return false;
    }
    //check the input range
    if (this.name === "endTo") {
        //previous sibling is the one above it (i.e. the more recent one)
        const thePreviousActionable = this.parentNode.parentNode.previousElementSibling;
        if (thePreviousActionable) {
            //start and end of the previous actionable
            const thePreviousActionableStartFrom = thePreviousActionable.querySelector("input[name='startFrom']");
            const thePreviousActionableEndTo = thePreviousActionable.querySelector("input[name='endTo']");

            //the range that the input value must obey
            const thePreviousActionableEndToValue = thePreviousActionableEndTo.getAttribute("data-raw-value");
            const thisStartFrom = this.parentNode.querySelector("input[name='startFrom']").getAttribute("data-raw-value");

            //evaluate
            const evaluation = inputInRange(parseInt(thisStartFrom), parseInt(thePreviousActionableEndToValue), userInput);
            if (evaluation) {
                this.setAttribute("data-raw-value", evaluation.getTime());
                thePreviousActionableStartFrom.setAttribute("data-raw-value", evaluation.getTime());
                thePreviousActionableStartFrom.value = userInput;

                //update the total time
                const totalTime = this.parentNode.querySelector("span");
                updateTotalTime(totalTime, parseInt(thisStartFrom), evaluation.getTime());
                const previousElementTotalTime = thePreviousActionable.querySelector(".timeActionableDetail span");
                updateTotalTime(previousElementTotalTime, evaluation.getTime(), parseInt(thePreviousActionableEndToValue));

                //update the second actionable in the DB
                updateActionable(thePreviousActionableStartFrom);

                return true;
            }
            else {
                setInvalidityMessage(this, "input must be between the end of the previous actionable and the start of this actionable")
                return false;
            }
        }
        else {//the previous sibing is the current (running) actionable
            //endTo of the current actionable
            const thePreviousActionableEndToValue = Date.now();

            //the start of this element
            const thisStartFrom = this.parentNode.querySelector("input[name='startFrom']").getAttribute("data-raw-value");

            //change of this element's endTo must be between this's startFrom and the 
            //current actionable's end to
            const evaluation = inputInRange(parseInt(thisStartFrom), parseInt(thePreviousActionableEndToValue), userInput);

            //evaluate
            if (evaluation) {
                //change the output of this actionable
                this.setAttribute("data-raw-value", evaluation.getTime());
                const totalTime = this.parentNode.querySelector("span");
                updateTotalTime(totalTime, parseInt(thisStartFrom), evaluation.getTime());

                //change the output/startFrom of the current actionable
                currentActionableHolder().startFrom = evaluation.getTime();

                //update the current actionable in the DB
                const constObjSend = {
                    "pk": currentActionableHolder().pk,
                    "startFrom": currentActionableHolder().startFrom,
                };
                updateActionable(null, constObjSend);

                return true;
            }
            else {
                setInvalidityMessage(this, "input must be between the end of the previous actionable and the start of this actionable")
                return false;
            }
            return false;
        }
    }
    else if (this.name === "startFrom") {
        //the next sibling is the actionable below it (i.e. the less recent one)
        const theNextActionable = this.parentNode.parentNode.nextElementSibling;
        if (theNextActionable) {
            //start and end of the next actionable
            const theNextActionableEndTo = theNextActionable.querySelector("input[name='endTo']");
            const theNextActionableStartFrom = theNextActionable.querySelector("input[name='startFrom']");

            //the range that the input value must obey
            const theNextActionableStartFromValue = theNextActionableStartFrom.getAttribute("data-raw-value");
            const thisEndTo = this.parentNode.querySelector("input[name='endTo']").getAttribute("data-raw-value");

            //evaluate
            const evaluation = inputInRange(parseInt(theNextActionableStartFromValue), parseInt(thisEndTo), userInput);
            if (evaluation) {
                this.setAttribute("data-raw-value", evaluation.getTime());
                theNextActionableEndTo.setAttribute("data-raw-value", evaluation.getTime());
                theNextActionableEndTo.value = userInput;

                //update the total time
                const totalTime = this.parentNode.querySelector("span");
                updateTotalTime(totalTime, evaluation.getTime(), parseInt(thisEndTo));
                const nextElementTotalTime = theNextActionable.querySelector(".timeActionableDetail span");
                updateTotalTime(nextElementTotalTime, parseInt(theNextActionableStartFromValue), evaluation.getTime());

                //update the second actionable in the DB
                updateActionable(theNextActionableEndTo);

                return true;
            }
            else {
                setInvalidityMessage(this, "input must be between the start of the previous actionable and the end of this actionable")
                return false;
            }
        }
        else {
            //no actionables below to modify
            setInvalidityMessage(this, "cannot modify the start time of this actionable if it is the first one in the actionables", 1500);
            return false;
        }
    }
    return false;
}