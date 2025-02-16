document.addEventListener("DOMContentLoaded", () => {
  // 샘플 데이터
  const sampleTitles = ["사과", "바나나", "기린", "호랑이", "영화", "축구"];

  // ▼ 슬롯머신 효과를 위한 함수
  //    elementId: "slotAInner" or "slotBInner"
  //    finalValue: 최종으로 멈출 문자열
  //    duration: 몇 초 동안 애니메이션(회전)할지
  //    callback: 끝나고 나서 할 일
  function spinSlotMachine(elementId, finalValue, duration, callback) {
    const slotInner = document.getElementById(elementId);

    // [1] 아이템 배열을 구성하되, 맨 끝에 최종값(finalValue)을 붙여둠
    //     예) [...무작위 값들..., 최종값]
    const randomItems = [];
    for (let i = 0; i < 5; i++) {
      // 임의 5개 아이템 넣기
      const randomItem = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
      randomItems.push(randomItem);
    }
    randomItems.push(finalValue); // 마지막(6번째)에 최종값

    // [2] slotInner 내부를 <div class="slot-item"> 들로 채움
    slotInner.innerHTML = "";
    randomItems.forEach((item) => {
      const div = document.createElement("div");
      div.className = "slot-item";
      div.textContent = item;
      slotInner.appendChild(div);
    });

    // [3] 아이템 하나당 높이 30px
    //     총 아이템 개수 = randomItems.length
    //     -> 최종 이동 높이 = (아이템 개수 - 1) * 30
    const totalItems = randomItems.length;
    const itemHeight = 30;
    const totalHeight = (totalItems - 1) * itemHeight;

    // [4] CSS 애니메이션으로 translateY 사용
    //     - keyframes를 동적으로 생성
    //     - duration 동안 top→ -totalHeight px 이동
    const keyframesName = `slotRoll_${elementId}_${Date.now()}`;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";

    // keyframes 문자열
    // 0%에서 top=0, 100%에서 top=-totalHeight px
    const keyframes = `
      @keyframes ${keyframesName} {
        0% { transform: translateY(0); }
        100% { transform: translateY(-${totalHeight}px); }
      }
    `;
    styleSheet.innerHTML = keyframes;
    document.head.appendChild(styleSheet);

    // 애니메이션 적용
    slotInner.style.animation = `${keyframesName} ${duration}s ease-in-out forwards`;

    // [5] duration 끝난 뒤 콜백 실행
    setTimeout(() => {
      // 사용한 임시 styleSheet 제거(안 해도 되지만 깔끔)
      document.head.removeChild(styleSheet);
      slotInner.style.animation = "none";

      // 끝난 뒤 콜백
      if (callback) callback();
    }, duration * 1000);
  }

  // ▼ A,B 슬롯 모두 끝난 뒤 카운트다운
  function startCountdown() {
    const textElem = document.getElementById("animationText");
    const steps = ["3", "2", "1", "Go!"];
    let step = 0;

    const interval = setInterval(() => {
      textElem.innerText = steps[step];
      step++;
      if (step >= steps.length) {
        clearInterval(interval);
        // 카운트다운 끝났으니 약간의 시간 뒤 오버레이 닫기
        setTimeout(() => {
          closeOverlay();
          // 그 후 페이지 이동
          goToWikiPage();
        }, 500);
      }
    }, 1000);
  }

  // ▼ 오버레이 열기 / 닫기
  function showOverlay() {
    const overlay = document.getElementById("overlay");
    overlay.style.visibility = "visible";
    overlay.style.opacity = "1";
  }
  function closeOverlay() {
    const overlay = document.getElementById("overlay");
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";
  }

  // ▼ 실제 페이지 이동
  function goToWikiPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTabId = tabs[0].id;
      chrome.tabs.update(activeTabId, {
        // 원하는 URL로 변경
        url: "https://namu.wiki/w/%EC%9D%80%ED%98%9C%EA%B0%9A%EA%B8%B0",
      });
    });
  }

  // ▼ 최종 슬롯머신+카운트다운 함수
  //    A, B를 받아서 슬롯머신 돌린 뒤 끝나면 카운트다운
  function showSlotMachineAnimation(A, B) {
    // 오버레이 표시
    showOverlay();

    // 1) 슬롯 A 돌리기 (2초)
    spinSlotMachine("slotAInner", A, 2, () => {
      // 2) 슬롯 B 돌리기 (2초)
      spinSlotMachine("slotBInner", B, 2, () => {
        // 3) 두 슬롯 모두 멈춘 뒤 카운트다운
        startCountdown();
      });
    });
  }

  // ▼ 랜덤 A,B 뽑는 함수(샘플)
  function getRandomWikiTitles() {
    const A = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
    const B = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
    return { A, B };
  }

  // ▼ 랜덤 모드 버튼
  const randomBtn = document.getElementById("randomBtn");
  randomBtn.addEventListener("click", () => {
    const { A, B } = getRandomWikiTitles();
    showSlotMachineAnimation(A, B);
  });

  // ▼ 선택 모드 버튼 (임시)
  const choiceBtn = document.getElementById("choiceBtn");
  choiceBtn.addEventListener("click", () => {
    console.log("CHOICE HELLO");
  });

  // ▼ 어떻게 플레이 하나요? 버튼 (임시)
  const howToPlayBtn = document.getElementById("howToPlayBtn");
  howToPlayBtn.addEventListener("click", () => {
    console.log("HOW TO PLAY HELLO");
  });
});
