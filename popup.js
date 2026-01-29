const addFolderBtn = document.getElementById("add-folder-btn"); 
const mainListView = document.getElementById("main-list-view");

// 1. The Main Button simply triggers our universal creation function
addFolderBtn.addEventListener("click", () => {
    createFolderElement(); // No name passed = new folder mode
});

function createFolderElement(existingName = null) {
    const folder = document.createElement("div");
    folder.className = 'folder';
    
    // Initial State: Input for new folders, or Span for loaded folders
    if (!existingName) {
        folder.innerHTML = `
            <div class="icon">📂</div>
            <input type="text" class="folder-input" placeholder="Folder Name..." />
        `;
    } else {
        folder.innerHTML = `
            <div class="icon">📂</div>
            <div class="folder-header">
                <span class="folder-name">${existingName}</span>
                <button class="three-dot-btn">...</button>
            </div>
        `;
    }

    mainListView.appendChild(folder);
    
    // If it's a new folder, handle the initial naming
    const initialInput = folder.querySelector('.folder-input');
    if (initialInput) {
        initialInput.focus();
        initialInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const name = initialInput.value || "Untitled Folder";
                finalizeFolderName(folder, name);
            }
            if (e.key === "Escape") folder.remove();
        });
    }

    // Handle all interactions inside the folder
    folder.addEventListener("click", (e) => {
        // --- 3-DOT MENU TOGGLE ---
        if (e.target.classList.contains("three-dot-btn")) {
            const openMenu = document.querySelector(".folder-options-menu");
            if (openMenu) openMenu.remove();

            folder.insertAdjacentHTML('beforeend', `
                <div class="folder-options-menu">
                    <button class="action-btn">Add Prompt</button>
                    <button class="action-btn">Rename Folder</button>
                    <button class="action-btn">Remove Folder</button>
                </div>
            `);
        }

        // --- REMOVE LOGIC ---
        if (e.target.textContent === "Remove Folder") {
            folder.remove();
            saveFolders(); // Update storage
        }

        // --- RENAME LOGIC ---
        if (e.target.textContent === "Rename Folder") {
            const nameSpan = folder.querySelector(".folder-name");
            const currentName = nameSpan.textContent;
            const header = folder.querySelector(".folder-header");

            header.innerHTML = `<input type="text" class="folder-input" value="${currentName}"/>`;
            const renameInput = header.querySelector(".folder-input");
            renameInput.focus();
            renameInput.select();

            renameInput.addEventListener("keydown", (keyEvent) => {
                if (keyEvent.key === "Enter") {
                    finalizeFolderName(folder, renameInput.value || currentName);
                }
                if (keyEvent.key === "Escape") {
                    finalizeFolderName(folder, currentName);
                }
            });
        }
    });
}

// Helper to switch from Input mode to Static mode
function finalizeFolderName(folderElement, name) {
    folderElement.innerHTML = `
        <div class="icon">📂</div>
        <div class="folder-header">
            <span class="folder-name">${name}</span>
            <button class="three-dot-btn">...</button>
        </div>
    `;
    saveFolders(); // Update storage
}

// --- STORAGE LOGIC ---
function saveFolders() {
    const data = [];
    document.querySelectorAll(".folder").forEach(el => {
        const name = el.querySelector(".folder-name")?.textContent;
        if (name) data.push({ name: name });
    });
    localStorage.setItem("myFolders", JSON.stringify(data));
}

function loadFolders() {
    const saved = JSON.parse(localStorage.getItem("myFolders") || "[]");
    saved.forEach(f => createFolderElement(f.name));
}

// Close menus when clicking outside
document.addEventListener("click", (e) => {
    const menu = document.querySelector(".folder-options-menu");
    if (menu && !e.target.classList.contains("three-dot-btn") && !menu.contains(e.target)) {
        menu.remove();
    }
});

loadFolders();