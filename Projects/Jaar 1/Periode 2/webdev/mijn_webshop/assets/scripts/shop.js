const selectableLinks = document.querySelectorAll(".shop-menu a, .buy-link");

function selectLink(link) {
    selectableLinks.forEach((selectableLink) => {
        selectableLink.classList.remove("selected");
    });

    link.classList.add("selected");
}

selectableLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => selectLink(link));
    link.addEventListener("focus", () => selectLink(link));
    link.addEventListener("click", () => selectLink(link));
});
