//classes that hold the current session and the current actionable

//a class that holds values for the current session
class CurrentSessionHolder {
    constructor() {}

    //setters and getters for the endTo
    get endTo() {
        return this._endTo;
    }
    set endTo(value) {
        if (this.isActiveSession())
            this._endTo = value;
        else
            console.log("session hasn't started yet, cannot end");
    }

    //setters and getters for the startFrom
    get startFrom() {
        return this._startFrom;
    }
    set startFrom(value) {
        if (this._startFrom === undefined)
            this._startFrom = value;
        else if (!this.isActiveSession() && this._endTo !== undefined)
            console.log("session has already ended, start a new one");
    }

    //returns if the session is currently active or not
    isActiveSession() {
        const evalu = XOR(this._startFrom, this._endTo);
        return (evalu !== undefined) ? evalu : false;
    }
    toJSON() {
        return {
            startFrom: this._startFrom,
            endTo: (this._endTo === undefined) ? 0 : this._endTo,
        }
    }
}

//closure for the CurrentSessionHolder class
const currentSessionHolder = (function () {
    let tmp = new CurrentSessionHolder();
    return function (newSession = false) {
        if (newSession && !tmp.isActiveSession())
            tmp = new CurrentSessionHolder();
        return tmp;
    };
})();


//holds the current actionables and the current session data in local stroage
//as persistant data to be used when refreshing/reloading the page
let currentActionableHolder;
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
