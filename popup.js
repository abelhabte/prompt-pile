const addFolderBtn = document.getElementById("add-folder-btn");
const mainListView = document.getElementById("main-list-view");

// --- INITIALIZATION ---
addFolderBtn.addEventListener("click", () => createFolderElement());
loadFolders();

// --- CORE FOLDER CREATION ---
function createFolderElement(existingName = null, existingPrompts = []) {
    const folder = document.createElement("div");
    folder.className = 'folder';
    folder.setAttribute("draggable", "true");

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

    folder.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("drag-handle")) {
            folder.setAttribute("draggable", "true");
        } else {
            folder.setAttribute("draggable", "false");
        }
    });

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
                <span class="drag-handle">⠿</span>
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
    promptEditor.setAttribute("draggable", "true");

    const renderButtons = (isNewStatus) => {
        return isNewStatus 
            ? `<button class="cancel-new-btn">Cancel</button>
               <button class="save-prompt-btn">+ Add Prompt</button>`
            : `<button class="cancel-edit-btn">Cancel</button>
               <button class="copy-prompt-btn">Copy</button>
               <button class="save-prompt-btn">Save</button>`;
    };

    promptEditor.innerHTML = `
        <div class="prompt-header-row">
            <span class="drag-handle">⠿</span>
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
        <div class="edit-actions">${renderButtons(isNew)}</div>
    `;

    const setupListeners = () => {
        // Handle Cancel
        const cancelNew = promptEditor.querySelector(".cancel-new-btn");
        if (cancelNew) cancelNew.onclick = () => promptEditor.remove();

        const cancelEdit = promptEditor.querySelector(".cancel-edit-btn");
        if (cancelEdit) cancelEdit.onclick = () => promptEditor.classList.add("is-saved");

        // Handle Save
        promptEditor.querySelector(".save-prompt-btn").onclick = () => {
            const titleInput = promptEditor.querySelector(".prompt-title");
            if (!titleInput.value) {
                alert("Please enter a title!");
                return;
            }

            if (isNew) {
                isNew = false;
                promptEditor.querySelector(".edit-actions").innerHTML = renderButtons(false);
                setupListeners(); // Re-bind new buttons
            }

            promptEditor.classList.add("is-saved");
            saveFolders();
        };

        // Handle Copy
        promptEditor.querySelectorAll(".copy-prompt-btn").forEach(btn => {
            btn.onclick = (e) => {
                const body = promptEditor.querySelector(".prompt-body").value;
                navigator.clipboard.writeText(body).then(() => {
                    const originalText = e.target.textContent;
                    e.target.textContent = "Copied!";
                    setTimeout(() => e.target.textContent = originalText, 2000);
                });
            };
        });

        // Handle Delete
        promptEditor.querySelector(".delete-prompt-btn").onclick = () => {
            promptEditor.remove();
            saveFolders();
        };
    };

    promptEditor.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("drag-handle")) {
            promptEditor.setAttribute("draggable", "true");
        } else {
            promptEditor.setAttribute("draggable", "false");
        }
    });

    container.appendChild(promptEditor);
    setupPromptDragListeners(container);
    setupListeners();

    // Title click to edit
    promptEditor.querySelector(".prompt-title").addEventListener("click", (e) => {
        document.querySelectorAll(".prompt-editor:not(.is-saved)").forEach(openPrompt => {
            if (openPrompt !== promptEditor && openPrompt.querySelector(".prompt-title").value.trim() !== "") {
                openPrompt.classList.add("is-saved");
            }
        });
        promptEditor.classList.remove("is-saved");
        e.stopPropagation();
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

// --- DRAG HANDLERS (FOLDERS) ---
mainListView.addEventListener("dragstart", (e) => {
    if (searchInput.value.trim() !== "") {
        e.preventDefault();
        return;
    }

    const targetFolder = e.target.closest(".folder");
    if (!targetFolder || e.target.closest(".prompt-editor")) return;
    targetFolder.classList.add("dragging");
    e.dataTransfer.setData("text/plain", ""); 
});

mainListView.addEventListener('dragend', (e) => {
    const targetFolder = e.target.closest('.folder');
    if (targetFolder) targetFolder.classList.remove('dragging');
    saveFolders(); 
});

mainListView.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    const draggingFolder = document.querySelector('.dragging');
    if (!draggingFolder) return;
    const afterElement = getDragAfterElement(mainListView, e.clientY, '.folder');
    if (afterElement == null) mainListView.appendChild(draggingFolder);
    else mainListView.insertBefore(draggingFolder, afterElement);
});

// --- DRAG HANDLERS (PROMPTS) ---
function setupPromptDragListeners(container) {
    container.addEventListener("dragstart", (e) => {
        if (searchInput.value.trim() !== "") {
            e.preventDefault();
            return;
        }
        
        const targetPrompt = e.target.closest(".prompt-editor");
        if (!targetPrompt) return;
        targetPrompt.classList.add("dragging-prompt");
        e.dataTransfer.setData("text/plain", ""); 
        e.stopPropagation(); 
    });
    container.addEventListener("dragend", (e) => {
        const targetPrompt = e.target.closest(".prompt-editor");
        if (targetPrompt) targetPrompt.classList.remove("dragging-prompt");
        saveFolders(); 
    });
    container.addEventListener("dragover", (e) => {
        e.preventDefault();
        const draggingPrompt = document.querySelector(".dragging-prompt");
        if (!draggingPrompt) return;
        const afterElement = getDragAfterElement(container, e.clientY, ".prompt-editor");
        if (afterElement == null) container.appendChild(draggingPrompt);
        else container.insertBefore(draggingPrompt, afterElement);
    });
}

function getDragAfterElement(container, y, selector) {
    const draggableElements = [...container.querySelectorAll(`${selector}:not(.dragging):not(.dragging-prompt)`)];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- SEARCH FUNCTIONALITY ---
const searchInput = document.getElementById("search-prompts");

searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const folders = document.querySelectorAll(".folder");

    folders.forEach(folder => {
        const prompts = folder.querySelectorAll(".prompt-editor");
        let folderHasMatch = false;

        prompts.forEach(prompt => {
            const titleInput = prompt.querySelector(".prompt-title");
            const titleText = titleInput ? titleInput.value.toLowerCase() : "";
            
            // If query is empty, show everything.
            // If title contains query, show the prompt.
            if (query === "" || titleText.includes(query)) {
                prompt.style.display = "block";
                if (query !== "") folderHasMatch = true; 
            } else {
                prompt.style.display = "none";
            }
        });

        // 1. Show the folder if we aren't searching OR if it has a match
        const showFolder = query === "" || folderHasMatch;
        folder.style.display = showFolder ? "block" : "none";

        // 2. Visual Polish: Auto-expand and update icons during search
        if (query !== "" && folderHasMatch) {
            folder.classList.add("is-open");
            const icon = folder.querySelector(".icon");
            if (icon) icon.textContent = "▼";
        } 
        // 3. Reset state when search is cleared
        else if (query === "") {
            folder.classList.remove("is-open");
            const icon = folder.querySelector(".icon");
            if (icon) icon.textContent = "▶";
        }
    });
});