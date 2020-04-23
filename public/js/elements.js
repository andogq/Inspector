function initElements() {
    // Each selection input
    [...document.getElementsByClassName("selection")].forEach((el) => {
        // Each option within the selection
        [...el.children].forEach((child) => {
            child.addEventListener("click", (e) => {
                // Find the parent element
                let parent = e.path[0];
                while (parent != el) parent = parent.parentElement;

                // Set the value of the parent to the contents of the child
                parent.value = child.innerText;

                // Remove the currently selected option, if it exists
                let selected = el.getElementsByClassName("selected")[0];
                if (selected != undefined) selected.classList.remove("selected");

                // Select the pressed element
                child.classList.add("selected");
            });
        });
    });

    [...document.getElementsByTagName("input")].forEach((el) => {
        if (el.type == "time") {
            let d = new Date();
            el.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
        }
    });
}