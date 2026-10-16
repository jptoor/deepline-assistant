// The panel does all the work. The worker opens it from the toolbar or Alt+Shift+D,
// and on first install opens Deepline sign-in so a rep is ready in one step.
import { DEFAULT_BASE_URL } from "../shared/deepline";

chrome.runtime.onInstalled.addListener((details) => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  if (details.reason === "install") void chrome.tabs.create({ url: `${DEFAULT_BASE_URL}/sign-in` });
});
