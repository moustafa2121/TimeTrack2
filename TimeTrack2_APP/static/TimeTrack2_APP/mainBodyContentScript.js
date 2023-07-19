const Status = { NotReady: "NotReady", Stop: "Stop", Running: "Running"}

const secondsInHour = 86400;

//timer stuff
let currentStatus = Status.NotReady;
let setIntervalRef;
let delta;

//timer output
let outputObject = document.getElementById("outputObject");

//the log for the timer
let timerLog = document.getElementById("timerLog");
let barRef = document.createElement("div");
barRef.className = "barClass";
timerLog.appendChild(barRef);
let currentLogObject;

//listner for the buttons
let actionableButtons = document.getElementsByClassName("actionableButton");
let previouslySelectedActionableButton;
for (i of actionableButtons) {
    i.addEventListener("click", function () {
        if (!previouslySelectedSection) {
            alert("You need to select the current Section");
            return;
        }
        if (previouslySelectedActionableButton != this) {//if a different button is clicked
            this.id = "actionableButtonSelected";
            if (previouslySelectedActionableButton)//for a first call??
                previouslySelectedActionableButton.id = "";
            previouslySelectedActionableButton = this;

            //start the timer
            startWrapper();
        }
    })
}

function startWrapper() {
    if (currentStatus == Status.NotReady) {
        if (!previouslySelectedSection) {//this shouldn't be reached anyways
            alert("You need to select the current Section, this shouldn't be reached anyways");
            return;
        }
        else {
            currentStatus = Status.Stop;
        }
    }
    if (currentStatus == Status.Stop) {//happens when just starting a session
        start(Date.now());
    }
    else if (currentStatus == Status.Running){//happens when switching actionables
        currentLogObject.to = Date.now();
        saveActionable(currentLogObject);
        outputBar(currentLogObject);
        clearInterval(setIntervalRef);
        outputObject.textContent = formatTime(0);

        //start timer again
        start(Date.now());
    }
}

function start(startValue) {
    setIntervalRef = setInterval(function theIntervalFunction() {
        delta = Date.now() - startValue;
        outputObject.textContent = formatTime(Math.floor(delta / 1000));
    }, 1000);
    currentStatus = Status.Running;
    currentLogObject = {
        actionable: previouslySelectedActionableButton.textContent,
        color: previouslySelectedActionableButton.style.backgroundColor,
        from: Date.now(),
    };
}

//returns a new actionable to the DB using fetchAPI
function saveActionable(passedLogObject) {
    fetch("/add-actionable/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('input[name="csrfmiddlewaretoken"]').value
        },
        body: JSON.stringify({ "passedLogObject": passedLogObject })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById("responseMessage").textContent = data.message;
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

//draws the subbar of a single actionable
function outputBar(obj) {
    subBar = document.createElement("span");
    subBar.style.display = "inline-block";
    subBar.style.backgroundColor = obj.color;
    let currentSeconds = (obj.to - obj.from) / 1000;
    currentSeconds += 3600;
    let width = ((currentSeconds/secondsInHour) * 100)+"%";
    subBar.style.width = width;

    subBar.className = "subBarClass"
    barRef.appendChild(subBar);
}


//takes epoch
//returns a string object of the date and time
function epochToSpecificTimezone(timeEpoch, offset=0) {
    var d = new Date(timeEpoch);
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);  //This converts to UTC 00:00
    var nd = new Date(utc + (3600000 * offset));
    return nd.toLocaleString();
}

//takes seconds
//returns hh:mm
function secondsToTime(epoch) {
    t = new Date(epoch);
    return ("0" + t.getHours()).slice(-2) + ":" + ("0" + t.getMinutes()).slice(-2);
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