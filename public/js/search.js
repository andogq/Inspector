const search = {
    show(run) {
        // The function to run with a query to supply elements to add
        this.run = run;

        dom.search.container.setAttribute("state", "show");
        dom.input.search.focus();

        this.update();
    },
    hide() {
        dom.search.container.removeAttribute("state");
    },

    update() {
        if (this.run) this.run(dom.input.search.value).then((els) => {
            dom.search.suggestions.innerHTML = "";

            els.forEach((el) => {
                dom.search.suggestions.appendChild(el);
            });
        });
    }
}