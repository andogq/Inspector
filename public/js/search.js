const search = {
    show(run) {
        // The function to run with a query to supply elements to add
        this.run = run;

        state.el(dom.search.container, "show");
        dom.input.search.focus();

        this.update();
    },
    hide() {
        state.reset(dom.search.container);
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