chrome.runtime.onInstalled.addListener(() => {
  // Chrome 114+ 에서만 동작
  if (chrome.sidePanel) {
    // [1] 확장 아이콘을 클릭했을 때 사이드 패널을 열도록 설정
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

    // [2] 실제로 사이드 패널로 표시할 페이지, 아이콘, 활성화 여부 등을 설정
    chrome.sidePanel.setOptions({
      path: "views/main.html", // 사이드 패널로 띄울 페이지
      enabled: true,
      // panelId나 iconPath 등을 지정할 수도 있음 (옵션)
    });
  } else {
    console.log("Side Panel API not available in this browser/version.");
  }
});
