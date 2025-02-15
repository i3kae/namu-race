console.log("TEST");

document.getElementById("randomBtn").addEventListener("click", function () {
  // randomPlay.js 실행
  chrome.runtime.sendMessage({ action: "scripts/runRandomPlay.js" });
});

document.getElementById("choiceBtn").addEventListener("click", function () {
  // choicePlay.js 실행
  chrome.runtime.sendMessage({ action: "scripts/runChoicePlay.js" });
});
