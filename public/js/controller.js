class Controller {
    constructor() {
        this.states = {};
        this.groups = {};
        this.subControllers = {};

        this._state = "default";
    }

    // Saves a state with a state name
    addState(stateName, config, args={}) {
        let trigger = args.trigger;
        let callback = args.callback;
        
        this.states[stateName] = config;

        if (trigger != undefined) {
            Object.keys(trigger).forEach((event) => {
                this.listen(trigger[event], event, {state: stateName, callback});
            });
        }
    }

    // Combines elements together so they can be referenced at once
    addGroup(groupName, targets) {
        // Ensures that Element Collections are converted to arrays
        if (targets.constructor == HTMLCollection) targets = [...targets];

        this.groups[groupName] = targets;
    }

    // Adds a new controller that runs independently of the main one
    newSubController(name) {
        this.subControllers[name] = new Controller();
        return this.subControllers[name];
    }

    // Adds a listener to a target, changing to the state and running the callback
    listen(targets, events, {state, callback}) {
        if (!Array.isArray(events)) events = [events];
        if (!Array.isArray(targets)) targets = [targets];
        
        let cb = (e) => {
            if (state != undefined) this.state = state;
            if (callback != undefined) callback(e);
        }
        
        targets.forEach((target) => {
            let el = this.e(target);
            events.forEach((event) => {
                el.addEventListener(event, cb);
            });
        });
    }
    // Passthrough for the listener method
    click(targets, {state, callback}) {
        this.listen(targets, "click", {state, callback});
    }
    
    // Returns an element based on a classifier
    e(classifier, type="id") {
        // If not string, must be a dom element already
        if (typeof(classifier) != "string") return classifier;

        switch(type) {
            case "id":
                return document.getElementById(classifier);
            case "class":
                return [...document.getElementsByClassName(classifier)];
            default:
                return false;
        }
    }

    extractClasses(config) {
        config = config.reduce((arr, c) => {
            // Expand all the inheritance states
            if (typeof(c) == "string") {
                if (Object.keys(this.states).indexOf(c) != -1) c = this.extractClasses(this.states[c]);
                else c = [];
            }
            else c = [c];

            // Each element in the config
            c.forEach((elConfig) => {
                // Convert everything to a unified form
                if (!Array.isArray(elConfig.target)) elConfig.target = [elConfig.target];
                // If there's a condition, apply that
                if (typeof(elConfig.if) == "function") elConfig.if = elConfig.if();
                else elConfig.if = true;
            });

            // Add the updated elements
            arr.push(...c);
            return arr;
        }, []);

        return config;
    }

    // Getter and setter for state
    get state() {
        return this._state;
    }
    set state(newState) {
        // Functions to be run against el.classList
        let actions = ["add", "remove", "toggle"];
        let inverseActions = ["remove", "add", "toggle"];

        if (this._state != "default") {
            // Undo old state
            let oldConfig = this.extractClasses(this.states[this._state]);
            
            // For each element in the config
            oldConfig.forEach((elConfig) => {
                if (elConfig.if) {
                    elConfig.target.forEach((target) => {
                        // Fetch the element
                        let el = this.e(target);
        
                        // For each method on classList
                        actions.forEach((action, i) => {
                            // Reverses all the class actions applied to the element
                            if (elConfig[action] != undefined) el.classList[inverseActions[i]](elConfig[action]);
                        });
                    });
                }
            });
        }

        if (newState != "default") {
            let newConfig = this.extractClasses(this.states[newState]);

            // For each element in the config
            newConfig.forEach((elConfig) => {
                if (elConfig.if) {
                    elConfig.target.forEach((target) => {
                        // Fetch the element
                        let el = this.e(target);
        
                        // Add, remove and toggle the classes as necessary
                        actions.forEach((action) => {
                            if (elConfig[action] != undefined) el.classList[action](elConfig[action]);
                        });
                    });
                }
            });
        }

        this._state = newState;
    }
}