chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    // 필요하다면 setOptions 등 추가
  } else {
    console.log("Side Panel API not available in this browser/version.");
  }
});
