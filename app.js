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
    survey:     "1차 수요조사 결과",
    metaverse:  "메타버스 박람회 접속",
    curriculum: "우리학교 편제표 확인",
    schedule:   "전체 일정 확인"
  };
  // 외부 링크로 바로 연결되는 메뉴
  var LINKS = {
    metaverse: "https://zep.us/play/mkRW1q",
    ebook:     "https://example.com/ebook"   // TODO: 실제 E-Book 링크로 교체
  };
  // 앱에 내장된 페이지(같은 탭 이동, 로그인 세션 공유)
  var PAGES = {
    recommend: "recommend/index.html"   // 선택과목 추천 (Course_registration 통합)
  };

  document.querySelectorAll(".m-card[data-go]").forEach(function (card) {
    card.addEventListener("click", function () {
      var key = card.dataset.go;
      if (PAGES[key]) { window.location.href = PAGES[key]; return; }   // 세션 그대로 이어짐
      if (LINKS[key]) { window.open(LINKS[key], "_blank", "noopener"); return; }
      openDetail(key);
    });
  });
  function openDetail(key) {
    $("detailTitle").textContent = MENU[key] || "안내";
    if (key === "timetable")   renderTimetable();
    else if (key === "survey") renderSurvey();
    else if (key === "schedule") renderSchedule();
    else if (key === "curriculum") renderCurriculum();
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

    var ROOMS = (grade === "2" ? window.ROOMS_G2 : window.ROOMS_G1) || {};
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

  /* ---------- 전체 일정 (1·2학년 타임별 전체 부스·교실) ----------
     ROOMS_G1 / ROOMS_G2[과목][타임] = 교실. 타임별로 모든 부스를 모아 표시. */
  function buildScheduleTable(grade) {
    var ROOMS = (grade === "2" ? window.ROOMS_G2 : window.ROOMS_G1) || {};
    var rows = "";
    for (var i = 0; i < 6; i++) {
      var L = SLOT_LETTERS[i];
      var items = [];
      for (var subj in ROOMS) {
        var rm = ROOMS[subj][L];
        if (rm) items.push({ subj: subj, room: rm });
      }
      items.sort(function (a, b) { return a.room.localeCompare(b.room, "ko", { numeric: true }); });
      var list = items.length
        ? '<ul class="sch-list">' + items.map(function (it) {
            return '<li><span class="t-subj">' + esc(it.subj) + '</span>'
              + '<span class="t-room">📍 ' + esc(it.room) + '</span></li>';
          }).join("") + '</ul>'
        : '<span class="sch-empty">운영 부스 없음</span>';
      rows += '<tr>'
        + '<td class="c-time"><span class="t-no">' + L + '</span></td>'
        + '<td class="c-when"><span class="t-when">' + (TIME_SLOTS[i] || "") + '</span></td>'
        + '<td>' + list + '</td>'
        + '</tr>';
    }
    return '<table class="tt-table sch-table"><thead><tr>'
      + '<th class="c-time">타임</th><th class="c-when">시간</th><th>운영 부스 (과목 · 교실)</th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // 반별 표(행렬): 열=교실, 행=A~F 타임, 칸=과목
  function buildMatrix(grade) {
    var ROOMS = (grade === "2" ? window.ROOMS_G2 : window.ROOMS_G1) || {};
    var roomset = {};
    for (var s in ROOMS) for (var t in ROOMS[s]) roomset[ROOMS[s][t]] = 1;
    var rooms = Object.keys(roomset).sort(function (a, b) { return a.localeCompare(b, "ko", { numeric: true }); });
    var cell = {};
    SLOT_LETTERS.forEach(function (L) { cell[L] = {}; });
    for (var s2 in ROOMS) for (var t2 in ROOMS[s2]) cell[t2][ROOMS[s2][t2]] = s2;

    var head = '<tr><th class="mx-corner">타임</th>'
      + rooms.map(function (r) { return '<th>' + esc(r) + '</th>'; }).join("") + '</tr>';
    var body = "";
    for (var i = 0; i < 6; i++) {
      var L = SLOT_LETTERS[i];
      body += '<tr><th>' + L + '<span class="mx-when">' + (TIME_SLOTS[i] || "") + '</span></th>'
        + rooms.map(function (r) {
            var v = cell[L][r];
            return v ? '<td>' + esc(v) + '</td>' : '<td class="empty">·</td>';
          }).join("") + '</tr>';
    }
    return '<div class="mx-wrap"><table class="mx-table"><thead>' + head
      + '</thead><tbody>' + body + '</tbody></table></div>';
  }

  function renderSchedule() {
    var grade = localStorage.getItem(KEY.grade) || "1";
    if (grade !== "1" && grade !== "2") grade = "1";
    var mode = "list";   // list = 타임별 목록, grid = 반별 표

    function paint() {
      document.querySelectorAll("#schModes .sch-tab").forEach(function (b) {
        b.classList.toggle("on", b.dataset.m === mode);
      });
      document.querySelectorAll("#schTabs .sch-tab").forEach(function (b) {
        b.classList.toggle("on", b.dataset.g === grade);
      });
      $("schBody").innerHTML = (mode === "grid") ? buildMatrix(grade) : buildScheduleTable(grade);
    }

    $("detailBody").innerHTML = ''
      + '<p class="tt-note">A~F 타임별 <b>전체 부스</b>와 <b>교실 위치</b>예요. 보기 방식과 학년을 골라 확인하세요.</p>'
      + '<div class="sch-modes" id="schModes">'
      +   '<button class="sch-tab" data-m="list">타임별 목록</button>'
      +   '<button class="sch-tab" data-m="grid">반별 표</button>'
      + '</div>'
      + '<div class="sch-tabs" id="schTabs">'
      +   '<button class="sch-tab" data-g="1">1학년</button>'
      +   '<button class="sch-tab" data-g="2">2학년</button>'
      + '</div>'
      + '<div id="schBody"></div>'
      + '<a class="sch-grid-link" href="schedule_all.html">🖨️ 1·2학년 한 페이지로(인쇄용) 열기</a>';

    document.querySelectorAll("#schModes .sch-tab").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.m; paint(); });
    });
    document.querySelectorAll("#schTabs .sch-tab").forEach(function (b) {
      b.addEventListener("click", function () { grade = b.dataset.g; paint(); });
    });
    paint();
  }

  /* ---------- 우리학교 편제표 (3개년 교육과정) ----------
     data_curriculum.js → window.CURRICULUM["1"|"2"] = 편제표 <table> HTML.
     '한눈에 보기' = 표 전체를 화면 폭에 맞게 자동 축소(scale), '원본 크기' = 가로 스크롤. */
  var pjFitBound = false;
  function fitCurriculum() {
    var body = $("pjBody"); if (!body) return;
    var fit = body.querySelector(".pj-fit");
    var sc  = body.querySelector(".pj-scale");
    if (!fit || !sc) return;
    var tbl = sc.querySelector("table"); if (!tbl) return;
    sc.style.transform = "none"; fit.style.height = "";
    var avail = fit.clientWidth || 1;
    var nat   = tbl.offsetWidth || 1;
    var s = Math.min(1, avail / nat);
    sc.style.transform = "scale(" + s + ")";
    fit.style.height = Math.ceil(tbl.offsetHeight * s) + "px";
  }

  function renderCurriculum() {
    var data = window.CURRICULUM || null;
    if (!data) { renderSoon(); return; }

    var grade = localStorage.getItem(KEY.grade) || "1";
    if (grade !== "1" && grade !== "2") grade = "1";
    var mode = "fit";   // fit = 한눈에(자동 축소), scroll = 원본 크기

    function paint() {
      document.querySelectorAll("#pjModes .sch-tab").forEach(function (b) { b.classList.toggle("on", b.dataset.m === mode); });
      document.querySelectorAll("#pjTabs .sch-tab").forEach(function (b) { b.classList.toggle("on", b.dataset.g === grade); });
      var html = data[grade] || "";
      if (mode === "fit") {
        $("pjBody").innerHTML = '<div class="pj-fit"><div class="pj-scale">' + html + '</div></div>';
        requestAnimationFrame(fitCurriculum);
      } else {
        $("pjBody").innerHTML = '<div class="pj-wrap">' + html + '</div>';
      }
    }

    $("detailBody").innerHTML = ''
      + '<p class="tt-note">학년별 <b>3개년 교육과정 편제표</b>예요. (1학년=2026학년도 입학생 · 2학년=2025학년도 입학생) <b>한눈에 보기</b>는 화면에 맞춰 줄여 보여줘요.</p>'
      + '<div class="sch-modes" id="pjModes">'
      +   '<button class="sch-tab" data-m="fit">한눈에 보기</button>'
      +   '<button class="sch-tab" data-m="scroll">원본 크기</button>'
      + '</div>'
      + '<div class="sch-tabs" id="pjTabs">'
      +   '<button class="sch-tab" data-g="1">1학년</button>'
      +   '<button class="sch-tab" data-g="2">2학년</button>'
      + '</div>'
      + '<div id="pjBody"></div>';

    document.querySelectorAll("#pjModes .sch-tab").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.m; paint(); });
    });
    document.querySelectorAll("#pjTabs .sch-tab").forEach(function (b) {
      b.addEventListener("click", function () { grade = b.dataset.g; paint(); });
    });

    if (!pjFitBound) {
      pjFitBound = true;
      window.addEventListener("resize", function () {
        if (document.querySelector("#pjBody .pj-fit")) fitCurriculum();
      });
    }
    paint();
  }

  function renderSoon() {
    $("detailBody").innerHTML = ''
      + '<div class="soon">'
      +   '<img class="d-char" src="img/character3.png" alt="" onerror="this.style.display=\'none\'">'
      +   '<div class="d-soon">준비 중인 기능이에요</div>'
      +   '<div class="d-desc">다음 단계에서 이어서 만들 예정이에요.</div>'
      + '</div>';
  }

  /* ---------- 1차 수요조사 결과 (학기별 신청 과목) ----------
     데이터: window.SURVEY1[학번] = { s1:[과목..], s2:[과목..] }  (1학기/2학기)
       아직 데이터 미연동 시 안내 화면을 보여준다. */
  function semBlock(title, list) {
    var items = (list && list.length)
      ? list.map(function (s) { return '<li class="sv-item">' + esc(s) + '</li>'; }).join("")
      : '<li class="sv-empty">신청 내역이 없어요</li>';
    return '<div class="sv-sem">'
      + '<div class="sv-sem-h"><span class="sv-badge">' + title + '</span>'
      +   '<span class="sv-cnt">' + ((list && list.length) || 0) + '과목</span></div>'
      + '<ul class="sv-list">' + items + '</ul>'
      + '</div>';
  }

  function renderSurvey() {
    var hak   = localStorage.getItem(KEY.hak) || "";
    var grade = localStorage.getItem(KEY.grade) || "";
    var name  = localStorage.getItem(KEY.name) || "속초고 학생";
    var data  = (grade === "1") ? window.SURVEY1 : window.SURVEY;
    var rec   = (data && data[hak]) ? data[hak] : null;

    // 데이터 자체가 아직 연동되지 않은 경우
    if (!data) {
      $("detailBody").innerHTML = ''
        + '<div class="soon">'
        +   '<img class="d-char" src="img/character2.png" alt="" onerror="this.style.display=\'none\'">'
        +   '<div class="d-soon">곧 제공될 예정이에요</div>'
        +   '<div class="d-desc">1차 수요조사 신청 결과를 학기별로 보여드릴게요.</div>'
        + '</div>';
      return;
    }

    var html = ''
      + '<div class="tt-head">'
      +   '<img src="' + pickChar(name) + '" alt="" onerror="this.style.display=\'none\'">'
      +   '<div><div class="tt-who">' + esc(name) + (name !== "게스트" ? "님" : "") + '</div>'
      +   '<div class="tt-meta">' + (hak ? "학번 " + esc(hak) + " · " : "") + '1차 수요조사 신청 결과</div></div>'
      + '</div>'
      + '<p class="tt-note">내가 <b>1차 수요조사</b>에서 신청한 과목을 <b>학기별</b>로 정리했어요.</p>';

    if (!rec) {
      html += '<div class="sv-none">신청 내역을 찾을 수 없어요. 학번을 확인해 주세요.</div>';
    } else {
      html += '<div class="sv-wrap">'
        + semBlock("1학기", rec.s1)
        + semBlock("2학기", rec.s2)
        + '</div>';
    }
    $("detailBody").innerHTML = html;
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
