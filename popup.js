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
                <span class="drag-handle">⠿</span>
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
            if (list) {
                addPromptToUI(list, {title: '', category: 'ChatGPT', body: ''}, true);
            }
            const menu = folder.querySelector(".folder-options-menu");
            if (menu) menu.remove();
        }
    });
}

// --- PROMPT UI HELPER ---
function addPromptToUI(container, data = {title: '', category: 'ChatGPT', body: ''}, isNew = false) {
    const promptEditor = document.createElement("div");
    promptEditor.className = data.title ? "prompt-editor is-saved" : "prompt-editor";

    const actionButtons = isNew 
        ? `<button class="cancel-new-btn">Cancel</button>
           <button class="save-prompt-btn">+ Add Prompt</button>`
        : `<button class="cancel-edit-btn">Cancel</button>
           <button class="copy-prompt-btn">Copy</button>
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
        <div class="edit-actions">${actionButtons}</div>
    `;

    if (isNew) {
        promptEditor.querySelector(".cancel-new-btn").addEventListener("click", () => promptEditor.remove());
    } else {
        promptEditor.querySelector(".cancel-edit-btn").addEventListener("click", () => {
            promptEditor.classList.add("is-saved");
        });
    }

    const setupCopyLogic = (btn) => {
        btn.addEventListener("click", (e) => {
            const body = promptEditor.querySelector(".prompt-body").value;
            navigator.clipboard.writeText(body).then(() => {
                const originalText = e.target.textContent;
                e.target.textContent = "Copied!";
                setTimeout(() => e.target.textContent = originalText, 2000);
            });
        });
    };

    promptEditor.querySelectorAll(".copy-prompt-btn").forEach(setupCopyLogic);

    container.appendChild(promptEditor);

    const titleInput = promptEditor.querySelector(".prompt-title");
    titleInput.addEventListener("click", (e) => {
        const allOpenPrompts = document.querySelectorAll(".prompt-editor:not(.is-saved)");
        allOpenPrompts.forEach(openPrompt => {
            if (openPrompt !== promptEditor && openPrompt.querySelector(".prompt-title").value.trim() !== "") {
                openPrompt.classList.add("is-saved");
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

        if (isNew) {
            isNew = false;
            promptEditor.querySelector(".edit-actions").innerHTML = `
                <button class="cancel-edit-btn">Cancel</button>
                <button class="copy-prompt-btn">Copy</button>
                <button class="save-prompt-btn">Save</button>
            `;
            promptEditor.querySelector(".cancel-edit-btn").addEventListener("click", () => promptEditor.classList.add("is-saved"));
            setupCopyLogic(promptEditor.querySelector(".copy-prompt-btn"));
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
    let header = folderElement.querySelector(".folder-header");
    if (!header) {
        header = document.createElement("div");
        header.className = "folder-header";
        folderElement.prepend(header);
    }

    header.innerHTML = `
        <span class="drag-handle">⠿</span>
        <span class="icon">${folderElement.classList.contains("is-open") ? "▼" : "▶"}</span>
        <span class="folder-name">${name}</span>
        <button class="three-dot-btn">...</button>
    `;

    // Corrected variable name from listDev to listDiv
    if (!folderElement.querySelector(".prompts-list")) {
        const listDiv = document.createElement("div");
        listDiv.className = "prompts-list";
        folderElement.appendChild(listDiv);
    }
}

function saveFolders() {
    const data = [];
    document.querySelectorAll(".folder").forEach(el => {
        const nameSpan = el.querySelector(".folder-name");
        if (nameSpan) {
            const prompts = [];
            el.querySelectorAll(".prompt-editor").forEach(p => {
                prompts.push({
                    title: p.querySelector(".prompt-title").value,
                    category: p.querySelector(".prompt-category").value,
                    body: p.querySelector(".prompt-body").value
                });
            });
            data.push({ name: nameSpan.textContent, prompts: prompts });
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