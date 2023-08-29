//classes that hold the current session and the current actionable

//closure for the CurrentSessionHolder class
const currentSessionHolder = (function () {
    //a class that holds values for the current session
    class CurrentSessionHolder {
        constructor() {
            //happens when the session is expired
            this._autoEndTo = 0;
        }

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

        //setters and getters for the expiredSession
        set expiredSession(value) { this._autoEndTo = value; }
        get expiredSession() { return this._autoEndTo; }

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

        //checks if the session is expired
        //a session is expired if its total time exceeds the maxSessionSeconds
        sessionExpiredValue() {
            const maxSessionMilliSeconds = constantValues().maxSessionSeconds * 1000;
            const maxTimeEnding = this._startFrom + maxSessionMilliSeconds;

            //checks if the session is expired
            //sets the autoEnd that will be used by
            //both the current session and the current actionable
            if (Math.floor((Date.now() - this.startFrom) / 1000) >= constantValues().maxSessionSeconds) {
                const remainingPeriod = maxTimeEnding - currentActionableHolder().startFrom;
                this.expiredSession = currentActionableHolder().startFrom + remainingPeriod;;
                return -1;
            }
            else //if it is not expired, return the remaining time
                return maxTimeEnding - Date.now();
        }

        toJSON() {
            return {
                startFrom: this._startFrom,
                endTo: (this._endTo === undefined) ? 0 : this._endTo,
            }
        }
    }

    //actual closure code
    let tmp = new CurrentSessionHolder();
    return function (newSession = false) {
        if (newSession && !tmp.isActiveSession())
            tmp = new CurrentSessionHolder();
        return tmp;
    };
})();


//closure for the CurrentActionableHolder class
const currentActionableHolder = (function () {
    //holds the current actionables and the current session data in local stroage
    //as persistant data to be used when refreshing/reloading the page
    class CurrentActionableHolder {
        constructor(startFromValue, actionableNameValue, actionableColorValue, 
            currentSectionValue, currentSessionValue) {
            this._startFrom = startFromValue;
            this._endTo = 0;
            this._detail = "";
            this._pk = -1;
            this._actionableName = actionableNameValue;
            this._actionableColor = actionableColorValue;
            this._currentSection = currentSectionValue;
            this._currentSession = currentSessionValue;
        }

        //getters and setters for startFrom
        get startFrom() { return this._startFrom; }
        set startFrom(value) { this._startFrom = value; }

        //getters and setters for endTo
        get endTo() { return this._endTo }
        set endTo(value) {
            if (this._startfrom !== 0)
                this._endTo = value;
        }

        //getters and setters for detail and the pk
        get detail() { return this._detail; }
        set detail(value) { this._detail = value; }
        get pk() { return this._pk; }
        set pk(value) { this._pk = value }

        //getters
        get actionableName() { return this._actionableName };
        get actionableColor() { return this._actionableColor };
        get currentSection() { return this._currentSection };
        get currentSession() { return this._currentSession };

        //json, only called during the add actionable function 
        toJSON() {
            return {
                actionableName: this._actionableName,
                startFrom: this._startFrom,
                endTo: this._endTo,
                currentSection: this._currentSection,
                currentSession: this._currentSession,
                detail: this._detail,
            }
        }
    }

    //actual closure code
    let tmp = new CurrentActionableHolder();
    return function (newActionable=false, iterables=null) {
        if (newActionable)
            tmp = new CurrentActionableHolder(...iterables);
        return tmp;
    };
})();