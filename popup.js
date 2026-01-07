// --- Cross-Browser Storage Wrapper (Essential for Chrome/Firefox) ---
// This ensures that the code uses 'browser' (for Firefox) or 'chrome' (for Chrome) API.
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
const STORAGE_KEY = 'promptOrganizerData'; // Key for all your data (prompts & folders)
const THEME_KEY = 'promptOrganizerTheme'; // Key for theme setting

// --- DOM Elements ---
const body = document.body;
const themeToggleBtn = document.getElementById('theme-toggle-btn');

const promptModal = document.getElementById('prompt-modal');
const addPromptBtn = document.getElementById('add-prompt-btn');
const cancelPromptBtn = document.getElementById('cancel-prompt-btn');
const promptForm = document.getElementById('prompt-form');
const promptsList = document.getElementById('prompts-list');
const folderSelect = document.getElementById('prompt-folder');


// --- 1. State Management ---
let appData = {
    folders: [{ id: 0, name: 'Uncategorized' }], // Default folder
    prompts: []
};


// =================================================================
//                    THEME LOGIC
// =================================================================

async function loadTheme() {
    try {
        const result = await browserAPI.storage.local.get(THEME_KEY);
        const savedTheme = result[THEME_KEY] || 'light'; // Default to light

        setTheme(savedTheme);
    } catch (error) {
        console.error("Error loading theme:", error);
        setTheme('light'); // Fallback
    }
}

function setTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '☀️'; // Sun icon for light mode
    } else {
        body.classList.remove('dark-mode');
        themeToggleBtn.innerHTML = '🌙'; // Moon icon for dark mode
    }
}

async function toggleTheme() {
    const isDarkMode = body.classList.contains('dark-mode');
    const newTheme = isDarkMode ? 'light' : 'dark';

    setTheme(newTheme);

    // Save the new preference to storage
    try {
        await browserAPI.storage.local.set({ [THEME_KEY]: newTheme });
    } catch (error) {
        console.error("Error saving theme:", error);
    }
}

// Attach listener to the theme button
themeToggleBtn.addEventListener('click', toggleTheme);


// =================================================================
//                    DATA (PROMPT/FOLDER) LOGIC
// =================================================================

async function loadData() {
    try {
        const result = await browserAPI.storage.local.get(STORAGE_KEY);
        if (result[STORAGE_KEY]) {
            // Merge with default folders to ensure "Uncategorized" is always present if deleted
            const loadedData = result[STORAGE_KEY];
            appData.folders = loadedData.folders.length > 0 
                ? loadedData.folders 
                : [{ id: 0, name: 'Uncategorized' }];
            appData.prompts = loadedData.prompts || [];
        }
    } catch (error) {
        console.error("Error loading data:", error);
    }
    
    updateFolderDropdown();
    renderPrompts();
}

async function saveData() {
    try {
        await browserAPI.storage.local.set({ [STORAGE_KEY]: appData });
        console.log("Data saved successfully.");
    } catch (error) {
        console.error("Error saving data:", error);
    }
}

function updateFolderDropdown() {
    folderSelect.innerHTML = ''; 
    appData.folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name;
        folderSelect.appendChild(option);
    });
}

function renderPrompts() {
    promptsList.innerHTML = ''; 
    
    if (appData.prompts.length === 0) {
        promptsList.innerHTML = '<li class="placeholder-prompt">No prompts found. Click "Add New Prompt" to start!</li>';
        return;
    }

    appData.prompts.forEach(prompt => {
        const li = document.createElement('li');
        li.className = 'prompt-card';
        // Find the folder name for display
        const folderName = appData.folders.find(f => f.id === prompt.folderId)?.name || 'Unknown';

        li.innerHTML = `
            <h4>${prompt.title}</h4>
            <small>Folder: ${folderName}</small>
            <p>${prompt.body.substring(0, 120)}...</p>
        `;
        promptsList.appendChild(li);
    });
}


// --- Modal and Form Handlers ---

addPromptBtn.addEventListener('click', () => {
    promptForm.reset(); 
    promptModal.showModal();
});

cancelPromptBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    promptModal.close();
});

promptForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('prompt-title').value.trim();
    const body = document.getElementById('prompt-body').value.trim();
    const folderId = parseInt(document.getElementById('prompt-folder').value);
    
    const newPrompt = {
        id: Date.now(), 
        title: title,
        body: body,
        folderId: folderId,
        dateCreated: new Date().toISOString()
    };
    
    appData.prompts.push(newPrompt);
    
    saveData();
    renderPrompts(); // Refresh the list
    promptModal.close();
});


// --- Initialization ---
loadData(); // Load prompts and folders
loadTheme(); // Load the saved theme