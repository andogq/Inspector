let menu = {
    init: function() {
        // Elements used in the menu
        this.menu = document.getElementById("pullUpMenu");
        this.container = document.getElementById("pullUpMenuContainer");
        
        // Start touch position of the input
        this.startY = 0;
        // The top offset of the menu element when it's minimised
        this.maxY = this.getTop();
        // Offset between finger and top of menu
        this.offset = 0;
        // Distance that must be travelled before the menu starts to move
        this.threshold = 10;
        // Keeps track of if the menu is being dragged, to keep things smooth
        this.moving = false;

        // Positions for the menu to snap to as it's dragged
        this.snap = [0, 0.3 * document.body.clientHeight, this.maxY];

        // Add event listeners for the different touch events
        this.menu.addEventListener("touchstart", this.touchStart.bind(this));
        this.menu.addEventListener("touchmove", this.touchMove.bind(this));
        this.menu.addEventListener("touchend", this.touchEnd.bind(this));
        this.menu.addEventListener("touchcancel", this.touchEnd.bind(this));

        // Ensure the menu starts hidden
        this.hide();
    },

    touchStart: function(e) {
        // Save the original touch position of the input
        this.startY = e.changedTouches[0].clientY;
        // Save the distance of the input from the top of the menu
        this.offset = this.getTop() - this.startY;
        // Stop CSS transitions to keep things smooth
        this.menu.style.transition = "none";
    },
    touchMove: function(e) {
        // Get distance moved from original touch
        let newY = e.changedTouches[0].clientY;
        let dy = newY - this.startY;

        // If it has been far enough to move, and the container are scrolled to the top
        if ((Math.abs(dy) > this.threshold || this.moving) && this.container.scrollTop == 0) {
            // The menu is now dragging
            this.moving = true;
            
            // The new top position for the menu
            let newTop = this.startY + this.offset + dy;
            if (newTop <= 0) {
                // Fully extended
                newTop = 0;
                this.container.style.overflowY = "scroll";
            } else if (newTop >= this.maxY) {
                // Minimised
                newTop = this.maxY;
            } else this.container.style.overflowY = "";

            // Set the new top position
            this.menu.style.top = newTop + "px";
        }
    },
    touchEnd: function(e) {
        // Start transitions again
        this.menu.style.transition = "";
        // Menu no longer moving
        this.moving = false;

        // Calculate the current position of the menu
        let newY = e.changedTouches[0].clientY;
        let dy = newY - this.startY;
        let pos = this.startY + this.offset + dy;

        // Find the closest snap point and move the menu to it
        pos = this.snap[this.getClosestSnap(pos)];

        // Set the final top position
        this.menu.style.top = pos + "px";
    },

    getTop: function() {
        return Number(window.getComputedStyle(this.menu).top.replace("px", ""));
    },

    getClosestSnap: function(y) {
        let distance = Infinity;
        let closest;
        this.snap.forEach((p, i) => {
            if (Math.abs(p - y) < Math.abs(distance)) {
                distance = p - y;
                closest = i;
            }
        });
        return closest;
    },

    moveTo: function(i) {
        let current = this.getClosestSnap(this.getTop());
        if (i <= current) this.menu.style.top = this.snap[i] + "px";
    },

    hide() {
        this.menu.style.top = "100%";
    },

    show() {
        this.moveTo(2);
    }
}