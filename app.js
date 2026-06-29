/* ===================================================================
   속초고 교육과정 박람회 — 앱 로직
   =================================================================== */
(function () {
  "use strict";

  var KEY = {
    grade: "sokcho_grade_v1",
    name:  "sokcho_nick_v1",
    hak:   "sokcho_stu_v1"
  };

  // 박람회 당일 (D-day 기준)
  var EVENT_DATE = "2026-07-10";

  // 캐릭터(수달) 풀
  var CHARS = ["img/character1.png","img/character2.png","img/character3.png","img/character4.png","img/character5.png"];

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 1) 기기 판별 ---------- */
  function detectDevice() {
    var ua = navigator.userAgent || "";
    var isMobileUA = /Android|iPhone|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|Mobile/i.test(ua);
    var isTablet   = /iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var narrow     = window.matchMedia("(max-width: 768px)").matches;
    var coarse     = window.matchMedia("(pointer: coarse)").matches;
    var isMobile   = isMobileUA || isTablet || (narrow && coarse);

    var dev = $("device");
    dev.classList.toggle("is-pc", !isMobile);
    dev.classList.toggle("is-mobile", isMobile);
    document.documentElement.dataset.device = isMobile ? "mobile" : "pc";
  }
  detectDevice();
  window.addEventListener("resize", detectDevice);

  /* ---------- 2) 화면 전환 ---------- */
  var SCREENS = ["landing", "home", "detail"];
  function show(name) {
    SCREENS.forEach(function (s) { var el = $(s); if (el) el.hidden = (s !== name); });
    var scr = $(name); if (scr) scr.scrollTop = 0;
  }

  /* ---------- 3) 랜딩 / 로그인 ---------- */
  var selectedGrade = null;

  document.querySelectorAll(".lp-grade").forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectedGrade = btn.dataset.grade;
      $("lpLoginT").textContent = selectedGrade + "학년 로그인";
      $("lpGrades").hidden = true;
      $("lpLogin").hidden = false;
      $("lpHak").focus();
    });
  });

  $("lpBack").addEventListener("click", function () {
    selectedGrade = null;
    $("lpLogin").hidden = true;
    $("lpGrades").hidden = false;
    clearErr();
  });

  function clearErr() { var e = $("lpErr"); e.hidden = true; e.textContent = ""; }
  function showErr(m) { var e = $("lpErr"); e.textContent = m; e.hidden = false; }

  // 학년별 명렬 데이터셋 (1학년=STUDENTS1, 2학년=STUDENTS).
  //   각 레코드: { name, cls, no, slots:[A..F 과목] }.  데이터가 없으면 null.
  function datasetFor(grade) {
    if (grade === "1") return window.STUDENTS1 || null;
    if (grade === "2") return window.STUDENTS || null;
    return null;
  }
  // 이름 비교용 정규화(공백 제거)
  function normName(s) { return String(s || "").replace(/\s+/g, ""); }

  $("lpLoginBtn").addEventListener("click", function () {
    var hak  = $("lpHak").value.trim();
    var name = $("lpName").value.trim();
    if (!/^\d{5}$/.test(hak)) { showErr("학번 5자리를 정확히 입력해 주세요."); return; }
    if (name.length < 2)      { showErr("이름을 입력해 주세요."); return; }

    // 명렬 검증: 데이터가 있으면 학번 + 이름 일치 확인
    var ds = datasetFor(selectedGrade);
    if (ds) {
      var rec = ds[hak];
      if (!rec) { showErr("등록되지 않은 학번이에요. 다시 확인해 주세요."); return; }
      if (normName(rec.name) !== normName(name)) {
        showErr("학번과 이름이 일치하지 않아요."); return;
      }
      name = rec.name; // 정식 표기로 보정
    }

    clearErr();
    localStorage.setItem(KEY.grade, selectedGrade || "");
    localStorage.setItem(KEY.hak, hak);
    localStorage.setItem(KEY.name, name);
    enterHome(name);
  });

  ["lpHak", "lpName"].forEach(function (id) {
    $(id).addEventListener("keydown", function (e) { if (e.key === "Enter") $("lpLoginBtn").click(); });
  });

  $("lpSkip").addEventListener("click", function () {
    localStorage.setItem(KEY.grade, selectedGrade || "");
    localStorage.setItem(KEY.name, "게스트");
    enterHome("게스트");
  });

  /* ---------- 4) 홈 ---------- */
  function pickChar(seed) {
    var s = 0, str = seed || "x";
    for (var i = 0; i < str.length; i++) s += str.charCodeAt(i);
    return CHARS[s % CHARS.length];
  }

  function setDday() {
    // 자정 기준 D-day 계산
    var ev = new Date(EVENT_DATE + "T00:00:00");
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var diff = Math.round((ev - today) / 86400000);
    var num;
    if (diff > 0)        num = "D-" + diff;
    else if (diff === 0) num = "D-DAY";
    else                 num = "박람회 종료";
    $("homeDday").textContent = num;
  }

  function enterHome(name) {
    var nm = (name && name !== "게스트") ? name + "님" : "속초고 학생";
    $("homeWho").textContent = nm;
    $("homeChar").src = pickChar(name);
    setDday();
    show("home");
  }

  /* ---------- 5) 메뉴 라우팅 ---------- */
  var MENU = {
    timetable:  "나의 시간표 확인",
    metaverse:  "메타버스 박람회 접속",
    curriculum: "우리학교 편제표 확인",
    schedule:   "전체 일정 확인"
  };
  // 외부 링크로 바로 연결되는 메뉴
  var LINKS = {
    metaverse: "https://zep.us/play/mkRW1q",
    ebook:     "https://example.com/ebook"   // TODO: 실제 E-Book 링크로 교체
  };

  document.querySelectorAll(".m-card[data-go]").forEach(function (card) {
    card.addEventListener("click", function () {
      var key = card.dataset.go;
      if (LINKS[key]) { window.open(LINKS[key], "_blank", "noopener"); return; }
      openDetail(key);
    });
  });
  function openDetail(key) {
    $("detailTitle").textContent = MENU[key] || "안내";
    if (key === "timetable") renderTimetable();
    else renderSoon();
    show("detail");
  }
  $("detailBack").addEventListener("click", function () { show("home"); });

  /* ---------- 나의 시간표 ----------
     6타임(A~F) 구성. 타임별 시간은 공통, 수강 과목은 학생(학번)마다 다름.
     데이터: data_students1.js → window.STUDENTS1[학번].slots = [A..F 과목명].
       로그인한 학생의 학번/학년으로 본인 데이터만 조회해 표시한다.
       (게스트·미등록 학년은 DEMO_SLOTS 샘플 표시) */
  // A~F = 1~6타임 (각 25분)
  var TIME_SLOTS = [
    "13:30 ~ 13:55", "14:00 ~ 14:25", "14:30 ~ 14:55",
    "15:00 ~ 15:25", "15:30 ~ 15:55", "16:00 ~ 16:25"
  ];
  var SLOT_LETTERS = ["A", "B", "C", "D", "E", "F"];

  // 게스트/데이터 없는 경우의 예시 시간표
  var DEMO_SLOTS = [
    "주제 탐구 독서", "확률과 통계", "물리학 & 역학과 에너지",
    "정보 & 인공지능 기초", "생명과학 & 세포와 물질대사", "일본어 & 일본어 회화"
  ];

  function renderTimetable() {
    var hak   = localStorage.getItem(KEY.hak) || "";
    var grade = localStorage.getItem(KEY.grade) || "";
    var name  = localStorage.getItem(KEY.name) || "속초고 학생";

    var ds   = datasetFor(grade);
    var rec  = (ds && ds[hak]) ? ds[hak] : null;
    var subjects = (rec && rec.slots) ? rec.slots : DEMO_SLOTS;  // [A..F] 과목명
    var clsLabel = rec ? (esc(rec.cls) + " · " + rec.no + "번") : "";

    var html = ""
      + '<div class="tt-head">'
      +   '<img src="' + pickChar(name) + '" alt="" onerror="this.style.display=\'none\'">'
      +   '<div><div class="tt-who">' + esc(name) + (name !== "게스트" ? "님" : "") + '</div>'
      +   '<div class="tt-meta">'
      +     (hak ? "학번 " + esc(hak) + (clsLabel ? " · " + clsLabel : "") : "6타임 이동 시간표")
      +   '</div></div>'
      + '</div>'
      + '<p class="tt-note">각 타임의 <b>수강 과목</b>과 <b>이동 교실</b>을 확인하세요. 시간에 맞춰 이동해 주세요!</p>'
      + '<table class="tt-table"><thead><tr>'
      +   '<th class="c-time">타임</th><th class="c-when">시간</th><th>수강 과목 · 이동 교실</th>'
      + '</tr></thead><tbody>';

    var ROOMS = window.ROOMS_G1 || {};
    for (var i = 0; i < 6; i++) {
      var subj = subjects[i] || "-";
      var room = (ROOMS[subj] || {})[SLOT_LETTERS[i]] || "";
      html += '<tr>'
        +  '<td class="c-time"><span class="t-no">' + SLOT_LETTERS[i] + '</span></td>'
        +  '<td class="c-when"><span class="t-when">' + (TIME_SLOTS[i] || "") + '</span></td>'
        +  '<td><span class="t-subj">' + esc(subj) + '</span>'
        +     (room ? '<span class="t-room">📍 ' + esc(room) + '</span>' : "")
        +  '</td>'
        + '</tr>';
    }
    html += '</tbody></table>';
    $("detailBody").innerHTML = html;
  }

  function renderSoon() {
    $("detailBody").innerHTML = ''
      + '<div class="soon">'
      +   '<img class="d-char" src="img/character3.png" alt="" onerror="this.style.display=\'none\'">'
      +   '<div class="d-soon">준비 중인 기능이에요</div>'
      +   '<div class="d-desc">다음 단계에서 이어서 만들 예정이에요.</div>'
      + '</div>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 히어로 박스 → 나의 시간표
  $("heroTimetable").addEventListener("click", function () { openDetail("timetable"); });

  /* ---------- MY PAGE (내 정보 + 로그아웃) ---------- */
  function logout() {
    localStorage.removeItem(KEY.name);
    localStorage.removeItem(KEY.hak);
    localStorage.removeItem(KEY.grade);
    selectedGrade = null;
    // 랜딩 초기 상태로 복귀
    $("lpLogin").hidden = true;
    $("lpGrades").hidden = false;
    $("lpHak").value = "";
    $("lpName").value = "";
    clearErr();
    show("landing");
  }

  function renderMyPage() {
    var hak   = localStorage.getItem(KEY.hak) || "";
    var grade = localStorage.getItem(KEY.grade) || "";
    var name  = localStorage.getItem(KEY.name) || "속초고 학생";
    var ds    = datasetFor(grade);
    var rec   = (ds && ds[hak]) ? ds[hak] : null;

    var rows = ""
      + '<div class="mp-row"><span class="mp-k">이름</span><span class="mp-v">' + esc(name) + '</span></div>'
      + (grade ? '<div class="mp-row"><span class="mp-k">학년</span><span class="mp-v">' + esc(grade) + '학년</span></div>' : "")
      + (rec   ? '<div class="mp-row"><span class="mp-k">학반</span><span class="mp-v">' + esc(rec.cls) + ' · ' + rec.no + '번</span></div>' : "")
      + (hak   ? '<div class="mp-row"><span class="mp-k">학번</span><span class="mp-v">' + esc(hak) + '</span></div>' : "");

    $("detailBody").innerHTML = ''
      + '<div class="mp">'
      +   '<img class="mp-char" src="' + pickChar(name) + '" alt="" onerror="this.style.display=\'none\'">'
      +   '<div class="mp-name">' + esc(name) + (name !== "게스트" ? "님" : "") + '</div>'
      +   '<div class="mp-card">' + rows + '</div>'
      +   '<button class="mp-logout" id="logoutBtn">로그아웃</button>'
      + '</div>';
    $("logoutBtn").addEventListener("click", logout);
  }

  // 상단 MY PAGE / 알림
  $("goMy").addEventListener("click", function () {
    $("detailTitle").textContent = "MY PAGE"; renderMyPage(); show("detail");
  });
  $("goAlarm").addEventListener("click", function () {
    $("detailTitle").textContent = "알림"; renderSoon(); show("detail");
  });

  /* ---------- 6) 초기 진입 ---------- */
  var savedName = localStorage.getItem(KEY.name);
  if (savedName) enterHome(savedName);
  else show("landing");
})();
