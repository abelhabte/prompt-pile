let state = {
    folders: [],
    prompts: [],
    settings: { autoPaste: false, highlightPrompt: false, darkMode: true },
    expandedFolders: new Set()
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await chrome.storage.local.get(['folders', 'prompts', 'settings', 'expandedFolders']);
        state.folders = data.folders || [];
        state.prompts = data.prompts || [];
        if (data.settings) state.settings = { ...state.settings, ...data.settings };
        if (data.expandedFolders) state.expandedFolders = new Set(data.expandedFolders);
    } catch (e) { console.error(e); }

    updateThemeUI();
    renderUI();
    initEventListeners();
});

function renderUI() {
    const listContainer = document.getElementById('combined-list');
    const folderSelect = document.getElementById('prompt-folder');
    if (!listContainer || !folderSelect) return;

    listContainer.innerHTML = '';
    folderSelect.innerHTML = '<option value="0">Uncategorized</option>';

    // 1. Render Folders and their Nested Prompts
    state.folders.forEach(folder => {
        // Update the prompt creation dropdown
        const opt = document.createElement('option');
        opt.value = folder.id;
        opt.textContent = folder.name;
        folderSelect.appendChild(opt);

        // Create the Folder Row
        const isOpen = state.expandedFolders.has(folder.id.toString());
        const folderLi = document.createElement('li');
        folderLi.className = `list-item folder-row ${isOpen ? 'open' : ''}`;
        folderLi.innerHTML = `
            <span><span class="arrow">▶</span> 📂 ${folder.name}</span>
        `;

        // Toggle Folder Logic
        folderLi.onclick = () => {
            const idStr = folder.id.toString();
            if (state.expandedFolders.has(idStr)) {
                state.expandedFolders.delete(idStr);
            } else {
                state.expandedFolders.add(idStr);
            }
            // Save expansion state so it persists
            chrome.storage.local.set({ expandedFolders: Array.from(state.expandedFolders) });
            renderUI();
        };

        listContainer.appendChild(folderLi);

        // If folder is open, render its prompts immediately below
        if (isOpen) {
            const nestedPrompts = state.prompts.filter(p => p.folderId == folder.id);
            nestedPrompts.forEach(prompt => {
                const promptLi = createPromptElement(prompt, true);
                listContainer.appendChild(promptLi);
            });
        }
    });

    // 2. Render Uncategorized Prompts
    const uncategorized = state.prompts.filter(p => p.folderId == "0" || !p.folderId);
    if (uncategorized.length > 0) {
        const header = document.createElement('li');
        header.className = 'section-header';
        header.textContent = 'Uncategorized';
        listContainer.appendChild(header);

        uncategorized.forEach(prompt => {
            listContainer.appendChild(createPromptElement(prompt, false));
        });
    }
}

function createPromptElement(prompt, isNested) {
    const li = document.createElement('li');
    li.className = `list-item ${isNested ? 'nested-prompt' : ''}`;
    li.innerHTML = `
        <span>📄 ${prompt.title}</span>
        <button class="copy-btn">Copy</button>
    `;
    
    li.querySelector('.copy-btn').onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(prompt.body);
    };
    return li;
}

function initEventListeners() {
    const folderModal = document.getElementById('folder-modal');
    const promptModal = document.getElementById('prompt-modal');

    // Modal Controls
    document.getElementById('add-folder-btn').onclick = () => folderModal.showModal();
    document.getElementById('open-prompt-modal-btn').onclick = () => promptModal.showModal();
    document.getElementById('cancel-folder-btn').onclick = () => folderModal.close();
    document.getElementById('cancel-prompt-btn').onclick = () => promptModal.close();

    // Folder Submission
    document.getElementById('folder-form').onsubmit = async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('folder-name');
        state.folders.push({ id: Date.now(), name: nameInput.value });
        await chrome.storage.local.set({ folders: state.folders });
        e.target.reset();
        folderModal.close();
        renderUI();
    };

    // Prompt Submission
    document.getElementById('prompt-form').onsubmit = async (e) => {
        e.preventDefault();
        const newPrompt = {
            id: Date.now(),
            title: document.getElementById('prompt-title').value,
            folderId: document.getElementById('prompt-folder').value,
            body: document.getElementById('prompt-body').value
        };
        state.prompts.push(newPrompt);
        await chrome.storage.local.set({ prompts: state.prompts });
        
        // Auto-expand the folder so the user sees the new prompt
        if (newPrompt.folderId !== "0") {
            state.expandedFolders.add(newPrompt.folderId.toString());
            await chrome.storage.local.set({ expandedFolders: Array.from(state.expandedFolders) });
        }

        e.target.reset();
        promptModal.close();
        renderUI();
    };
}

function updateThemeUI() {
    document.body.classList.toggle('dark-mode', state.settings.darkMode);
}