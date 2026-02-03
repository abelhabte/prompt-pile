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
        folder.innerHTML = `
            <div class="icon">📂</div>
            <input type="text" class="folder-input" placeholder="Folder Name..." />
        `;
    } else {
        renderFolderStatic(folder, existingName);
        const list = folder.querySelector(".prompts-list");
        existingPrompts.forEach(p => addPromptToUI(list, p));
    }

    mainListView.appendChild(folder);

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

    folder.addEventListener("click", (e) => {
        // Toggle 3-Dot Menu
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

        // Remove Folder
        if (e.target.textContent === "Remove Folder") {
            folder.remove();
            saveFolders();
        }

        // Rename Folder
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

        // Add Prompt
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
    promptEditor.className = data.title ? "prompt-editor is-saved" : "prompt-editor";

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

    const titleInput = promptEditor.querySelector(".prompt-title");

    titleInput.addEventListener("click", () => {
        promptEditor.classList.remove("is-saved");
    });

    promptEditor.querySelector(".save-prompt-btn").addEventListener("click", () => {
        if (!titleInput.value) {
            alert("Please enter a title!");
            return;
        }
        promptEditor.classList.add("is-saved");
        saveFolders();
        alert("Prompt Saved!");
    });

    promptEditor.querySelector(".copy-prompt-btn").addEventListener("click", (e) => {
        const body = promptEditor.querySelector(".prompt-body").value;
        navigator.clipboard.writeText(body).then(() => {
            const originalText = e.target.textContent;
            e.target.textContent = "Copied!";
            setTimeout(() => e.target.textContent = originalText, 2000);
        });
    });

    promptEditor.querySelector(".delete-prompt-btn").addEventListener("click", () => {
        promptEditor.remove();
        saveFolders();
    });
}

// --- UTILITY FUNCTIONS ---
function renderFolderStatic(folderElement, name) {
    // Only update the header area, leave the prompts-list alone to preserve event listeners
    folderElement.innerHTML = `
        <div class="icon">📂</div>
        <div class="folder-header">
            <span class="folder-name">${name}</span>
            <button class="three-dot-btn">...</button>
        </div>
        <div class="prompts-list"></div>
    `;
}

function saveFolders() {
    const data = [];
    document.querySelectorAll(".folder").forEach(el => {
        const nameSpan = el.querySelector(".folder-name");
        if (nameSpan) {
            const folderName = nameSpan.textContent;
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

document.addEventListener("click", (e) => {
    const menu = document.querySelector(".folder-options-menu");
    if (menu && !e.target.classList.contains("three-dot-btn") && !menu.contains(e.target)) {
        menu.remove();
    }
});