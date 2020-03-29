class UI {
    constructor({states, stateClasses}) {
        /*
         * Constants
         */
        // Associates each state with a number
        this.states = states;

        // Classes to be added to each element for each state
        this.stateClasses = stateClasses;

        // Set the initial state
        this.state = this.states.map;
    }

    addListener({el, event, callback, once}) {
        function cb(e) {
            // Deactivate the active element to hide the keyboard
            document.activeElement.blur();
            // Run the user supplied callback
            callback(e);
        }
        
        if (Array.isArray(event)) event.forEach((e) => {
            this.addListener({el, event: e, callback: cb, once});
        });
        else if (Array.isArray(el)) el.forEach((e) => {
            this.addListener({el: e, event, callback: cb, once});
        });
        else this.el(el).addEventListener(event, cb, once == undefined ? false : once);
    }

    /*
     * Retreieves elements
     */
    el(id) {
        return document.getElementById(id);
    } 

    /*
     * Manages the state changes
     */
    set state(newState) {
        // if (newState == 1) debugger;
        if (typeof(newState) != "number" || newState >= Object.keys(this.states).length) return;

        let oldState = this._state;

        if (oldState != undefined) {
            // Remove all current classes
            let oldClasses = this.stateClasses[oldState];
            Object.keys(oldClasses).forEach((el) => {
                let c = typeof(oldClasses[el]) == "string" ? [oldClasses[el]] : oldClasses[el];
                this.el(el).classList.remove(c);
            });
        }

        // Add all the new classes
        let newClasses = this.stateClasses[newState];
        Object.keys(newClasses).forEach((el) => {
            let c = typeof(newClasses[el]) == "string" ? [newClasses[el]] : newClasses[el];
            this.el(el).classList.add(...c);
        });
        
        this._state = newState;
    }
    get state() {
        return this._state;
    }
}