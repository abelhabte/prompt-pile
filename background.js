if (typeof chrome !== "undefined" && chrome.sidePanel) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
}

if (typeof browser !== "undefined" && browser.sidebarAction) {
  browser.action.onClicked.addListener(() => {
    browser.sidebarAction.open();
  });
}
