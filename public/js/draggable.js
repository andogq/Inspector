class Draggable {
    constructor({el, classes, threshold}) {
        this.el = el;
        this.classes = classes;

        // How much will be taken up, from the bottom of the screen
        this.threshold = threshold == undefined ? 0.6 : threshold;

        // Set up event listeners
        this.el.addEventListener("touchstart", this.touchStart.bind(this));
        this.el.addEventListener("touchmove", this.touchMove.bind(this));
        this.el.addEventListener("touchend", this.touchEnd.bind(this));
        this.el.addEventListener("touchcancel", this.touchEnd.bind(this));
    }

    touchStart(e) {
        e.preventDefault();

        this.y0 = e.changedTouches[0].clientY;
    }

    touchMove(e) {
        e.preventDefault();

        let y = e.changedTouches[0].clientY;

        if (this.state != "moving") {
            let dy = Math.abs(this.y0 - y);

            if (dy > 10) this.state = "moving";
        }
        // Recheck because it may change
        if (this.state == "moving") this.el.style.top = y + "px";
    }

    touchEnd(e) {
        e.preventDefault();

        if (e.changedTouches[0].clientY < ((1 - this.threshold) * document.body.clientHeight)) this.state = "extended";
        else this.state = "collapsed";

        // Remove any styling put in by the class
        this.el.style.top = ""
    }

    get state() {
        return this._state;
    }
    set state(newState) {
        // Remove old classes
        this.el.classList.remove(this.classes[this.state]);

        // Add new classes
        this.el.classList.add(this.classes[newState]);

        this._state = newState;
    }
}