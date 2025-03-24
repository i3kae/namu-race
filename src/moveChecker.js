// 전역에서 게임 진행 상태를 캐싱 (storage에서 nowState를 가져옴)
let globalNowState = false;
chrome.storage.local.get({ nowState: false }, (data) => {
  globalNowState = data.nowState;
});
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.nowState) {
    globalNowState = changes.nowState.newValue;
  }
});

// XPath로 요소 찾기
function getElementByXpath(xPath) {
  return document.evaluate(xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// 지정된 XPath 영역에서 이동 가능한 경로들을 추출
function getMovablePathParser(xPath) {
  const parentElement = getElementByXpath(xPath);
  if (!parentElement) return [];
  const hrefs = Array.from(parentElement.querySelectorAll("[href]"))
    .map((el) => el.getAttribute("href"))
    .filter((href) => href && (href.startsWith("/w") || href.startsWith("#")));
  return [...new Set(hrefs)];
}

// 간단한 토스트 메시지 함수
function showToast(message) {
  const toast = document.createElement("div");
  toast.innerText = message;
  toast.style.position = "fixed";
  toast.style.bottom = "30px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  toast.style.color = "#fff";
  toast.style.padding = "12px 16px";
  toast.style.borderRadius = "4px";
  toast.style.fontSize = "14px";
  toast.style.zIndex = "9999";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s";
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
}

// 현재 등록된 클릭 이벤트 핸들러(중복 등록 방지용)
let currentClickHandler = null;

function checkMoveURL() {
  // 기존 이벤트 핸들러 제거
  if (currentClickHandler) {
    document.removeEventListener("click", currentClickHandler, true);
    currentClickHandler = null;
  }

  // 이동 가능한 경로 목록 (예시 XPath; 실제 나무위키 페이지 구조에 맞게 수정 필요)
  const validHrefs = getMovablePathParser('//*[@id="app"]/div[1]/div[2]/div/div[3]');
  console.log("이동 가능 경로 목록:", validHrefs);

  currentClickHandler = (event) => {
    const anchor = event.target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    // 만약 href가 "#"으로 시작하면 방문 기록에 추가하지 않고 그냥 통과
    if (href.startsWith("#")) return;

    // 게임 진행 중이 아니라면( nowState === false ) 이동 제한 없이 그냥 이동
    if (!globalNowState) {
      return;
    }

    // 게임 진행 중이라면 유효한 경로인지 검사
    if (!validHrefs.includes(href)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showToast("이동할 수 없는 경로입니다!");
    } else {
      // 절대 URL 생성
      const fullUrl = new URL(href, "https://namu.wiki").toString();
      const base = "https://namu.wiki/w/";
      let pageTitle = fullUrl;
      if (fullUrl.startsWith(base)) {
        // base 부분 제거 후 디코딩 (예: "%ED%95%9C%EA%B8%80" → "한글")
        const rawTitle = fullUrl.substring(base.length);
        pageTitle = decodeURIComponent(rawTitle);
      }

      // 방문 기록에 추가하기 전에, 이미 같은 URL이 있는지 체크
      chrome.storage.local.get({ visitedPages: [] }, (result) => {
        const visited = result.visitedPages;
        const alreadyExists = visited.some((item) => item.url === fullUrl);
        if (!alreadyExists) {
          visited.push({ title: pageTitle, url: fullUrl });
          chrome.storage.local.set({ visitedPages: visited });
        }
      });
    }
  };

  // 캡처링 단계에서 이벤트 등록 (빠른 처리 위해)
  document.addEventListener("click", currentClickHandler, true);
}

// MutationObserver를 이용해 DOM 변화가 있을 때마다 checkMoveURL() 재등록
const targetNode = document.querySelector("#app");
if (targetNode) {
  const observer = new MutationObserver(() => {
    checkMoveURL();
  });
  observer.observe(targetNode, { childList: true, subtree: true });
  checkMoveURL();
} else {
  console.error("#app 요소를 찾지 못했습니다.");
}
