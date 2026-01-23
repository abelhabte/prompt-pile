// Added quotes around the ID strings
const addFolder = document.getElementById("add-folder-btn"); 
const mainListView = document.getElementById("main-list-view");

addFolder.addEventListener("click", () => {
    const folder = document.createElement("div");
    folder.className = 'folder';
    
    folder.innerHTML = `
        <div class="icon">📂</div>
        <input type="text" class="folder-input" placeholder="Folder Name..." />
    `;

    // Only need to append once
    mainListView.appendChild(folder);
    
    const input = folder.querySelector('.folder-input');
    input.focus();

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const folderName = input.value || "Untitled Folder";
            folder.innerHTML = `
                <div class="icon">📂</div>
                <span class="folder-name">${folderName}</span>
            `;
        }
    });
});