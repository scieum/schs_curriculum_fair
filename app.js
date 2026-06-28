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

  // NOTE: 실제 명렬(STUDENTS/STUDENTS1) 검증은 데이터 연동 단계에서 추가.
  //       지금은 형식 검증(학번 5자리 + 이름)만 수행.
  $("lpLoginBtn").addEventListener("click", function () {
    var hak  = $("lpHak").value.trim();
    var name = $("lpName").value.trim();
    if (!/^\d{5}$/.test(hak)) { showErr("학번 5자리를 정확히 입력해 주세요."); return; }
    if (name.length < 2)      { showErr("이름을 입력해 주세요."); return; }
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
  function openDetail(key) { $("detailTitle").textContent = MENU[key] || "안내"; show("detail"); }
  $("detailBack").addEventListener("click", function () { show("home"); });

  // 히어로 박스 → 나의 시간표
  $("heroTimetable").addEventListener("click", function () { openDetail("timetable"); });

  // 상단 MY PAGE / 알림 (임시)
  $("goMy").addEventListener("click", function () {
    $("detailTitle").textContent = "MY PAGE"; show("detail");
  });
  $("goAlarm").addEventListener("click", function () {
    $("detailTitle").textContent = "알림"; show("detail");
  });

  /* ---------- 6) 초기 진입 ---------- */
  var savedName = localStorage.getItem(KEY.name);
  if (savedName) enterHome(savedName);
  else show("landing");

  // 데모용: 헤더 프로필을 더블클릭하면 로그아웃
  $("goMy").addEventListener("dblclick", function () {
    localStorage.removeItem(KEY.name);
    localStorage.removeItem(KEY.hak);
    location.reload();
  });
})();
