// The panel does all the work; the worker only opens it on toolbar click or shortcut.
chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
