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
            <div class="folder-header">
                <span class="icon">▶</span>
                <input type="text" class="folder-input" placeholder="Folder Name..." />
            </div>
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
        const isHeaderClick = e.target.closest(".folder-header");
        const isActionButton = e.target.classList.contains("three-dot-btn") || e.target.classList.contains("action-btn");
        const isInput = e.target.tagName === "INPUT";

        if (isHeaderClick && !isActionButton && !isInput) {
            folder.classList.toggle("is-open");
            const icon = folder.querySelector(".icon");
            if (icon) {
                icon.textContent = folder.classList.contains("is-open") ? "▼" : "▶";
            }
        }

        if (e.target.classList.contains("three-dot-btn")) {
            const openMenu = document.querySelector(".folder-options-menu");
            if (openMenu) openMenu.remove();

            const header = e.target.closest(".folder-header");
            header.insertAdjacentHTML('beforeend', `
                <div class="folder-options-menu">
                    <button class="action-btn">Add Prompt</button>
                    <button class="action-btn">Rename Folder</button>
                    <button class="action-btn">Remove Folder</button>
                </div>
            `);
        }

        if (e.target.textContent === "Remove Folder") {
            folder.remove();
            saveFolders();
        }

        if (e.target.textContent === "Rename Folder") {
            const nameSpan = folder.querySelector(".folder-name");
            const currentName = nameSpan.textContent;
            const header = folder.querySelector(".folder-header");
            header.innerHTML = `
                <span class="icon">▶</span>
                <input type="text" class="folder-input" value="${currentName}"/>
            `;
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

        if (e.target.textContent === "Add Prompt") {
            folder.classList.add("is-open");
            const icon = folder.querySelector(".icon");
            if (icon) icon.textContent = "▼";

            const list = folder.querySelector(".prompts-list");
            // Pass 'true' to indicate this is a new prompt being created
            addPromptToUI(list, {title: '', category: 'ChatGPT', body: ''}, true);
            const menu = folder.querySelector(".folder-options-menu");
            if (menu) menu.remove();
        }
    });
}

// --- PROMPT UI HELPER ---
function addPromptToUI(container, data = {title: '', category: 'ChatGPT', body: ''}, isNew = false) {
    const promptEditor = document.createElement("div");
    promptEditor.className = data.title ? "prompt-editor is-saved" : "prompt-editor";

    // Determine which buttons to show in the edit-actions div
    const actionButtons = isNew 
        ? `<button class="cancel-prompt-btn">Cancel</button>
           <button class="save-prompt-btn">+ Add Prompt</button>`
        : `<button class="copy-prompt-btn">Copy</button>
           <button class="save-prompt-btn">Save</button>`;

    promptEditor.innerHTML = `
        <div class="prompt-header-row">
            <input type="text" class="prompt-title" placeholder="Prompt Title" value="${data.title}">
            <select class="prompt-category">
                <option value="ChatGPT" ${data.category === 'ChatGPT' ? 'selected' : ''}>ChatGPT</option>
                <option value="Claude" ${data.category === 'Claude' ? 'selected' : ''}>Claude</option>
                <option value="Gemini" ${data.category === 'Gemini' ? 'selected' : ''}>Gemini</option>
            </select>
            <div class="saved-actions">
                <button class="copy-prompt-btn">Copy</button>
                <button class="delete-prompt-btn">Delete</button>
            </div>
        </div>
        
        <textarea class="prompt-body" placeholder="Write your prompt here...">${data.body}</textarea>
        
        <div class="edit-actions">
            ${actionButtons}
        </div>
    `;

    // Handle Cancel logic for new prompts
    if (isNew) {
        promptEditor.querySelector(".cancel-prompt-btn").addEventListener("click", () => {
            promptEditor.remove();
        });
    }

    // Copy logic for all copy buttons
    promptEditor.querySelectorAll(".copy-prompt-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const body = promptEditor.querySelector(".prompt-body").value;
            navigator.clipboard.writeText(body).then(() => {
                const originalText = e.target.textContent;
                e.target.textContent = "Copied!";
                setTimeout(() => e.target.textContent = originalText, 2000);
            });
        });
    });

    container.appendChild(promptEditor);

    const titleInput = promptEditor.querySelector(".prompt-title");
    const bodyTextarea = promptEditor.querySelector(".prompt-body");

    const handleEscapeCollapse = (e) => {
        if (e.key === "Escape") {
            if (titleInput.value.trim() !== "") {
                promptEditor.classList.add("is-saved");
            }
        }
    };

    titleInput.addEventListener("keydown", handleEscapeCollapse);
    bodyTextarea.addEventListener("keydown", handleEscapeCollapse);

    titleInput.addEventListener("click", (e) => {
        const allOpenPrompts = document.querySelectorAll(".prompt-editor:not(.is-saved)");
        allOpenPrompts.forEach(openPrompt => {
            if (openPrompt !== promptEditor) {
                const otherTitle = openPrompt.querySelector(".prompt-title").value;
                if (otherTitle.trim() !== "") {
                    openPrompt.classList.add("is-saved");
                }
            }
        });

        promptEditor.classList.remove("is-saved");
        e.stopPropagation();
    });

    promptEditor.querySelector(".save-prompt-btn").addEventListener("click", () => {
        if (!titleInput.value) {
            alert("Please enter a title!");
            return;
        }
        
        // Transform a 'New' prompt into an 'Existing' prompt UI after first save
        if (isNew) {
            isNew = false;
            const actionsDiv = promptEditor.querySelector(".edit-actions");
            actionsDiv.innerHTML = `
                <button class="copy-prompt-btn">Copy</button>
                <button class="save-prompt-btn">Save</button>
            `;
            // Re-bind the new copy button
            actionsDiv.querySelector(".copy-prompt-btn").addEventListener("click", (e) => {
                const body = promptEditor.querySelector(".prompt-body").value;
                navigator.clipboard.writeText(body).then(() => {
                    const originalText = e.target.textContent;
                    e.target.textContent = "Copied!";
                    setTimeout(() => e.target.textContent = originalText, 2000);
                });
            });
        }

        promptEditor.classList.add("is-saved");
        saveFolders();
    });

    promptEditor.querySelector(".delete-prompt-btn").addEventListener("click", () => {
        promptEditor.remove();
        saveFolders();
    });
}

function renderFolderStatic(folderElement, name) {
    const header = folderElement.querySelector(".folder-header");
    if (header) {
        const nameSpan = header.querySelector(".folder-name");
        if (nameSpan) {
            nameSpan.textContent = name;
        }
        header.innerHTML = `
            <span class="icon">${folderElement.classList.contains("is-open") ? "▼" : "▶"}</span>
            <span class="folder-name">${name}</span>
            <button class="three-dot-btn">...</button>
        `;
    } else {
        folderElement.innerHTML = `
            <div class="folder-header">
                <span class="icon">▶</span>
                <span class="folder-name">${name}</span>
                <button class="three-dot-btn">...</button>
            </div>
            <div class="prompts-list"></div>
        `;
    }
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

    const openPrompt = document.querySelectorAll(".prompt-editor:not(.is-saved)");
    openPrompt.forEach(prompt => {
        if (!prompt.contains(e.target)) {
            const titleInput = prompt.querySelector(".prompt-title");
            if (titleInput.value.trim() !== "") {
                prompt.classList.add("is-saved");
            }
        }
    });
});