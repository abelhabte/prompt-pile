const addFolder = document.getElementById("add-folder-btn"); 
const mainListView = document.getElementById("main-list-view");

addFolder.addEventListener("click", () => {
    const folder = document.createElement("div");
    folder.className = 'folder';
    
    folder.innerHTML = `
        <div class="icon">📂</div>
        <input type="text" class="folder-input" placeholder="Folder Name..." />
    `;

    mainListView.appendChild(folder);
    
    const input = folder.querySelector('.folder-input');
    input.focus();

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const folderName = input.value || "Untitled Folder";
            // We use a container for the name and button so we can keep them
            folder.innerHTML = `
                <div class="icon">📂</div>
                <div class="folder-header">
                    <span class="folder-name">${folderName}</span>
                    <button class="three-dot-btn">...</button>
                </div>
            `;
        }

        if (e.key === "Escape") {
            folder.remove();
        }
    });

    // MOVE THE LISTENER HERE (Inside the creation logic)
    folder.addEventListener("click", (e) => {
        // Use classList.contains if you have multiple folders
        if (e.target && e.target.classList.contains("three-dot-btn")) {

            const existingMenu = folder.querySelector(".folder-options-menu");

            const openMenu = document.querySelector(".folder-options-menu");

            if (openMenu && openMenu !== existingMenu) {
                openMenu.remove();
            }

            if (existingMenu) {
                existingMenu.remove();
            } else {
                const folderOptionsMenu = `
                <div class="folder-options-menu">
                    <button class="action-btn">Add Prompt</button>
                    <button class="action-btn">Rename Folder</button>
                    <button class="action-btn">Remove Folder</button>
                </div>
                `;

            // Use insertAdjacentHTML so you don't delete the icon and name!
            folder.insertAdjacentHTML('beforeend', folderOptionsMenu);
            }
        }
        if (e.target && e.target.classList.contains("action-btn")) {
            if (e.target.textContent === "Remove Folder") {
                folder.remove();
            }
        }
    });
});

document.addEventListener("click", (e) => {
    // 1. Check if an open menu exists on the page
    const openMenu = document.querySelector(".folder-options-menu");

    if (openMenu) {
        // 2. If the user clicked outside of the 3-dot button AND outside the menu
        // .contains() checks if the click happened inside the menu element
        if (!e.target.classList.contains("three-dot-btn") && !openMenu.contains(e.target)) {
            openMenu.remove();
        }
    }
});