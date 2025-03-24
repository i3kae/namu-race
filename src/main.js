document.addEventListener("DOMContentLoaded", () => {
  // (1) 초기 상태: nowState와 visitedPages 확인 후 UI 숨김
  chrome.storage.local.get({ nowState: false, visitedPages: [] }, (data) => {
    const topBanner = document.getElementById("topBanner");
    const visitedPaths = document.getElementById("visitedPaths");
    const visitedHeader = document.getElementById("visitedHeader");
    if (!data.nowState) {
      chrome.storage.local.set({ visitedPages: [] });
      if (visitedPaths) {
        visitedPaths.innerHTML = "";
        visitedPaths.style.display = "none";
      }
      if (visitedHeader) {
        visitedHeader.style.display = "none";
      }
      if (topBanner) {
        topBanner.style.display = "none";
      }
    } else {
      if (visitedPaths) visitedPaths.style.display = "block";
      if (visitedHeader) visitedHeader.style.display = "block";
      if (topBanner) topBanner.style.display = "flex";
      updateVisitedListUI(data.visitedPages);
      showEndGameButton();
    }
  });

  // (2) 방문 기록 UI 업데이트 (visitedPages: 객체 배열 [{ title, url }, ...])
  function updateVisitedListUI(visitedItems) {
    const logContainer = document.getElementById("visitedPaths");
    if (!logContainer) return;
    if (visitedItems.length === 0) {
      logContainer.innerHTML = "";
      logContainer.style.display = "none";
      return;
    }
    logContainer.style.display = "block";
    logContainer.innerHTML = "";
    visitedItems.forEach((item) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.textContent = item.title;
      btn.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.update(tabs[0].id, { url: item.url });
        });
      });
      li.appendChild(btn);
      logContainer.appendChild(li);
    });
  }

  // (3) 스토리지 변화 감지: visitedPages 및 nowState에 따른 UI 업데이트
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (changes.visitedPages) {
        updateVisitedListUI(changes.visitedPages.newValue);
      }
      if (changes.nowState) {
        const newState = changes.nowState.newValue;
        const topBanner = document.getElementById("topBanner");
        const visitedPaths = document.getElementById("visitedPaths");
        const visitedHeader = document.getElementById("visitedHeader");
        if (newState) {
          showEndGameButton();
          if (topBanner) topBanner.style.display = "flex";
          if (visitedPaths) visitedPaths.style.display = "block";
          if (visitedHeader) visitedHeader.style.display = "block";
        } else {
          hideEndGameButton();
          if (topBanner) topBanner.style.display = "none";
          if (visitedPaths) {
            visitedPaths.innerHTML = "";
            visitedPaths.style.display = "none";
          }
          if (visitedHeader) visitedHeader.style.display = "none";
        }
      }
    }
  });

  // (4) "스핀" 대신, 두 문서를 그대로 표시하는 함수
  function showDisplayAnimation(A, B) {
    // 오버레이 보이기
    showOverlay();
    // displayA와 displayB 요소에 각각 A, B 출력
    const displayA = document.getElementById("displayA");
    const displayB = document.getElementById("displayB");
    if (displayA) displayA.innerText = A;
    if (displayB) displayB.innerText = B;
    // 바로 카운트다운 시작
    startCountdown(() => {
      checkRaceClearAndProceed(A);
    });
  }

  function showOverlay() {
    const overlay = document.getElementById("overlay");
    if (!overlay) return;
    overlay.style.visibility = "visible";
    overlay.style.opacity = "1";
  }
  function closeOverlay() {
    const overlay = document.getElementById("overlay");
    if (!overlay) return;
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";
  }

  // (5) startCountdown: countdown 후 callback 실행
  function startCountdown(callback) {
    const textElem = document.getElementById("animationText");
    if (!textElem) return;
    const steps = ["3", "2", "1", "Go!"];
    let step = 0;
    const interval = setInterval(() => {
      textElem.innerText = steps[step];
      step++;
      if (step >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          closeOverlay();
          if (callback) callback();
        }, 500);
      }
    }, 1000);
  }

  // (6) checkRaceClearAndProceed: 현재 탭의 문서가 도착 문서와 동일하면 Race Clear, 아니면 시작 문서로 이동
  function checkRaceClearAndProceed(startDoc) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const base = "https://namu.wiki/w/";
      let currentUrl = tabs[0].url;
      let currentDoc = "";
      if (currentUrl && currentUrl.startsWith(base)) {
        currentDoc = decodeURIComponent(currentUrl.substring(base.length));
      }
      chrome.storage.local.get({ destination: "" }, (data) => {
        if (currentDoc === data.destination) {
          alert("Race Clear!");
          chrome.storage.local.set({ nowState: false });
        } else {
          const url = base + encodeURIComponent(startDoc);
          chrome.storage.local.set({ startDoc: startDoc }, () => {
            chrome.tabs.update(tabs[0].id, { url: url });
          });
        }
      });
    });
  }

  // (7) getRandomWikiTitles: RandomPage에서 XPath 영역의 <li> 텍스트들을 파싱하여 { A, B, items } 반환
  function getRandomWikiTitles() {
    return fetch("https://namu.wiki/RandomPage?namespace=%EB%AC%B8%EC%84%9C")
      .then((response) => response.text())
      .then((htmlString) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        const result = doc.evaluate(
          "//*[@id='app']/div[1]/div[2]/div/div[3]/article/div[3]/ul",
          doc,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        const ulElement = result.singleNodeValue;
        if (ulElement) {
          const items = Array.from(ulElement.querySelectorAll("li"))
            .map((li) => li.innerText.trim())
            .filter((text) => text);
          if (items.length > 0) {
            let randomIndexA = Math.floor(Math.random() * items.length);
            let randomIndexB = Math.floor(Math.random() * items.length);
            if (items.length > 1 && randomIndexB === randomIndexA) {
              randomIndexB = (randomIndexB + 1) % items.length;
            }
            const A = items[randomIndexA];
            const B = items[randomIndexB];
            chrome.storage.local.set({ destination: B });
            return { A, B, items };
          }
        }
        return { A: "기본A", B: "기본B", items: ["기본A", "기본B"] };
      })
      .catch((err) => {
        console.error(err);
        return { A: "기본A", B: "기본B", items: ["기본A", "기본B"] };
      });
  }

  // (8) 게임 종료 버튼 표시/숨김 함수
  function showEndGameButton() {
    const endGameBtn = document.getElementById("endGameBtn");
    if (endGameBtn) {
      endGameBtn.style.display = "inline-block";
    }
  }
  function hideEndGameButton() {
    const endGameBtn = document.getElementById("endGameBtn");
    if (endGameBtn) {
      endGameBtn.style.display = "none";
    }
  }

  // (9) 랜덤 모드 버튼 (게임 시작)
  const randomBtn = document.getElementById("randomBtn");
  randomBtn.addEventListener("click", () => {
    chrome.storage.local.set({ nowState: true, visitedPages: [] });
    const btnGroup = document.getElementById("btnGroup");
    if (btnGroup) {
      btnGroup.remove();
    }
    document.body.classList.remove("vertical-center");
    document.body.style.paddingLeft = "20px";
    const topBanner = document.getElementById("topBanner");
    if (topBanner) {
      topBanner.style.display = "flex";
    }
    const visitedPaths = document.getElementById("visitedPaths");
    if (visitedPaths) {
      visitedPaths.style.display = "block";
    }
    const visitedHeader = document.getElementById("visitedHeader");
    if (visitedHeader) {
      visitedHeader.style.display = "block";
    }
    getRandomWikiTitles().then(({ A, B, items }) => {
      const gameInfo = topBanner.querySelector(".gameInfo");
      gameInfo.textContent = `시작: ${A}, 도착: ${B}`;
      // 이제 룰렛 대신 두 문서를 그대로 표시하는 함수 호출
      showDisplayAnimation(A, B);
    });
    showEndGameButton();
  });

  // (10) 게임 종료 버튼 클릭 시 (게임 상태 초기화)
  const endGameBtn = document.getElementById("endGameBtn");
  endGameBtn.addEventListener("click", () => {
    chrome.storage.local.set({ nowState: false, visitedPages: [] }, () => {
      console.log("게임 종료: nowState=false, visitedPages=[]");
    });
    document.body.classList.add("vertical-center");
    document.body.style.paddingLeft = "0";
    const topBanner = document.getElementById("topBanner");
    if (topBanner) {
      topBanner.style.display = "none";
    }
    const visitedPaths = document.getElementById("visitedPaths");
    if (visitedPaths) {
      visitedPaths.innerHTML = "";
      visitedPaths.style.display = "none";
    }
    const visitedHeader = document.getElementById("visitedHeader");
    if (visitedHeader) {
      visitedHeader.style.display = "none";
    }
    hideEndGameButton();
    location.reload();
  });

  // (12) 선택 모드 버튼: 시작 문서와 도착 문서를 입력받아 게임 실행
  // (12) 선택 모드 버튼: 인풋 폼이 있는 모달을 띄워 사용자가 시작/도착 문서를 입력하도록 함.
  const choiceBtn = document.getElementById("choiceBtn");
  if (choiceBtn) {
    choiceBtn.addEventListener("click", () => {
      // 모달 창 표시
      const modal = document.getElementById("choiceModal");
      if (modal) {
        modal.style.display = "block";
      }
    });
  }

  // 모달 폼 제출 처리
  const choiceForm = document.getElementById("choiceForm");
  if (choiceForm) {
    choiceForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputStart = document.getElementById("startInput").value.trim();
      const inputDest = document.getElementById("destInput").value.trim();
      if (!inputStart || !inputDest) {
        alert("두 문서를 모두 입력하세요.");
        return;
      }
      // 저장: 도착 문서를 storage에 저장 (Race Clear 검사에 사용)
      chrome.storage.local.set({ destination: inputDest });
      // 게임 상태 시작 및 방문 기록 초기화
      chrome.storage.local.set({ nowState: true, visitedPages: [] });
      // 기존 버튼 그룹 제거
      const btnGroup = document.getElementById("btnGroup");
      if (btnGroup) {
        btnGroup.remove();
      }
      // 레이아웃 업데이트: 중앙 정렬 해제, 좌측 여백 적용
      document.body.classList.remove("vertical-center");
      document.body.style.paddingLeft = "20px";
      // 상단 배너 보이기 및 게임 정보 업데이트
      const topBanner = document.getElementById("topBanner");
      if (topBanner) {
        topBanner.style.display = "flex";
        const gameInfo = topBanner.querySelector(".gameInfo");
        if (gameInfo) {
          gameInfo.textContent = `시작: ${inputStart}, 도착: ${inputDest}`;
        }
      }
      // 방문 기록 영역 보이기
      const visitedPaths = document.getElementById("visitedPaths");
      if (visitedPaths) {
        visitedPaths.style.display = "block";
      }
      const visitedHeader = document.getElementById("visitedHeader");
      if (visitedHeader) {
        visitedHeader.style.display = "block";
      }
      // 모달 닫기
      const modal = document.getElementById("choiceModal");
      if (modal) {
        modal.style.display = "none";
      }
      // 시작 문서(inputStart)와 도착 문서(inputDest)를 사용하여 오버레이에 표시
      showDisplayAnimation(inputStart, inputDest);
      showEndGameButton();
    });
  }

  // 모달 닫기 버튼 처리
  const choiceCloseBtn = document.getElementById("choiceCloseBtn");
  if (choiceCloseBtn) {
    choiceCloseBtn.addEventListener("click", () => {
      const modal = document.getElementById("choiceModal");
      if (modal) {
        modal.style.display = "none";
      }
    });
  }

  const howToPlayBtn = document.getElementById("howToPlayBtn");
  if (howToPlayBtn) {
    howToPlayBtn.addEventListener("click", () => {
      console.log("HOW TO PLAY HELLO");
    });
  }
});

// 페이지 업데이트 시마다 도착 문서 검사 (Race Clear 처리)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    checkDestination();
  }
});

function checkDestination() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const base = "https://namu.wiki/w/";
    let currentUrl = tabs[0].url;
    let currentDoc = "";
    if (currentUrl && currentUrl.startsWith(base)) {
      currentDoc = decodeURIComponent(currentUrl.substring(base.length));
    }
    chrome.storage.local.get({ destination: "" }, (data) => {
      if (currentDoc && currentDoc === data.destination) {
        alert("Race Clear!");
        terminateGame();
      }
    });
  });
}

// 게임 종료 함수: 게임 상태 초기화 및 팝업(사이드 패널) 닫기
function terminateGame() {
  chrome.storage.local.set({ nowState: false, visitedPages: [] }, () => {
    console.log("Game terminated: nowState=false, visitedPages cleared");
  });
  window.close();
}

// (새로운) showDisplayAnimation: 오버레이에 A와 B를 그대로 표시하고 "부터"와 "까지!" 출력
function showDisplayAnimation(A, B) {
  showOverlay();
  const displayA = document.getElementById("displayA");
  const displayB = document.getElementById("displayB");
  if (displayA) displayA.innerText = A;
  if (displayB) displayB.innerText = B;
  // 바로 카운트다운 시작
  startCountdown(() => {
    checkRaceClearAndProceed(A);
  });
}
