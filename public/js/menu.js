class Menu {
    constructor() {
        // Elements used in the menu
        this.menu = dom.menu.el;
        this.container = dom.menu.container;
        
        // Start touch position of the input
        this.startY = 0;
        this.startHeight = 0;
        // Distance that must be travelled before the menu starts to move
        this.threshold = 10;
        // Keeps track of if the menu is being dragged, to keep things smooth
        this.moving = false;

        this.tabHeight = Number(window.getComputedStyle(dom.menu.tab).height.replace("px", ""));

        // Add event listeners for the different touch events
        this.menu.addEventListener("touchstart", this.touchStart.bind(this), {passive: true});
        this.menu.addEventListener("touchmove", this.touchMove.bind(this), {passive: true});
        this.menu.addEventListener("touchend", this.touchEnd.bind(this), {passive: true});
        this.menu.addEventListener("touchcancel", this.touchEnd.bind(this), {passive: true});
    }

    touchStart(e) {
        this.startY = e.changedTouches[0].clientY;
        this.startHeight = this.currentHeight;
    }

    touchMove(e) {
        let dy = this.startY - e.changedTouches[0].clientY;
        if (Math.abs(dy) > this.threshold && document.body.getAttribute("state") == "page") {
            this.moving = true;
        }

        if (this.moving) {
            let newHeight;

            state.el(this.menu, "dragging")
            newHeight = this.startHeight + dy;

            if (newHeight < this.tabHeight) newHeight = this.tabHeight;
            else if (newHeight > document.body.clientHeight) newHeight = document.body.clientHeight;

            if (newHeight != undefined) this.menu.style.height = newHeight + "px";
        }

    }

    touchEnd() {
        this.moving = false;
        state.reset(this.menu, "state");

        let height = this.currentHeight;
        this.menu.style.height = "";

        if (height > document.body.clientHeight * 0.9) state.el(this.menu, "extended");
        else if (height < document.body.clientHeight * 0.4) state.set("menu");
    }

    get currentHeight() {
        return Number(window.getComputedStyle(this.menu).height.replace("px", ""));
    }
}