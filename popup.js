let state = {
    folders: [],
    prompts: [],
    settings: { autoPaste: false, highlightPrompt: false, darkMode: true },
    expandedFolders: new Set()
};

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

function updateThemeUI() {
    document.body.classList.toggle('dark-mode', state.settings.darkMode);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = state.settings.darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function renderUI() {
    const listContainer = document.getElementById('combined-list');
    const folderSelect = document.getElementById('prompt-folder');
    listContainer.innerHTML = '';
    folderSelect.innerHTML = '<option value="0">Uncategorized</option>';

    // Sort folders and build dropdown
    state.folders.forEach(folder => {
        // Add to dropdown
        const opt = document.createElement('option');
        opt.value = folder.id;
        opt.textContent = folder.name;
        folderSelect.appendChild(opt);

        // Create Folder Row in UI
        const folderLi = document.createElement('li');
        folderLi.className = `list-item folder-row ${state.expandedFolders.has(folder.id.toString()) ? 'open' : ''}`;
        folderLi.innerHTML = `<span><span class="arrow">▶</span> 📁 ${folder.name}</span>`;
        
        folderLi.onclick = () => {
            const idStr = folder.id.toString();
            if (state.expandedFolders.has(idStr)) {
                state.expandedFolders.delete(idStr);
            } else {
                state.expandedFolders.add(idStr);
            }
            chrome.storage.local.set({ expandedFolders: Array.from(state.expandedFolders) });
            renderUI();
        };
        listContainer.appendChild(folderLi);

        // Create container for prompts in this folder
        const promptGroup = document.createElement('div');
        promptGroup.className = `prompt-group ${state.expandedFolders.has(folder.id.toString()) ? '' : 'hidden'}`;
        
        const folderPrompts = state.prompts.filter(p => p.folderId == folder.id);
        folderPrompts.forEach(prompt => {
            promptGroup.appendChild(createPromptEl(prompt, true));
        });
        listContainer.appendChild(promptGroup);
    });

    // Render Uncategorized
    const uncategorizedPrompts = state.prompts.filter(p => p.folderId == "0");
    if (uncategorizedPrompts.length > 0) {
        uncategorizedPrompts.forEach(p => listContainer.appendChild(createPromptEl(p, false)));
    }
}

function createPromptEl(prompt, isNested) {
    const li = document.createElement('li');
    li.className = `list-item ${isNested ? 'nested-prompt' : ''}`;
    li.innerHTML = `<span>📄 ${prompt.title}</span><button class="copy-btn">Copy</button>`;
    
    li.querySelector('.copy-btn').onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(prompt.body);
    };
    return li;
}

function initEventListeners() {
    const folderModal = document.getElementById('folder-modal');
    const promptModal = document.getElementById('prompt-modal');

    document.getElementById('theme-toggle-btn').onclick = () => {
        state.settings.darkMode = !state.settings.darkMode;
        chrome.storage.local.set({ settings: state.settings });
        updateThemeUI();
    };

    document.getElementById('add-folder-btn').onclick = () => folderModal.showModal();
    document.getElementById('open-prompt-modal-btn').onclick = () => promptModal.showModal();
    document.getElementById('cancel-folder-btn').onclick = () => folderModal.close();
    document.getElementById('cancel-prompt-btn').onclick = () => promptModal.close();

    document.getElementById('folder-form').onsubmit = async (e) => {
        e.preventDefault();
        state.folders.push({ id: Date.now(), name: document.getElementById('folder-name').value });
        await chrome.storage.local.set({ folders: state.folders });
        e.target.reset();
        folderModal.close();
        renderUI();
    };

    document.getElementById('prompt-form').onsubmit = async (e) => {
        e.preventDefault();
        state.prompts.push({
            id: Date.now(),
            title: document.getElementById('prompt-title').value,
            folderId: document.getElementById('prompt-folder').value,
            body: document.getElementById('prompt-body').value
        });
        await chrome.storage.local.set({ prompts: state.prompts });
        e.target.reset();
        promptModal.close();
        renderUI();
    };
}