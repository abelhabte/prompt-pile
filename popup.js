const addFolderBtn = document.getElementById("add-folder-btn");
const mainListView = document.getElementById("main-list-view");

// --- INITIALIZATION ---
addFolderBtn.addEventListener("click", () => createFolderElement());
loadFolders();

// --- CORE FOLDER CREATION ---
function createFolderElement(existingName = null, existingPrompts = []) {
    const folder = document.createElement("div");
    folder.className = 'folder';

    if (!existingName) {
        // Mode: Typing new name
        folder.innerHTML = `
            <div class="icon">📂</div>
            <input type="text" class="folder-input" placeholder="Folder Name..." />
        `;
    } else {
        // Mode: Already named (Loaded from storage or just finalized)
        renderFolderStatic(folder, existingName);
        const list = folder.querySelector(".prompts-list");
        existingPrompts.forEach(p => addPromptToUI(list, p));
    }

    mainListView.appendChild(folder);

    // Handle initial naming input
    const initialInput = folder.querySelector('.folder-input');
    if (initialInput) {
        initialInput.focus();
        initialInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const name = initialInput.value || "Untitled Folder";
                renderFolderStatic(folder, name);
                saveFolders();
            }
            if (e.key === "Escape") folder.remove();
        });
    }

    // Main Folder Event Listener (Delegation for menus and buttons)
    folder.addEventListener("click", (e) => {
        // 1. Toggle 3-Dot Menu
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

        // 2. Remove Folder
        if (e.target.textContent === "Remove Folder") {
            folder.remove();
            saveFolders();
        }

        // 3. Rename Folder
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
                    renderFolderStatic(folder, renameInput.value || currentName);
                    saveFolders();
                }
                if (keyEvent.key === "Escape") {
                    renderFolderStatic(folder, currentName);
                }
            });
        }

        // 4. Add Prompt
        if (e.target.textContent === "Add Prompt") {
            const list = folder.querySelector(".prompts-list");
            addPromptToUI(list);
            const menu = folder.querySelector(".folder-options-menu");
            if (menu) menu.remove();
        }
    });
}

// --- PROMPT UI HELPER ---
function addPromptToUI(container, data = {title: '', category: 'ChatGPT', body: ''}) {
    const promptEditor = document.createElement("div");
    promptEditor.className = "prompt-editor";

    promptEditor.innerHTML = `
        <input type="text" class="prompt-title" placeholder="Prompt Title" value="${data.title}">
        <select class="prompt-category">
            <option value="ChatGPT" ${data.category === 'ChatGPT' ? 'selected' : ''}>ChatGPT</option>
            <option value="Claude" ${data.category === 'Claude' ? 'selected' : ''}>Claude</option>
            <option value="Gemini" ${data.category === 'Gemini' ? 'selected' : ''}>Gemini</option>
        </select>
        <textarea class="prompt-body" placeholder="Write your prompt here...">${data.body}</textarea>
        <div class="prompt-actions">
            <button class="save-prompt-btn">Save</button>
            <button class="copy-prompt-btn">Copy</button>
            <button class="delete-prompt-btn">Delete</button>
        </div>
    `;

    container.appendChild(promptEditor);

    // Save Button
    promptEditor.querySelector(".save-prompt-btn").addEventListener("click", () => {
        saveFolders();
        alert("Prompt Saved!");
    });

    // Copy Button
    promptEditor.querySelector(".copy-prompt-btn").addEventListener("click", (e) => {
        const body = promptEditor.querySelector(".prompt-body").value;
        navigator.clipboard.writeText(body).then(() => {
            const originalText = e.target.textContent;
            e.target.textContent = "Copied!";
            setTimeout(() => e.target.textContent = originalText, 2000);
        });
    });

    // Delete Prompt Button
    promptEditor.querySelector(".delete-prompt-btn").addEventListener("click", () => {
        promptEditor.remove();
        saveFolders();
    });
}

// --- UTILITY FUNCTIONS ---
function renderFolderStatic(folderElement, name) {
    // Keeps existing prompts if they exist when re-rendering the header
    const existingPrompts = folderElement.querySelector(".prompts-list")?.innerHTML || "";
    folderElement.innerHTML = `
        <div class="icon">📂</div>
        <div class="folder-header">
            <span class="folder-name">${name}</span>
            <button class="three-dot-btn">...</button>
        </div>
        <div class="prompts-list">${existingPrompts}</div>
    `;
}

function saveFolders() {
    const data = [];
    document.querySelectorAll(".folder").forEach(el => {
        const folderName = el.querySelector(".folder-name")?.textContent;
        if (folderName) {
            const prompts = [];
            el.querySelectorAll(".prompt-editor").forEach(p => {
                prompts.push({
                    title: p.querySelector(".prompt-title").value,
                    category: p.querySelector(".prompt-category").value,
                    body: p.querySelector(".prompt-body").value
                });
            });
            data.push({ name: folderName, prompts: prompts });
        }
    });
    localStorage.setItem("myFolders", JSON.stringify(data));
}

function loadFolders() {
    const saved = JSON.parse(localStorage.getItem("myFolders") || "[]");
    saved.forEach(f => createFolderElement(f.name, f.prompts || []));
}

// Global click to close menus
document.addEventListener("click", (e) => {
    const menu = document.querySelector(".folder-options-menu");
    if (menu && !e.target.classList.contains("three-dot-btn") && !menu.contains(e.target)) {
        menu.remove();
    }
});