// --- Chrome Logic ---
if (typeof chrome !== "undefined" && chrome.sidePanel) {
    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error(error));
}

// --- Firefox Logic ---
// In Firefox, we listen for the 'onClicked' event on the extension icon
// and manually tell the browser to open the sidebar.
if (typeof browser !== "undefined" && browser.sidebarAction) {
    browser.action.onClicked.addListener(() => {
        browser.sidebarAction.open();
    });
}