const addFolderBtn = document.getElementById("add-folder-btn");
const mainListView = document.getElementById("main-list-view");
const combinedList = document.getElementById("combined-list");
const searchInput = document.getElementById("search-prompts");

// --- INITIALIZATION ---
addFolderBtn.addEventListener("click", () => createFolderElement());
loadFolders();

// --- CORE FOLDER CREATION ---
function createFolderElement(existingName = null, existingPrompts = [], isImport = false) {
    const folder = document.createElement("div");
    folder.className = 'folder';
    folder.setAttribute("draggable", "true");

    if (!existingName) {
        folder.innerHTML = `
            <div class="folder-header">
                <span class="drag-handle">⠿</span>
                <span class="icon">▶</span>
                <input type="text" class="folder-input" placeholder="Folder Name..." />
                <div class="creation-actions">
                    <button class="cancel-folder-btn secondary-btn">Cancel</button>
                    <button class="confirm-folder-btn secondary-btn">+ Folder</button>
                </div>
            </div>
        `;

        const initialInput = folder.querySelector('.folder-input');
        const confirmBtn = folder.querySelector('.confirm-folder-btn');
        const cancelBtn = folder.querySelector('.cancel-folder-btn');

        if (initialInput) {
            initialInput.focus();

            const finalizeFolder = () => {
                const name = initialInput.value.trim() || "Untitled Folder";
                renderFolderStatic(folder, name);
                saveFolders();
            };

            confirmBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                finalizeFolder();
            });

            cancelBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                folder.remove();
            });

            initialInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") finalizeFolder();
                if (e.key === "Escape") folder.remove();
            });
        }
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

    if (!existingName || isImport) {
        combinedList.prepend(folder);
    } else {
        combinedList.appendChild(folder);
    }

    folder.addEventListener("click", (e) => {
        const isHeaderClick = e.target.closest(".folder-header");
        const isActionButton = e.target.classList.contains("three-dot-btn") || e.target.classList.contains("action-btn") || e.target.closest(".creation-actions");
        const isInput = e.target.tagName === "INPUT";

        if (isHeaderClick && !isActionButton && !isInput) {
            folder.classList.toggle("is-open");
            const icon = folder.querySelector(".icon");
            if (icon) {
                icon.textContent = folder.classList.contains("is-open") ? "▼" : "▶";
            }
        }

        if (e.target.classList.contains("three-dot-btn")) {
            const header = e.target.closest(".folder-header");
            const existingMenu = header.querySelector(".folder-options-menu");

            if (existingMenu) {
                existingMenu.remove();
                return;
            }

            const openMenu = document.querySelector(".folder-options-menu");
            if (openMenu) openMenu.remove();

            const menu = document.createElement("div");
            menu.className = "folder-options-menu";
            menu.innerHTML = `
                <button class="action-btn">+ Prompt</button>
                <button class="action-btn">Rename Folder</button>
                <button class="action-btn">Delete Folder</button>
            `;

            header.appendChild(menu);

            const menuRect = menu.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            if (menuRect.bottom > windowHeight) {
                menu.classList.add("spawn-above");
            }
        }

        if (e.target.textContent === "Delete Folder") {
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
                <div class="creation-actions">
                    <button class="cancel-rename-btn secondary-btn">Cancel</button>
                    <button class="confirm-rename-btn secondary-btn">Save</button>
                </div>
            `;
            const renameInput = header.querySelector(".folder-input");
            const confirmRenameBtn = header.querySelector(".confirm-rename-btn");
            const cancelRenameBtn = header.querySelector(".cancel-rename-btn");

            renameInput.focus();
            renameInput.select();

            const finalizeRename = () => {
                const newName = renameInput.value.trim() || currentName;
                renderFolderStatic(folder, newName);
                saveFolders();
            };

            confirmRenameBtn.addEventListener("click", (ev) => {
                ev.stopPropagation();
                finalizeRename();
            });

            cancelRenameBtn.addEventListener("click", (ev) => {
                ev.stopPropagation();
                renderFolderStatic(folder, currentName);
            });

            renameInput.addEventListener("keydown", (keyEvent) => {
                if (keyEvent.key === "Enter") finalizeRename();
                if (keyEvent.key === "Escape") renderFolderStatic(folder, currentName);
            });
        }

        if (e.target.classList.contains("action-btn") && e.target.textContent === "+ Prompt") {
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
        ? `<button class="cancel-new-btn secondary-btn">Cancel</button>
           <button class="save-prompt-btn">+ Prompt</button>`
        : `<button class="cancel-edit-btn secondary-btn">Cancel</button>
           <button class="copy-prompt-btn secondary-btn">Copy</button>
           <button class="save-prompt-btn">Save</button>`;
    };

    promptEditor.innerHTML = `
        <div class="prompt-header-row">
            <span class="drag-handle">⠿</span>
            <input type="text" class="prompt-title" placeholder="Prompt Title" value="${data.title}">
            <select class="prompt-category">
                <option value="ChatGPT" ${data.category === 'ChatGPT' ? 'selected' : ''}>ChatGPT</option>
                <option value="Claude" ${data.category === 'Claude' ? 'selected' : ''}>Claude</option>
                <option value="Copilot" ${data.category === 'Copilot' ? 'selected' : ''}>Copilot</option>
                <option value="DeepSeek" ${data.category === 'DeepSeek' ? 'selected' : ''}>DeepSeek</option>
                <option value="Gemini" ${data.category === 'Gemini' ? 'selected' : ''}>Gemini</option>
                <option value="Grok" ${data.category === 'Grok' ? 'selected' : ''}>Grok</option>
                <option value="Meta AI" ${data.category === 'Meta AI' ? 'selected' : ''}>Meta AI</option>
                <option value="Perplexity" ${data.category === 'Perplexity' ? 'selected' : ''}>Perplexity</option>
            </select>
            <div class="saved-actions">
                <button class="copy-prompt-btn secondary-btn">Copy</button>
                <button class="delete-prompt-btn secondary-btn">Delete</button>
            </div>
        </div>
        <textarea class="prompt-body" placeholder="Write your prompt here...">${data.body}</textarea>
        <div class="edit-actions">${renderButtons(isNew)}</div>
    `;

    const setupListeners = () => {
        let originalData = {
            title: promptEditor.querySelector(".prompt-title").value,
            category: promptEditor.querySelector(".prompt-category").value,
            body: promptEditor.querySelector(".prompt-body").value
        };

        const titleInput = promptEditor.querySelector(".prompt-title");

        titleInput.addEventListener("mouseenter", () => {
            if (promptEditor.classList.contains("is-saved") && titleInput.scrollWidth > titleInput.clientWidth) {
                titleInput.title = titleInput.value;
            } else {
                titleInput.title = "";
            }
        });

        const cancelNew = promptEditor.querySelector(".cancel-new-btn");
        const cancelEdit = promptEditor.querySelector(".cancel-edit-btn");

        if (cancelNew) cancelNew.onclick = () => promptEditor.remove();

        if (cancelEdit) {
            cancelEdit.onclick = () => {
                promptEditor.querySelector(".prompt-title").value = originalData.title;
                promptEditor.querySelector(".prompt-category").value = originalData.category;
                promptEditor.querySelector(".prompt-body").value = originalData.body;
                promptEditor.classList.add("is-saved");
            };
        }

        promptEditor.querySelector(".save-prompt-btn").onclick = (e) => {
            e.stopPropagation(); 
            const currentTitle = promptEditor.querySelector(".prompt-title").value;
            if (!currentTitle) {
                alert("Please enter a title!");
                return;
            }

            originalData = {
                title: currentTitle,
                category: promptEditor.querySelector(".prompt-category").value,
                body: promptEditor.querySelector(".prompt-body").value
            };

            if (isNew) {
                isNew = false;
                promptEditor.querySelector(".edit-actions").innerHTML = renderButtons(false);
                setupListeners(); 
            }

            promptEditor.classList.add("is-saved");
            saveFolders(); 
        };

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

    if (isNew) {
        container.prepend(promptEditor);
    } else {
        container.appendChild(promptEditor);
    }

    setupPromptDragListeners(container);
    setupListeners();

    promptEditor.querySelector(".prompt-title").addEventListener("click", (e) => {
        if (promptEditor.classList.contains("is-saved")) {
            promptEditor.classList.remove("is-saved");
        }
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
        <button class="three-dot-btn">⋮</button>
    `;
    
    const nameSpan = header.querySelector(".folder-name");
    nameSpan.addEventListener("mouseenter", () => {
        if (nameSpan.scrollWidth > nameSpan.clientWidth) {
            nameSpan.title = name;
        } else {
            nameSpan.title = "";
        }
    });

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
            el.querySelectorAll(".prompt-editor.is-saved").forEach(p => {
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

// --- DRAG HANDLERS ---
function getDragAfterElement(container, y, selector) {
    const draggableElements = [...container.querySelectorAll(`${selector}:not(.dragging):not(.dragging-prompt)`)];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

combinedList.addEventListener("dragstart", (e) => {
    if (searchInput.value.trim() !== "") { e.preventDefault(); return; }
    const targetFolder = e.target.closest(".folder");
    if (!targetFolder || e.target.closest(".prompt-editor")) return;
    targetFolder.classList.add("dragging");
    e.dataTransfer.setData("text/plain", ""); 
});

combinedList.addEventListener('dragend', (e) => {
    const targetFolder = e.target.closest('.folder');
    if (targetFolder) targetFolder.classList.remove('dragging');
    saveFolders(); 
});

combinedList.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    const draggingFolder = document.querySelector('.dragging');
    if (!draggingFolder) return;
    
    const afterElement = getDragAfterElement(combinedList, e.clientY, '.folder');
    if (afterElement == null) {
        combinedList.appendChild(draggingFolder);
    } else {
        combinedList.insertBefore(draggingFolder, afterElement);
    }
});

function setupPromptDragListeners(container) {
    container.addEventListener("dragstart", (e) => {
        if (searchInput.value.trim() !== "") { e.preventDefault(); return; }
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

// --- SEARCH FUNCTIONALITY ---
searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const folders = document.querySelectorAll(".folder");
    folders.forEach(folder => {
        const prompts = folder.querySelectorAll(".prompt-editor");
        let folderHasMatch = false;
        prompts.forEach(prompt => {
            const titleText = prompt.querySelector(".prompt-title").value.toLowerCase();
            if (query === "" || titleText.includes(query)) {
                prompt.style.display = "block";
                if (query !== "") folderHasMatch = true; 
            } else { prompt.style.display = "none"; }
        });
        folder.style.display = (query === "" || folderHasMatch) ? "block" : "none";
        if (query !== "" && folderHasMatch) {
            folder.classList.add("is-open");
            const icon = folder.querySelector(".icon");
            if (icon) icon.textContent = "▼";
        } else if (query === "") {
            folder.classList.remove("is-open");
            const icon = folder.querySelector(".icon");
            if (icon) icon.textContent = "▶";
        }
    });
});

// --- EXPORT/IMPORT ---
const exportBtn = document.getElementById("export-btn");
exportBtn.addEventListener("click", async () => {
    const savedData = JSON.parse(localStorage.getItem("myFolders") || "[]");
    if (savedData.length === 0) { alert("No prompts found!"); return; }
    const zip = new JSZip();
    const rootFolder = zip.folder("Prompt_Pile_Export");
    savedData.forEach(folderData => {
        const folder = rootFolder.folder(folderData.name.replace(/[/\\?%*:|"<>]/g, '-'));
        folderData.prompts.forEach((prompt, index) => {
            const content = JSON.stringify(prompt, null, 4);
            const fileName = `${prompt.title.replace(/[/\\?%*:|"<>]/g, '-') || 'prompt_' + index}.json`;
            folder.file(fileName, content);
        });
    });
    zip.generateAsync({ type: "blob" }).then((content) => {
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url; a.download = "Prompt_Pile_Export.zip";
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 0);
    });
});

const importBtn = document.getElementById("import-btn");
importBtn.addEventListener("click", () => {
    const input = document.createElement('input');
    input.type = 'file'; input.webkitdirectory = true;
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        const folderMap = {};
        for (const file of files) {
            if (file.name.endsWith('.json')) {
                const pathParts = file.webkitRelativePath.split('/');
                const folderName = pathParts.length > 2 ? pathParts[pathParts.length - 2] : pathParts[0];
                const text = await file.text();
                try {
                    const json = JSON.parse(text);
                    if (!folderMap[folderName]) folderMap[folderName] = [];
                    folderMap[folderName].push(json);
                } catch (err) {}
            }
        }
        Object.keys(folderMap).reverse().forEach(name => {
            createFolderElement(name, folderMap[name], true);
        });
        saveFolders();
    };
    input.click();
});

// --- THEME TOGGLE LOGIC ---
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const lightStyle = document.getElementById("light-theme");
const darkStyle = document.getElementById("dark-theme");

function setDarkMode(isDark) {
    if (isDark) {
        lightStyle.disabled = true;
        darkStyle.disabled = false;
        themeIcon.src = "../icons/logo_white.png";
        localStorage.setItem("theme", "dark");
    } else {
        lightStyle.disabled = false;
        darkStyle.disabled = true;
        themeIcon.src = "../icons/logo_black.png";
        localStorage.setItem("theme", "light");
    }
}

const savedTheme = localStorage.getItem("theme");
setDarkMode(savedTheme === "dark");

themeToggle.addEventListener("click", () => {
    const isCurrentlyDark = !darkStyle.disabled;
    setDarkMode(!isCurrentlyDark);
});