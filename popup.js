const addFolderBtn = document.getElementById("add-folder-btn");
const mainListView = document.getElementById("main-list-view");
const combinedList = document.getElementById("combined-list");
const searchInput = document.getElementById("search-prompts");

const modelIcons = {
  ChatGPT: "icons/chatgpt.svg",
  Claude: "icons/claude.svg",
  Copilot: "icons/copilot.svg",
  DeepSeek: "icons/deepseek.svg",
  Gemini: "icons/gemini.svg",
  Grok: "icons/grok.svg",
  HuggingChat: "icons/huggingchat.svg",
  "Meta AI": "icons/metaai.svg",
  "Mistral AI": "icons/mistralai.svg",
  Perplexity: "icons/perplexity.svg",
};

addFolderBtn.addEventListener("click", () => createFolderElement());
loadFolders();
checkEmptyState();

function closeAllMenus() {
  document
    .querySelectorAll(".folder-options-menu")
    .forEach((menu) => menu.remove());

  document
    .querySelectorAll(".custom-model-select.active")
    .forEach((s) => s.classList.remove("active"));
}

function createFolderElement(
  existingName = null,
  existingPrompts = [],
  isImport = false,
) {
  const folder = document.createElement("div");
  folder.className = "folder";
  folder.setAttribute("draggable", "true");

  if (!existingName) {
    folder.innerHTML = `
            <div class="folder-header">
                <span class="drag-handle">⠿</span>
                <span class="icon">
                    <img src="icons/triangle_right.svg" class="arrow-icon" alt="toggle">
                </span>
                <input type="text" class="folder-input" placeholder="Folder Name..." />
                <div class="creation-actions">
                    <button class="cancel-folder-btn secondary-btn" title="Cancel"><img src="icons/cancel.svg" class="btn-icon" alt="Cancel"></button>
                    <button class="confirm-folder-btn secondary-btn" title="+ Folder"><img src="icons/add.svg" class="btn-icon" alt="+ Folder"></button>
                </div>
            </div>
        `;

    const initialInput = folder.querySelector(".folder-input");
    const confirmBtn = folder.querySelector(".confirm-folder-btn");
    const cancelBtn = folder.querySelector(".cancel-folder-btn");

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
        checkEmptyState();
      });

      initialInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") finalizeFolder();
        if (e.key === "Escape") folder.remove();
      });
    }
  } else {
    renderFolderStatic(folder, existingName);
    const list = folder.querySelector(".prompts-list");
    existingPrompts.forEach((p) => addPromptToUI(list, p));
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

  checkEmptyState();

  folder.addEventListener("click", (e) => {
    const isHeaderClick = e.target.closest(".folder-header");
    const isActionButton =
      e.target.classList.contains("three-dot-btn") ||
      e.target.classList.contains("action-btn") ||
      e.target.closest(".creation-actions");
    const isInput = e.target.tagName === "INPUT";

    if (isHeaderClick && !isActionButton && !isInput) {
      folder.classList.toggle("is-open");
      const iconImg = folder.querySelector(".arrow-icon");
      if (iconImg) {
        iconImg.src = folder.classList.contains("is-open")
          ? "icons/triangle_down.svg"
          : "icons/triangle_right.svg";
      }
    }

    if (e.target.classList.contains("three-dot-btn")) {
      const header = e.target.closest(".folder-header");
      const existingMenu = header.querySelector(".folder-options-menu");

      if (existingMenu) {
        existingMenu.remove();
        return;
      }

      closeAllMenus();

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
      checkEmptyState();
    }

    if (e.target.textContent === "Rename Folder") {
      const nameSpan = folder.querySelector(".folder-name");
      const currentName = nameSpan.textContent;
      const header = folder.querySelector(".folder-header");
      header.innerHTML = `
                <span class="drag-handle">⠿</span>
                <span class="icon">
                    <img src="icons/triangle_right.svg" class="arrow-icon">
                </span>
                <input type="text" class="folder-input" value="${currentName}"/>
                <div class="creation-actions">
                    <button class="cancel-rename-btn secondary-btn" title="Cancel"><img src="icons/cancel.svg" class="btn-icon" alt="Cancel"></button>
                    <button class="confirm-rename-btn secondary-btn" title="Save"><img src="icons/check_mark.svg" class="btn-icon" alt="Check Mark"></button>
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

    if (
      e.target.classList.contains("action-btn") &&
      e.target.textContent === "+ Prompt"
    ) {
      folder.classList.add("is-open");
      const iconImg = folder.querySelector(".arrow-icon");
      if (iconImg) iconImg.src = "icons/triangle_down.svg";

      const list = folder.querySelector(".prompts-list");
      if (list) {
        addPromptToUI(list, { title: "", model: "ChatGPT", text: "" }, true);
      }
      const menu = folder.querySelector(".folder-options-menu");
      if (menu) menu.remove();
    }
  });
}

function addPromptToUI(
  container,
  data = { title: "", model: "ChatGPT", text: "" },
  isNew = false,
) {
  const promptEditor = document.createElement("div");
  promptEditor.className = data.title
    ? "prompt-editor is-saved"
    : "prompt-editor";
  promptEditor.setAttribute("draggable", "true");

  const renderButtons = (isNewStatus) => {
    return isNewStatus
      ? `<button class="cancel-new-btn secondary-btn">Cancel</button>
           <button class="save-prompt-btn">+ Prompt</button>`
      : `<button class="cancel-edit-btn secondary-btn">Cancel</button>
           <button class="copy-prompt-btn secondary-btn">Copy</button>
           <button class="save-prompt-btn">Save</button>`;
  };

  const iconPath = modelIcons[data.model] || modelIcons["Default"];

  promptEditor.innerHTML = `
        <div class="prompt-header-row">
            <span class="drag-handle">⠿</span>
            <input type="text" class="prompt-title" placeholder="Prompt Title" value="${data.title}">
            
            <div class="custom-model-select" data-model="${data.model}">
                <div class="selected-display">
                    <img src="${iconPath}" class="model-icon" alt="${data.model}">
                </div>
                <div class="model-options-dropdown">
                    ${Object.entries(modelIcons)
                      .filter(([key]) => key !== "Default")
                      .map(
                        ([model, path]) => `
                        <div class="model-opt" data-value="${model}">
                            <img src="${path}" class="model-icon">
                            <span>${model}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>

            <div class="saved-actions">
                <button class="copy-prompt-btn secondary-btn" title="Copy"><img src="icons/copy.svg" class="btn-icon" alt="Copy"></button>
                <button class="move-prompt-btn secondary-btn" title="Move"><img src="icons/move.svg" class="btn-icon" alt="Move"></button>
                <button class="delete-prompt-btn secondary-btn" title="Delete"><img src="icons/delete.svg" class="btn-icon" alt="Delete"></button>
            </div>
        </div>
        <textarea class="prompt-text" placeholder="Paste your prompt here...">${data.text}</textarea>
        <div class="edit-actions">${renderButtons(isNew)}</div>
    `;

  const customSelect = promptEditor.querySelector(".custom-model-select");
  const display = customSelect.querySelector(".selected-display");

  display.onclick = (e) => {
    e.stopPropagation();

    if (promptEditor.classList.contains("is-saved")) {
      return;
    }

    const isActive = customSelect.classList.contains("active");

    closeAllMenus();

    if (!isActive) {
      customSelect.classList.add("active");
    }
  };

  customSelect.querySelectorAll(".model-opt").forEach((opt) => {
    opt.onclick = (e) => {
      e.stopPropagation();
      const val = opt.getAttribute("data-value");
      customSelect.setAttribute("data-model", val);
      display.querySelector("img").src = modelIcons[val];
      customSelect.classList.remove("active");
      if (promptEditor.classList.contains("is-saved")) {
        saveFolders();
      }
    };
  });

  const setupListeners = () => {
    const customSelect = promptEditor.querySelector(".custom-model-select");

    let originalData = {
      title: promptEditor.querySelector(".prompt-title").value,
      model: customSelect.getAttribute("data-model"),
      text: promptEditor.querySelector(".prompt-text").value,
    };

    const titleInput = promptEditor.querySelector(".prompt-title");

    titleInput.addEventListener("mouseenter", () => {
      if (
        promptEditor.classList.contains("is-saved") &&
        titleInput.scrollWidth > titleInput.clientWidth
      ) {
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
        promptEditor.querySelector(".prompt-text").value = originalData.text;

        customSelect.setAttribute("data-model", originalData.model);
        customSelect.querySelector(".selected-display img").src =
          modelIcons[originalData.model] || modelIcons["Default"];

        promptEditor.classList.add("is-saved");
      };
    }

    promptEditor.querySelector(".save-prompt-btn").onclick = (e) => {
      const currentTitle = promptEditor.querySelector(".prompt-title").value;
      if (!currentTitle) {
        alert("Please enter a title!");
        return;
      }

      originalData = {
        title: currentTitle,
        model: customSelect.getAttribute("data-model"),
        text: promptEditor.querySelector(".prompt-text").value,
      };

      if (isNew) {
        isNew = false;
        promptEditor.querySelector(".edit-actions").innerHTML =
          renderButtons(false);
        setupListeners();
      }

      promptEditor.classList.add("is-saved");
      saveFolders();
    };

    promptEditor.querySelectorAll(".copy-prompt-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const text = promptEditor.querySelector(".prompt-text").value;

        const storage = document.createElement("pre");
        storage.style.position = "absolute";
        storage.style.left = "-9999px";
        storage.textContent = text;
        document.body.appendChild(storage);

        const range = document.createRange();
        range.selectNodeContents(storage);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            const iconImg = btn.querySelector(".btn-icon");

            if (iconImg) {
              const originalSrc = iconImg.src;

              iconImg.src = "icons/check_mark.svg";

              setTimeout(() => {
                iconImg.src = originalSrc;
              }, 1500);
            } else {
              btn.textContent = "Copied!";
              btn.classList.add("copy-success");

              setTimeout(() => {
                btn.textContent = "Copy";
                btn.classList.remove("copy-success");
              }, 1500);
            }
          }
        } catch (err) {
          console.error("Unable to copy", err);
        }

        selection.removeAllRanges();
        document.body.removeChild(storage);
      };
    });

    promptEditor.querySelector(".delete-prompt-btn").onclick = () => {
      promptEditor.remove();
      saveFolders();
    };

    promptEditor.querySelector(".move-prompt-btn").onclick = (e) => {
      e.stopPropagation();

      const existingMenu = promptEditor.querySelector(".move-prompt-menu");
      if (existingMenu) {
        existingMenu.remove();
        return;
      }

      closeAllMenus();

      const openMenu = document.querySelector(".move-prompt-menu");
      if (openMenu) openMenu.remove();

      const menu = document.createElement("div");
      menu.className = "move-prompt-menu folder-options-menu";

      const currentFolder = promptEditor.closest(".folder");
      const allFolders = document.querySelectorAll(".folder");

      allFolders.forEach((folder) => {
        const folderNameSpan = folder.querySelector(".folder-name");
        if (folderNameSpan && folder !== currentFolder) {
          const moveBtn = document.createElement("button");
          moveBtn.className = "action-btn";
          moveBtn.textContent = `${folderNameSpan.textContent}`;
          moveBtn.onclick = () => {
            const targetList = folder.querySelector(".prompts-list");
            if (targetList) {
              targetList.appendChild(promptEditor);
              menu.remove();
              saveFolders();
            }
          };
          menu.appendChild(moveBtn);
        }
      });

      if (menu.children.length === 0) {
        const noFolderMsg = document.createElement("div");
        noFolderMsg.className = "action-btn";
        noFolderMsg.style.pointerEvents = "none";
        noFolderMsg.textContent = "No other folders";
        menu.appendChild(noFolderMsg);
      }

      const btn = e.target.closest(".move-prompt-btn");
      btn.appendChild(menu);

      const menuRect = menu.getBoundingClientRect();
      if (menuRect.bottom > window.innerHeight) {
        menu.classList.add("spawn-above");
      }
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

  const isOpen = folderElement.classList.contains("is-open");
  const iconPath = isOpen
    ? "icons/triangle_down.svg"
    : "icons/triangle_right.svg";

  header.innerHTML = `
        <span class="drag-handle">⠿</span>
        <span class="icon">
            <img src="${iconPath}" class="arrow-icon" alt="toggle">
        </span>
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
  document.querySelectorAll(".folder").forEach((el) => {
    const nameSpan = el.querySelector(".folder-name");
    if (nameSpan) {
      const prompts = [];
      el.querySelectorAll(".prompt-editor.is-saved").forEach((p) => {
        prompts.push({
          title: p.querySelector(".prompt-title").value,
          model: p
            .querySelector(".custom-model-select")
            .getAttribute("data-model"),
          text: p.querySelector(".prompt-text").value,
        });
      });
      data.push({ name: nameSpan.textContent, prompts: prompts });
    }
  });
  localStorage.setItem("myFolders", JSON.stringify(data));
}

function loadFolders() {
  const saved = JSON.parse(localStorage.getItem("myFolders") || "[]");
  saved.forEach((f) => createFolderElement(f.name, f.prompts || []));
}

document.addEventListener("click", (e) => {
  const isThemeToggle = e.target.closest("#theme-toggle");
  if (isThemeToggle) {
    return;
  }
  const folderMenu = document.querySelector(
    ".folder-options-menu:not(.move-prompt-menu)",
  );
  if (
    folderMenu &&
    !e.target.classList.contains("three-dot-btn") &&
    !folderMenu.contains(e.target)
  ) {
    folderMenu.remove();
  }
  const moveMenu = document.querySelector(".move-prompt-menu");
  if (
    moveMenu &&
    !e.target.classList.contains("move-prompt-btn") &&
    !moveMenu.contains(e.target)
  ) {
    moveMenu.remove();
  }
  if (!e.target.closest(".custom-model-select")) {
    document
      .querySelectorAll(".custom-model-select.active")
      .forEach((s) => s.classList.remove("active"));
  }
});

function getDragAfterElement(container, y, selector) {
  const draggableElements = [
    ...container.querySelectorAll(
      `${selector}:not(.dragging):not(.dragging-prompt)`,
    ),
  ];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset)
        return { offset: offset, element: child };
      else return closest;
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

combinedList.addEventListener("dragstart", (e) => {
  if (searchInput.value.trim() !== "") {
    e.preventDefault();
    return;
  }
  const targetFolder = e.target.closest(".folder");
  if (!targetFolder || e.target.closest(".prompt-editor")) return;
  targetFolder.classList.add("dragging");
  e.dataTransfer.setData("text/plain", "");
});

combinedList.addEventListener("dragend", (e) => {
  const targetFolder = e.target.closest(".folder");
  if (targetFolder) targetFolder.classList.remove("dragging");
  saveFolders();
});

combinedList.addEventListener("dragover", (e) => {
  e.preventDefault();
  const draggingFolder = document.querySelector(".dragging");
  if (!draggingFolder) return;

  const afterElement = getDragAfterElement(combinedList, e.clientY, ".folder");
  if (afterElement == null) {
    combinedList.appendChild(draggingFolder);
  } else {
    combinedList.insertBefore(draggingFolder, afterElement);
  }
});

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
    const afterElement = getDragAfterElement(
      container,
      e.clientY,
      ".prompt-editor",
    );
    if (afterElement == null) container.appendChild(draggingPrompt);
    else container.insertBefore(draggingPrompt, afterElement);
  });
}

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  const folders = document.querySelectorAll(".folder");
  folders.forEach((folder) => {
    const prompts = folder.querySelectorAll(".prompt-editor");
    let folderHasMatch = false;
    prompts.forEach((prompt) => {
      const titleText = prompt
        .querySelector(".prompt-title")
        .value.toLowerCase();
      if (query === "" || titleText.includes(query)) {
        prompt.style.display = "block";
        if (query !== "") folderHasMatch = true;
      } else {
        prompt.style.display = "none";
      }
    });
    folder.style.display = query === "" || folderHasMatch ? "block" : "none";

    const iconImg = folder.querySelector(".arrow-icon");
    if (query !== "" && folderHasMatch) {
      folder.classList.add("is-open");
      if (iconImg) iconImg.src = "icons/triangle_down.svg";
    } else if (query === "") {
      folder.classList.remove("is-open");
      if (iconImg) iconImg.src = "icons/triangle_right.svg";
    }
  });
});

const exportBtn = document.getElementById("export-btn");
exportBtn.addEventListener("click", () => {
  const savedData = JSON.parse(localStorage.getItem("myFolders") || "[]");

  if (savedData.length === 0) {
    alert("No prompts found!");
    return;
  }

  let extensionVersion = "Testing";
  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.getManifest
  ) {
    extensionVersion = chrome.runtime.getManifest().version;
  }

  const now = new Date();
  const isoDate = now.toISOString();
  const dateStamp = isoDate.split("T")[0];

  const exportObject = {
    version: extensionVersion,
    date: isoDate,
    folders: savedData,
  };

  const blob = new Blob([JSON.stringify(exportObject, null, 4)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt_pile_backup_${dateStamp}.json`;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
});

const importBtn = document.getElementById("import-btn");
importBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedContent = JSON.parse(text);

      const folderData = importedContent.folders || importedContent;

      if (Array.isArray(folderData)) {
        folderData.reverse().forEach((folder) => {
          createFolderElement(folder.name, folder.prompts || [], true);
        });
        saveFolders();
        alert(
          `Imported successfully! (Exported on: ${importedContent.date || "Unknown Date"})`,
        );
      } else {
        alert("Invalid file format: Could not find folder list.");
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to parse the import file.");
    }
  };
  input.click();
});

const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const lightStyle = document.getElementById("light-theme");
const darkStyle = document.getElementById("dark-theme");

function setDarkMode(isDark) {
  if (isDark) {
    lightStyle.disabled = true;
    darkStyle.disabled = false;
    themeIcon.src = "icons/logo_white.png";
    localStorage.setItem("theme", "dark");
  } else {
    lightStyle.disabled = false;
    darkStyle.disabled = true;
    themeIcon.src = "icons/logo_black.png";
    localStorage.setItem("theme", "light");
  }
}

const savedTheme = localStorage.getItem("theme");
setDarkMode(savedTheme === "dark");

themeToggle.addEventListener("click", () => {
  const isCurrentlyDark = !darkStyle.disabled;
  setDarkMode(!isCurrentlyDark);
});

function checkEmptyState() {
  const list = document.getElementById("combined-list");
  const existingFolders = list.querySelectorAll(".folder");

  const existingMsg = list.querySelector(".empty-state");
  if (existingMsg) existingMsg.remove();

  if (existingFolders.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-state";
    emptyDiv.innerHTML = `
            <p>Pile is empty.</p>
            <span>Click <b>+ Folder</b> to start fresh or 
            <b>Import</b> a previous backup.</span>
        `;
    list.appendChild(emptyDiv);
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const savedTheme = localStorage.getItem("theme");
  setDarkMode(savedTheme === "dark");

  checkEmptyState();

  requestAnimationFrame(() => {
    document.getElementById("app-container").classList.add("ready");
  });
});
