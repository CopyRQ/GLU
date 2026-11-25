const selectableLinks = document.querySelectorAll(".game-menu a, .product-option");

function selectLink(link) {
    selectableLinks.forEach((selectableLink) => {
        selectableLink.classList.remove("selected");
    });

    link.classList.add("selected");

    const preview = document.querySelector("#shop-preview-image");
    const previewName = document.querySelector("#shop-preview-name");
    if (preview && link.dataset.preview) {
        preview.src = link.dataset.preview;
        preview.alt = link.dataset.previewName || "";
        if (previewName) {
            previewName.textContent = link.dataset.previewName || "";
        }
    }
}

selectableLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => selectLink(link));
    link.addEventListener("focus", () => selectLink(link));
    link.addEventListener("click", () => selectLink(link));
});

document.querySelectorAll("[data-game-exit]").forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.assign(link.href);
        }
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        const backLink = document.querySelector("[data-game-back]");
        if (backLink) {
            event.preventDefault();
            window.location.assign(backLink.href);
        }
        return;
    }

    const activeElement = document.activeElement;
    if (
        activeElement.matches("input, select, textarea, button")
        || event.altKey
        || event.ctrlKey
        || event.metaKey
    ) {
        return;
    }

    const menus = [...document.querySelectorAll("[data-game-menu]")];
    const activeLink = activeElement.closest("a[href]");
    let menu = activeLink ? activeLink.closest("[data-game-menu]") : null;

    if (!menu) {
        menu = menus.slice().reverse().find((candidate) =>
            candidate.querySelector("a.selected")
        ) || menus[0];
    }

    if (!menu) {
        return;
    }

    const links = [...menu.querySelectorAll("a[href]")];
    if (links.length === 0) {
        return;
    }

    let currentIndex = activeLink && activeLink.classList.contains("selected")
        ? links.indexOf(activeLink)
        : -1;
    if (currentIndex === -1) {
        currentIndex = links.findIndex((link) => link.classList.contains("selected"));
        if (currentIndex === -1) {
            currentIndex = 0;
        }
    }

    if (event.key === "Enter" && !activeLink) {
        event.preventDefault();
        links[currentIndex].click();
        return;
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
    }

    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (currentIndex + direction + links.length) % links.length;
    links[nextIndex].focus();
});
