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

  // 교사용 페이지 접속 코드 (필요하면 이 값만 바꾸면 됩니다)
  var TEACHER_CODE = "0710";

  // 현재 사용자가 교사 모드인지
  function isTeacher() { return (localStorage.getItem(KEY.grade) || "") === "T"; }
  // 화면에 보여줄 학년 목록 (학생=본인 학년만 / 교사=1·2학년 모두)
  function viewGrades() {
    if (isTeacher()) return ["1", "2"];
    var g = localStorage.getItem(KEY.grade) || "";
    return (g === "1" || g === "2") ? [g] : ["1", "2"];
  }
  // 이름 뒤 호칭: 교사="선생님", 학생="학생" (게스트는 없음)
  function honorific(name) {
    if (!name || name === "게스트") return "";
    return isTeacher() ? " 선생님" : " 학생";
  }

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
    // PC(웹)에서는 페이지(window)가 스크롤되므로 맨 위로
    if (window.scrollTo) window.scrollTo(0, 0);
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

  /* ---------- 교사용 로그인 (이름 검색 + 코드, 1·2학년 통합 보기) ---------- */
  function tErr(m) { var e = $("lpTErr"); e.textContent = m; e.hidden = false; }
  // 교사 명단에서 이름으로 조회(공백 무시)
  function findTeacher(name) {
    var list = window.TEACHERS || [];
    var key = normName(name);
    for (var i = 0; i < list.length; i++) { if (normName(list[i].name) === key) return list[i]; }
    return null;
  }
  // 이름 입력 자동완성: 입력값이 포함된 교사 이름 후보를 보여준다
  function renderTeacherSug() {
    var box = $("lpTSug");
    var q = normName($("lpTName").value);
    if (!q) { box.hidden = true; box.innerHTML = ""; return; }
    var hits = (window.TEACHERS || []).filter(function (t) {
      return normName(t.name).indexOf(q) !== -1;
    }).slice(0, 8);
    if (!hits.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.innerHTML = hits.map(function (t) {
      return '<button type="button" class="lp-sug-item" data-name="' + esc(t.name) + '">'
        + '<span class="lp-sug-nm">' + esc(t.name) + '</span>'
        + (t.subject ? '<span class="lp-sug-sub">' + esc(t.subject) + '</span>' : "")
        + '</button>';
    }).join("");
    box.hidden = false;
  }
  $("lpTName").addEventListener("input", renderTeacherSug);
  $("lpTSug").addEventListener("click", function (e) {
    var it = e.target.closest(".lp-sug-item"); if (!it) return;
    $("lpTName").value = it.dataset.name;
    $("lpTSug").hidden = true; $("lpTSug").innerHTML = "";
    $("lpCode").focus();
  });
  $("lpTeacherBtn").addEventListener("click", function () {
    $("lpGrades").hidden = true;
    $("lpTeacher").hidden = false;
    $("lpTErr").hidden = true;
    $("lpTName").value = "";
    $("lpCode").value = "";
    $("lpTSug").hidden = true; $("lpTSug").innerHTML = "";
    $("lpTName").focus();
  });
  $("lpTBack").addEventListener("click", function () {
    $("lpTeacher").hidden = true;
    $("lpGrades").hidden = false;
    $("lpTErr").hidden = true;
  });
  $("lpTBtn").addEventListener("click", function () {
    var raw = $("lpTName").value.trim();
    var t = findTeacher(raw);
    if (!t) { tErr("교사 명단에서 이름을 찾을 수 없어요."); return; }
    if ($("lpCode").value.trim() !== TEACHER_CODE) { tErr("교사용 코드가 올바르지 않아요."); return; }
    localStorage.setItem(KEY.grade, "T");
    localStorage.setItem(KEY.hak, "");
    localStorage.setItem(KEY.name, t.name);
    enterHome(t.name);
  });
  ["lpTName", "lpCode"].forEach(function (id) {
    $(id).addEventListener("keydown", function (e) { if (e.key === "Enter") $("lpTBtn").click(); });
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
    var nm = (name && name !== "게스트") ? name + honorific(name) : "속초고 학생";
    $("homeWho").textContent = nm;
    $("homeChar").src = pickChar(name);
    setDday();
    applyHome(name);
    show("home");
  }

  // 바로가기 카드 한 장
  function menuCard(go, ic, tt, sub) {
    return '<button class="m-card m-top" data-go="' + go + '">'
      + '<span class="m-ic"><img src="img/' + ic + '" alt="" aria-hidden="true" /></span>'
      + '<span class="m-tt">' + tt + '</span>'
      + '<span class="m-sub">' + sub + '</span></button>';
  }

  // 역할(학생/교사)에 따라 히어로 + 바로가기 메뉴를 다시 구성
  function applyHome(name) {
    var teacher = isTeacher();
    var hero = $("heroTimetable");
    var hT = hero.querySelector(".hc-title");
    var hS = hero.querySelector(".hc-sub");
    var menu = "";
    if (teacher) {
      hero.dataset.go = "schedule";
      hT.textContent = "전체 일정 확인";
      hS.textContent = "A~F 타임별 부스·교실 한눈에";
      var t = findTeacher(name) || {};
      menu += menuCard("duty", "calander.png", "임장 일정", "내 감독 시간·장소");
      if (t.homeroom) menu += menuCard("myclass", "compass.png", "우리반 학생 위치", "타임별 이동 현황");
      menu += menuCard("schedule", "pin.png", "전체 일정 확인", "박람회 타임테이블");
      menu += menuCard("subjects", "graph.png", "교과별 부스 배치", "교과·타임별 운영 과목");
      menu += menuCard("surveyagg", "excel.png", "교과별 신청 인원", "수요조사 집계");
      menu += menuCard("curriculum", "school.png", "우리학교 편제표", "학년별 교육과정");
      menu += menuCard("ebook", "book.png", "E-Book 바로가기", "전자책 가이드북");
      menu += menuCard("metaverse", "Metaverse.png", "메타버스 박람회", "가상 공간 입장");
    } else {
      hero.dataset.go = "timetable";
      hT.textContent = "나의 시간표 확인";
      hS.textContent = "내가 선택한 과목 한눈에";
      menu += menuCard("survey", "pen.png", "1차 수요조사 결과", "학기별 신청 과목");
      menu += menuCard("recommend", "compass.png", "선택과목 추천", "나에게 맞는 과목 찾기");
      menu += menuCard("ebook", "book.png", "E-Book 바로가기", "전자책 가이드북");
      menu += menuCard("metaverse", "Metaverse.png", "메타버스 박람회", "가상 공간 입장");
      menu += menuCard("curriculum", "school.png", "우리학교 편제표", "학년별 교육과정");
      menu += menuCard("schedule", "calander.png", "전체 일정 확인", "박람회 타임테이블");
    }
    $("menuGrid").innerHTML = menu;
  }

  /* ---------- 5) 메뉴 라우팅 ---------- */
  var MENU = {
    timetable:  "나의 시간표 확인",
    survey:     "1차 수요조사 결과",
    surveyagg:  "교과별 신청 인원",
    metaverse:  "메타버스 박람회 접속",
    curriculum: "우리학교 편제표 확인",
    schedule:   "전체 일정 확인",
    subjects:   "교과별 부스 배치",
    duty:       "임장 일정",
    myclass:    "우리반 학생 위치"
  };
  // 외부 링크로 바로 연결되는 메뉴
  var LINKS = {
    metaverse: "https://zep.us/play/mkRW1q"
  };
  // 학년별 E-Book 가이드북 링크
  var EBOOK = {
    "1": "https://ebook.dsummer.co.kr/books/fzfh/#p=1",
    "2": "https://ebook.dsummer.co.kr/books/nycq/#p=1"
  };
  // 앱에 내장된 페이지(같은 탭 이동, 로그인 세션 공유)
  var PAGES = {
    recommend: "recommend/index.html"   // 선택과목 추천 (Course_registration 통합)
  };

  function handleGo(key) {
    if (!key) return;
    if (key === "ebook") { openEbook(); return; }                    // 학년별 분기
    if (PAGES[key]) { window.location.href = PAGES[key]; return; }   // 세션 그대로 이어짐
    if (LINKS[key]) { window.open(LINKS[key], "_blank", "noopener"); return; }
    openDetail(key);
  }
  // 메뉴/히어로는 역할에 따라 동적으로 다시 그리므로 위임 방식으로 처리
  $("menuGrid").addEventListener("click", function (e) {
    var card = e.target.closest(".m-card[data-go]");
    if (card) handleGo(card.dataset.go);
  });
  function openDetail(key) {
    $("detailTitle").textContent = MENU[key] || "안내";
    if (key === "timetable")   renderTimetable();
    else if (key === "survey") renderSurvey();
    else if (key === "surveyagg") renderSurveyAgg();
    else if (key === "schedule") renderSchedule();
    else if (key === "subjects") renderSubjects();
    else if (key === "curriculum") renderCurriculum();
    else if (key === "duty") renderDuty();
    else if (key === "myclass") renderMyClass();
    else renderSoon();
    show("detail");
  }
  $("detailBack").addEventListener("click", function () { show("home"); });

  // E-Book: 학생은 본인 학년 책으로 바로, 교사는 1·2학년을 좌우 2단으로 임베드
  function ebookCol(grade) {
    var url = EBOOK[grade];
    return '<div class="eb-col">'
      + '<div class="eb-h">' + grade + '학년 E-Book'
      +   '<a class="eb-open" href="' + url + '" target="_blank" rel="noopener">새 창으로 열기 ↗</a></div>'
      + '<iframe class="eb-frame" src="' + url + '" loading="lazy" allowfullscreen></iframe>'
      + '</div>';
  }
  function openEbook() {
    var grades = viewGrades();
    if (grades.length === 1) { window.open(EBOOK[grades[0]], "_blank", "noopener"); return; }
    $("detailTitle").textContent = "E-Book 바로가기";
    $("detailBody").innerHTML = ''
      + '<p class="tt-note"><b>1·2학년 E-Book 가이드북</b>을 좌우로 함께 볼 수 있어요.</p>'
      + '<div class="eb-grid">' + ebookCol("1") + ebookCol("2") + '</div>';
    show("detail");
  }

  /* ---------- 나의 시간표 ----------
     6타임(A~F) 구성. 타임별 시간은 공통, 수강 과목은 학생(학번)마다 다름.
     데이터: data_students1.js → window.STUDENTS1[학번].slots = [A..F 과목명].
       로그인한 학생의 학번/학년으로 본인 데이터만 조회해 표시한다.
       (게스트·미등록 학년은 DEMO_SLOTS 샘플 표시) */
  // A~F = 1~6타임 (각 20분, 이동 10분)
  var TIME_SLOTS = [
    "13:30 ~ 13:50", "14:00 ~ 14:20", "14:40 ~ 15:00",
    "15:10 ~ 15:30", "15:40 ~ 16:00", "16:10 ~ 16:30"
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
      +   '<div><div class="tt-who">' + esc(name) + honorific(name) + '</div>'
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
        +     (room ? '<span class="t-room"><img class="t-pin" src="img/pin.png" alt="" aria-hidden="true">' + esc(room) + '</span>' : "")
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
              + '<span class="t-room"><img class="t-pin" src="img/pin.png" alt="" aria-hidden="true">' + esc(it.room) + '</span></li>';
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

  // 학년 탭 HTML (보여줄 학년이 2개 이상일 때만 표시)
  function gradeTabsHtml(id, grades, cur) {
    if (grades.length < 2) return "";
    return '<div class="sch-tabs" id="' + id + '">'
      + grades.map(function (g) {
          return '<button class="sch-tab' + (g === cur ? " on" : "") + '" data-g="' + g + '">' + g + '학년</button>';
        }).join("")
      + '</div>';
  }

  function renderSchedule() {
    var grades = viewGrades();
    var grade = grades[0];
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

    var note = isTeacher()
      ? 'A~F 타임별 <b>전체 부스</b>와 <b>교실 위치</b>예요. 보기 방식과 학년을 골라 확인하세요.'
      : 'A~F 타임별 <b>' + grade + '학년 전체 부스</b>와 <b>교실 위치</b>예요. 보기 방식을 골라 확인하세요.';

    $("detailBody").innerHTML = ''
      + '<div class="ag-top">'
      +   '<p class="tt-note ag-top-note">' + note + '</p>'
      +   '<button class="mc-print ag-xlsx" id="schXlsx"><img class="btn-ic" src="img/excel.png" alt="" aria-hidden="true">엑셀</button>'
      + '</div>'
      + '<div class="sch-modes" id="schModes">'
      +   '<button class="sch-tab" data-m="list">타임별 목록</button>'
      +   '<button class="sch-tab" data-m="grid">반별 표</button>'
      + '</div>'
      + gradeTabsHtml("schTabs", grades, grade)
      + '<div id="schBody"></div>'
      + (isTeacher() ? '<a class="sch-grid-link" href="schedule_all.html">🖨️ 1·2학년 한 페이지로(인쇄용) 열기</a>' : '');

    $("schXlsx").addEventListener("click", function () { downloadSchedule(grade); });
    document.querySelectorAll("#schModes .sch-tab").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.m; paint(); });
    });
    document.querySelectorAll("#schTabs .sch-tab").forEach(function (b) {
      b.addEventListener("click", function () { grade = b.dataset.g; paint(); });
    });
    paint();
  }

  /* ---------- 교과별 부스 배치 ----------
     국/수/영/사/과/보건/정보/일본어/러시아어 9개 교과로 분류해
     교과 선택 시 각 타임(A~F)에 운영되는 과목·교실을 보여준다.
     분류 규칙(우선순위):
       1) '탐구 프로젝트(R&E)' → 과학 (※ 사용자 지정)
       2) 보건 → 보건,  일본 → 일본어,  러시아 → 러시아어
       3) 그 외에는 SUBJECT_META의 dept로 매핑 (제2외국어/교양/예술/체육은 위에서 처리·제외) */
  var SUBJ_CATS = ["국어", "수학", "영어", "사회", "과학", "보건", "정보", "일본어", "러시아어"];
  var DEPT2CAT = { "국어": "국어", "수학": "수학", "영어": "영어", "사회": "사회", "과학": "과학", "정보": "정보" };

  // 학년별 SUBJECT_META를 공백 무시 키로 색인(캐시) — "미적분 Ⅱ" vs "미적분Ⅱ" 차이 흡수
  var _normMeta = {};
  function normMetaFor(g) {
    if (_normMeta[g]) return _normMeta[g];
    var mg = (window.SUBJECT_META || {})[g] || {}, out = {};
    for (var k in mg) out[normName(k)] = mg[k];
    return (_normMeta[g] = out);
  }

  function catOf(key, grade) {
    if (/탐구\s*프로젝트|R&E/i.test(key)) return "과학";
    if (key.indexOf("보건") !== -1) return "보건";
    if (key.indexOf("일본") !== -1) return "일본어";
    if (key.indexOf("러시아") !== -1) return "러시아어";
    var parts = key.split(/\s*[&·]\s*/);              // 결합 과목명 분리
    var gs = grade ? [grade, (grade === "1" ? "2" : "1")] : ["1", "2"];
    for (var gi = 0; gi < gs.length; gi++) {
      var nm = normMetaFor(gs[gi]);
      for (var pi = 0; pi < parts.length; pi++) {
        var m = nm[normName(parts[pi])];
        if (m && DEPT2CAT[m.dept]) return DEPT2CAT[m.dept];
      }
    }
    return null;
  }

  // 2단계 세부 분류 (사회/과학만). '전체'는 항상 첫 칩.
  var SOC_SUBS = ["전체", "일반사회", "윤리", "지리", "역사", "기타"];
  var SCI_SUBS = ["전체", "물리학", "화학", "생명과학", "지구과학", "기타"];

  function socSub(key) {
    if (/윤리|사상/.test(key)) return "윤리";
    if (/역사|한국사|세계사|동아시아/.test(key)) return "역사";
    if (/지리|도시|기후|국토|세계시민/.test(key)) return "지리";
    if (/사회와 문화|정치|법|경제|금융|국제|사회문제|문화/.test(key)) return "일반사회";
    return "기타";
  }
  function sciSub(key) {
    if (/탐구\s*프로젝트|R&E|융합과학/i.test(key)) return "기타";
    if (/물리|역학|전자기|양자/.test(key)) return "물리학";
    if (/생명|생물|유전|세포/.test(key)) return "생명과학";   // '물질대사'의 물질 오인 방지: 화학보다 먼저
    if (/화학|물질/.test(key)) return "화학";
    if (/지구|우주|행성|천체/.test(key)) return "지구과학";
    return "기타";
  }
  // 교과(cat) 안에서의 세부 분류명 (세부 분류가 없는 교과는 null)
  function subOf(cat, key) {
    if (cat === "사회") return socSub(key);
    if (cat === "과학") return sciSub(key);
    return null;
  }

  function subjGroups(grade) {
    var ROOMS = (grade === "2" ? window.ROOMS_G2 : window.ROOMS_G1) || {};
    var map = {};
    for (var key in ROOMS) {
      var c = catOf(key, grade);
      if (!c) continue;
      (map[c] = map[c] || []).push(key);
    }
    return { ROOMS: ROOMS, map: map };
  }

  function buildSubjectTable(grade, cat, sub) {
    var g = subjGroups(grade), ROOMS = g.ROOMS, keys = g.map[cat] || [];
    if (sub && sub !== "전체") keys = keys.filter(function (k) { return subOf(cat, k) === sub; });
    var rows = "";
    for (var i = 0; i < 6; i++) {
      var L = SLOT_LETTERS[i], items = [];
      keys.forEach(function (k) { var rm = ROOMS[k][L]; if (rm) items.push({ subj: k, room: rm }); });
      items.sort(function (a, b) { return a.room.localeCompare(b.room, "ko", { numeric: true }); });
      var list = items.length
        ? '<ul class="sch-list">' + items.map(function (it) {
            return '<li><span class="t-subj">' + esc(it.subj) + '</span>'
              + '<span class="t-room"><img class="t-pin" src="img/pin.png" alt="" aria-hidden="true">' + esc(it.room) + '</span></li>';
          }).join("") + '</ul>'
        : '<span class="sch-empty">이 타임에 운영 없음</span>';
      rows += '<tr>'
        + '<td class="c-time"><span class="t-no">' + L + '</span></td>'
        + '<td class="c-when"><span class="t-when">' + (TIME_SLOTS[i] || "") + '</span></td>'
        + '<td>' + list + '</td></tr>';
    }
    return '<table class="tt-table sch-table"><thead><tr>'
      + '<th class="c-time">타임</th><th class="c-when">시간</th><th>운영 과목 · 교실</th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderSubjects() {
    var grades = viewGrades();
    var grade = grades[0];
    var cat = null;
    var sub = "전체";

    function availCats(g) { var m = subjGroups(g).map; return SUBJ_CATS.filter(function (c) { return m[c]; }); }
    // 현재 교과의 세부 분류 칩 목록(데이터 있는 것만). 세부 분류 없는 교과면 null
    function subListFor(g, c) {
      var defs = (c === "사회") ? SOC_SUBS : (c === "과학") ? SCI_SUBS : null;
      if (!defs) return null;
      var keys = subjGroups(g).map[c] || [], present = {};
      keys.forEach(function (k) { present[subOf(c, k)] = 1; });
      return defs.filter(function (s) { return s === "전체" || present[s]; });
    }

    function paint() {
      var cats = availCats(grade);
      if (cats.indexOf(cat) === -1) { cat = cats[0]; sub = "전체"; }
      document.querySelectorAll("#sjTabs .sch-tab").forEach(function (b) { b.classList.toggle("on", b.dataset.g === grade); });
      $("sjCats").innerHTML = cats.map(function (c) {
        return '<button class="sch-tab' + (c === cat ? " on" : "") + '" data-c="' + c + '">' + c + '</button>';
      }).join("");

      // 2단계 세부 분류 (사회/과학)
      var subs = subListFor(grade, cat);
      if (subs) {
        if (subs.indexOf(sub) === -1) sub = "전체";
        $("sjSubs").innerHTML = subs.map(function (s) {
          return '<button class="sch-tab' + (s === sub ? " on" : "") + '" data-s="' + s + '">' + s + '</button>';
        }).join("");
        $("sjSubs").hidden = false;
      } else {
        sub = "전체"; $("sjSubs").innerHTML = ""; $("sjSubs").hidden = true;
      }

      $("sjBody").innerHTML = buildSubjectTable(grade, cat, sub);
    }

    var note = isTeacher()
      ? '교과를 선택하면 <b>각 타임(A~F)에 운영되는 과목</b>과 <b>교실</b>을 보여줘요. 학년도 고를 수 있어요.'
      : '<b>' + grade + '학년</b> 교과를 선택하면 <b>각 타임(A~F)에 운영되는 과목</b>과 <b>교실</b>을 보여줘요.';

    $("detailBody").innerHTML = ''
      + '<p class="tt-note">' + note + '</p>'
      + gradeTabsHtml("sjTabs", grades, grade)
      + '<div class="subj-cats" id="sjCats"></div>'
      + '<div class="subj-cats subj-subs" id="sjSubs" hidden></div>'
      + '<div id="sjBody"></div>';

    document.querySelectorAll("#sjTabs .sch-tab").forEach(function (b) {
      b.addEventListener("click", function () { grade = b.dataset.g; paint(); });
    });
    $("sjCats").addEventListener("click", function (e) {
      var b = e.target.closest(".sch-tab"); if (!b) return; cat = b.dataset.c; sub = "전체"; paint();
    });
    $("sjSubs").addEventListener("click", function (e) {
      var b = e.target.closest(".sch-tab"); if (!b) return; sub = b.dataset.s; paint();
    });
    paint();
  }

  // 전체 일정(반별 표) → CSV(엑셀): 열=교실, 행=A~F 타임
  function downloadSchedule(grade) {
    var ROOMS = (grade === "2" ? window.ROOMS_G2 : window.ROOMS_G1) || {};
    var roomset = {};
    for (var s in ROOMS) for (var t in ROOMS[s]) roomset[ROOMS[s][t]] = 1;
    var rooms = Object.keys(roomset).sort(function (a, b) { return a.localeCompare(b, "ko", { numeric: true }); });
    var cell = {};
    SLOT_LETTERS.forEach(function (L) { cell[L] = {}; });
    for (var s2 in ROOMS) for (var t2 in ROOMS[s2]) cell[t2][ROOMS[s2][t2]] = s2;

    var rows = [["타임", "시간"].concat(rooms)];
    for (var i = 0; i < 6; i++) {
      var L = SLOT_LETTERS[i];
      var row = [L, TIME_SLOTS[i] || ""];
      rooms.forEach(function (r) { row.push(cell[L][r] || ""); });
      rows.push(row);
    }
    downloadCsv("전체일정_" + grade + "학년.csv", rows);
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
    // 화면 폭에 맞춤: 좁으면 축소, 넓으면(PC) 확대해 폭을 가득 채움
    var s = avail / nat;
    sc.style.transform = "scale(" + s + ")";
    fit.style.height = Math.ceil(tbl.offsetHeight * s) + "px";
  }

  function renderCurriculum() {
    var data = window.CURRICULUM || null;
    if (!data) { renderSoon(); return; }

    var grades = viewGrades();
    var grade = grades[0];
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

    var pjNote = isTeacher()
      ? '학년별 <b>3개년 교육과정 편제표</b>예요. (1학년=2026학년도 입학생 · 2학년=2025학년도 입학생)'
      : '<b>' + grade + '학년 3개년 교육과정 편제표</b>예요. (' + (grade === "1" ? "2026" : "2025") + '학년도 입학생)';

    $("detailBody").innerHTML = ''
      + '<p class="tt-note">' + pjNote + ' <b>한눈에 보기</b>는 화면에 맞춰 줄여 보여줘요.</p>'
      + '<div class="sch-modes" id="pjModes">'
      +   '<button class="sch-tab" data-m="fit">한눈에 보기</button>'
      +   '<button class="sch-tab" data-m="scroll">원본 크기</button>'
      + '</div>'
      + gradeTabsHtml("pjTabs", grades, grade)
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
  // 선택유형(과목구분) → 칩 class/표시
  var KIND_CLASS = { "일반": "k-ilban", "진로": "k-jinro", "융합": "k-yung", "공통": "k-gong" };
  function subjTags(grade, name) {
    var META = window.SUBJECT_META || {};
    var m = (META[grade] || {})[name];
    if (!m) return "";
    var dept = m.dept ? '<span class="sv-dept">' + esc(m.dept) + '</span>' : "";
    var kind = m.kind ? '<span class="sv-kind ' + (KIND_CLASS[m.kind] || "") + '">' + esc(m.kind) + '</span>' : "";
    return '<span class="sv-tags">' + dept + kind + '</span>';
  }
  function semBlock(title, list, grade) {
    var items = (list && list.length)
      ? list.map(function (s) {
          return '<li class="sv-item"><span class="sv-nm">' + esc(s) + '</span>' + subjTags(grade, s) + '</li>';
        }).join("")
      : '<li class="sv-empty">신청 내역이 없어요</li>';
    return '<div class="sv-sem">'
      + '<div class="sv-sem-h"><span class="sv-badge">' + title + '</span>'
      +   '<span class="sv-cnt">' + ((list && list.length) || 0) + '과목</span></div>'
      + '<ul class="sv-list">' + items + '</ul>'
      + '</div>';
  }

  function renderSurvey() {
    var hak   = localStorage.getItem(KEY.hak) || "";
    var name  = localStorage.getItem(KEY.name) || "속초고 학생";
    var teacher = isTeacher();
    var grades = viewGrades();
    var grade = grades[0];

    function dataFor(g) { return (g === "1") ? window.SURVEY1 : window.SURVEY; }

    // 교과별 신청 인원(별도 페이지) 바로가기 버튼
    var aggBtn = '<button class="ag-link" id="goAgg"><img class="ag-link-ic" src="img/excel.png" alt="" aria-hidden="true">교과별 신청 인원 보기 ›</button>';

    // 교사: 개인 신청 데이터가 없으므로 안내 + 집계 페이지 버튼만
    if (teacher) {
      $("detailBody").innerHTML = ''
        + '<p class="tt-note"><b>1차 수요조사</b> 결과예요. 교과별 신청 인원은 아래 버튼에서 확인하세요.</p>'
        + aggBtn;
      $("goAgg").addEventListener("click", function () { openDetail("surveyagg"); });
      return;
    }

    // 데이터 미연동
    if (!dataFor(grade)) {
      $("detailBody").innerHTML = ''
        + '<div class="soon">'
        +   '<img class="d-char" src="img/character2.png" alt="" onerror="this.style.display=\'none\'">'
        +   '<div class="d-soon">곧 제공될 예정이에요</div>'
        +   '<div class="d-desc">1차 수요조사 신청 결과를 학기별로 보여드릴게요.</div>'
        + '</div>';
      return;
    }

    var data = dataFor(grade);
    var rec  = (data && data[hak]) ? data[hak] : null;

    var html = ''
      + '<div class="tt-head">'
      +   '<img src="' + pickChar(name) + '" alt="" onerror="this.style.display=\'none\'">'
      +   '<div><div class="tt-who">' + esc(name) + honorific(name) + '</div>'
      +   '<div class="tt-meta">' + (hak ? "학번 " + esc(hak) + " · " : "") + '1차 수요조사 신청 결과</div></div>'
      + '</div>'
      + '<p class="tt-note">내가 <b>1차 수요조사</b>에서 신청한 과목이에요. 과목 옆에 <b>교과</b>와 <b>일반·진로·융합</b> 구분을 함께 표시했어요.</p>';

    if (!rec) {
      html += '<div class="sv-none">신청 내역을 찾을 수 없어요. 학번을 확인해 주세요.</div>';
    } else {
      html += '<div class="sv-wrap">'
        + semBlock("1학기", rec.s1, grade)
        + semBlock("2학기", rec.s2, grade)
        + '</div>';
    }
    html += aggBtn;

    $("detailBody").innerHTML = html;
    $("goAgg").addEventListener("click", function () { openDetail("surveyagg"); });
  }

  /* ---------- 교과별 신청 인원 (별도 하위페이지) ----------
     window.SURVEY_AGG[grade] = {pick, s1:[{name,count}], s2:[...]} */
  function aggSemTable(title, pick, list, grade) {
    if (!list || !list.length) return "";
    var max = 1;
    list.forEach(function (it) { if (it.count > max) max = it.count; });
    var rows = list.map(function (it) {
      var w = Math.round((it.count / max) * 100);
      return '<tr><td class="ag-name"><span class="ag-nm">' + esc(it.name) + '</span>' + subjTags(grade, it.name) + '</td>'
        + '<td class="ag-bar"><span class="ag-fill" style="width:' + w + '%"></span></td>'
        + '<td class="ag-cnt">' + it.count + '<span class="ag-unit">명</span></td></tr>';
    }).join("");
    return '<div class="ag-sem">'
      + '<div class="sv-sem-h"><span class="sv-badge">' + title + '</span>'
      +   (pick ? '<span class="sv-cnt">택' + pick + '</span>' : "") + '</div>'
      + '<table class="ag-table"><tbody>' + rows + '</tbody></table>'
      + '</div>';
  }
  function buildAgg(grade) {
    var a = (window.SURVEY_AGG || {})[grade];
    if (!a) return '<div class="sv-none">집계 데이터를 찾을 수 없어요.</div>';
    return '<div class="ag-wrap">'
      + aggSemTable("1학기", a.pick, a.s1, grade)
      + aggSemTable("2학기", a.pick, a.s2, grade)
      + '</div>';
  }

  /* ---------- 교과별 신청 인원 — 그래프(막대차트) 보기 ---------- */
  var KIND_COLOR = { "일반": "#6aa84f", "진로": "#4a82c8", "융합": "#d98f3a", "공통": "#9a9a9a" };
  function aggChartSem(title, pick, list, grade) {
    if (!list || !list.length) return "";
    var META = (window.SUBJECT_META || {})[grade] || {};
    var max = 1; list.forEach(function (it) { if (it.count > max) max = it.count; });
    var bw = 34, gap = 14, padL = 16, padR = 16, padT = 22, padB = 96, plotH = 200;
    var n = list.length;
    var w = padL + padR + n * bw + (n - 1) * gap;
    var h = padT + plotH + padB;
    var baseY = padT + plotH;
    var svg = '<line x1="' + padL + '" y1="' + baseY + '" x2="' + (w - padR) + '" y2="' + baseY + '" class="agc-axis"/>';
    list.forEach(function (it, i) {
      var x = padL + i * (bw + gap);
      var bh = Math.max(2, Math.round(it.count / max * plotH));
      var y = baseY - bh;
      var kind = (META[it.name] || {}).kind;
      var fill = KIND_COLOR[kind] || "#6aa84f";
      var cx = x + bw / 2, ly = baseY + 10;
      svg += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="5" fill="' + fill + '"/>'
        + '<text x="' + cx + '" y="' + (y - 5) + '" text-anchor="middle" class="agc-val">' + it.count + '</text>'
        + '<text x="' + cx + '" y="' + ly + '" text-anchor="end" transform="rotate(-50 ' + cx + ' ' + ly + ')" class="agc-lbl">' + esc(it.name) + '</text>';
    });
    return '<div class="ag-sem">'
      + '<div class="sv-sem-h"><span class="sv-badge">' + title + '</span>'
      +   (pick ? '<span class="sv-cnt">택' + pick + '</span>' : "") + '</div>'
      + '<div class="agc-scroll"><svg class="agc-svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + svg + '</svg></div>'
      + '</div>';
  }
  function buildAggChart(grade) {
    var a = (window.SURVEY_AGG || {})[grade];
    if (!a) return '<div class="sv-none">집계 데이터를 찾을 수 없어요.</div>';
    var legend = '<div class="agc-legend">'
      + '<span><i style="background:#6aa84f"></i>일반</span>'
      + '<span><i style="background:#4a82c8"></i>진로</span>'
      + '<span><i style="background:#d98f3a"></i>융합</span></div>';
    return '<div class="ag-wrap">' + legend
      + aggChartSem("1학기", a.pick, a.s1, grade)
      + aggChartSem("2학기", a.pick, a.s2, grade)
      + '</div>';
  }

  // 집계 → CSV(엑셀) 다운로드
  function downloadAgg(grade) {
    var a = (window.SURVEY_AGG || {})[grade];
    if (!a) return;
    var META = (window.SUBJECT_META || {})[grade] || {};
    var rows = [["학기", "과목", "교과", "구분", "신청인원"]];
    [["1학기", a.s1], ["2학기", a.s2]].forEach(function (pair) {
      pair[1].forEach(function (it) {
        var m = META[it.name] || {};
        rows.push([pair[0], it.name, m.dept || "", m.kind || "", it.count]);
      });
    });
    downloadCsv("교과별_신청인원_" + grade + "학년.csv", rows);
  }

  function renderSurveyAgg() {
    var grades = viewGrades();
    var grade = grades[0];
    var mode = "bars";   // bars = 막대 목록, chart = 그래프

    function paint() {
      document.querySelectorAll("#agModes .sch-tab").forEach(function (b) { b.classList.toggle("on", b.dataset.m === mode); });
      document.querySelectorAll("#agTabs .sch-tab").forEach(function (b) { b.classList.toggle("on", b.dataset.g === grade); });
      $("agBody").innerHTML = (mode === "chart") ? buildAggChart(grade) : buildAgg(grade);
    }

    $("detailBody").innerHTML = ''
      + '<button class="ag-back" id="agBack">‹ 1차 수요조사 결과</button>'
      + '<div class="ag-top">'
      +   '<p class="tt-note ag-top-note"><b>1차 수요조사</b> 기준 <b>교과별 신청 인원</b>이에요.</p>'
      +   '<button class="mc-print ag-xlsx" id="agXlsx"><img class="btn-ic" src="img/excel.png" alt="" aria-hidden="true">엑셀 다운로드</button>'
      + '</div>'
      + '<div class="sch-modes" id="agModes">'
      +   '<button class="sch-tab" data-m="bars">막대 목록</button>'
      +   '<button class="sch-tab" data-m="chart">그래프</button>'
      + '</div>'
      + gradeTabsHtml("agTabs", grades, grade)
      + '<div id="agBody"></div>';

    $("agBack").addEventListener("click", function () { openDetail("survey"); });
    $("agXlsx").addEventListener("click", function () { downloadAgg(grade); });
    document.querySelectorAll("#agModes .sch-tab").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.m; paint(); });
    });
    document.querySelectorAll("#agTabs .sch-tab").forEach(function (b) {
      b.addEventListener("click", function () { grade = b.dataset.g; paint(); });
    });
    paint();
  }

  /* ---------- (교사) 임장 일정 ----------
     window.DUTY[교사이름] = [{time:"A", booth, room, grade}], 배정표는 추후 제공 */
  var SLOT_ORDER = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };
  function renderDuty() {
    var name = localStorage.getItem(KEY.name) || "";
    var t = findTeacher(name) || {};
    var head = '<div class="tt-head">'
      + '<img src="' + pickChar(name) + '" alt="" onerror="this.style.display=\'none\'">'
      + '<div><div class="tt-who">' + esc(name) + honorific(name) + '</div>'
      + '<div class="tt-meta">' + (t.subject ? esc(t.subject) + ' · ' : '') + '임장(감독) 일정</div></div>'
      + '</div>';

    var my = (window.DUTY || {})[name] || [];
    if (!my.length) {
      $("detailBody").innerHTML = head
        + '<div class="soon">'
        +   '<img class="d-char" src="img/character2.png" alt="" onerror="this.style.display=\'none\'">'
        +   '<div class="d-soon">임장 배정표 준비 중이에요</div>'
        +   '<div class="d-desc">감독 배정표가 확정되면, 선생님이 <b>어느 타임</b>에 <b>어느 부스·교실</b>에 들어가야 하는지 여기에서 바로 보여드릴게요.</div>'
        + '</div>';
      return;
    }
    my = my.slice().sort(function (a, b) { return (SLOT_ORDER[a.time] || 0) - (SLOT_ORDER[b.time] || 0); });
    var rows = my.map(function (d) {
      var i = SLOT_ORDER[d.time] || 0;
      return '<tr>'
        + '<td class="c-time"><span class="t-no">' + esc(d.time || "") + '</span></td>'
        + '<td class="c-when"><span class="t-when">' + (TIME_SLOTS[i] || "") + '</span></td>'
        + '<td><span class="t-subj">' + esc(d.booth || "") + '</span>'
        +   (d.room ? '<span class="t-room"><img class="t-pin" src="img/pin.png" alt="" aria-hidden="true">' + esc(d.room) + '</span>' : "")
        + '</td></tr>';
    }).join("");
    $("detailBody").innerHTML = head
      + '<p class="tt-note">선생님이 <b>감독(임장)</b>할 타임과 부스·교실이에요.</p>'
      + '<table class="tt-table"><thead><tr><th class="c-time">타임</th><th class="c-when">시간</th><th>감독 부스 · 교실</th></tr></thead><tbody>'
      + rows + '</tbody></table>';
  }

  /* ---------- (담임) 우리반 학생 타임별 위치 ----------
     담임(homeroom 101~208) → 반 학생 명렬 × A~F 타임 = 이동 교실 행렬 */
  function renderMyClass() {
    var name = localStorage.getItem(KEY.name) || "";
    var t = findTeacher(name);
    if (!t || !t.homeroom) {
      $("detailBody").innerHTML = '<div class="sv-none">담임 학급 정보가 없어요.</div>';
      return;
    }
    var hr = String(t.homeroom);
    var grade = hr.charAt(0);
    var ban = parseInt(hr.slice(1), 10);
    var cls = grade + "-" + ban;
    var ds = datasetFor(grade) || {};
    var ROOMS = (grade === "2" ? window.ROOMS_G2 : window.ROOMS_G1) || {};

    var studs = [];
    for (var hak in ds) {
      var r = ds[hak];
      if (r && r.cls === cls) studs.push({ no: r.no, name: r.name, slots: r.slots || [] });
    }
    studs.sort(function (a, b) { return a.no - b.no; });
    if (!studs.length) {
      $("detailBody").innerHTML = '<div class="sv-none">' + esc(cls) + '반 학생 데이터를 찾을 수 없어요.</div>';
      return;
    }

    var thTimes = "";
    for (var i = 0; i < 6; i++) thTimes += '<th>' + SLOT_LETTERS[i] + '<span class="mc-when">' + (TIME_SLOTS[i] || "") + '</span></th>';
    var body = studs.map(function (s) {
      var tds = "";
      for (var j = 0; j < 6; j++) {
        var subj = s.slots[j] || "";
        var room = (ROOMS[subj] || {})[SLOT_LETTERS[j]] || "";
        tds += '<td>'
          + (room ? '<span class="mc-room">' + esc(room) + '</span>' : "")
          + (subj ? '<span class="mc-subj">' + esc(subj) + '</span>' : '<span class="mc-empty">·</span>')
          + '</td>';
      }
      return '<tr><th class="mc-stu"><span class="mc-no">' + s.no + '</span><span class="mc-nm">' + esc(s.name) + '</span></th>' + tds + '</tr>';
    }).join("");

    var tableHtml = '<div class="mc-wrap"><table class="mc-table"><thead><tr><th class="mc-corner">번호·이름</th>'
      + thTimes + '</tr></thead><tbody>' + body + '</tbody></table></div>';

    $("detailBody").innerHTML = ''
      + '<div class="mc-head">'
      +   '<p class="tt-note mc-note"><b>' + esc(cls) + '반</b> 학생들이 타임별로 이동하는 <b>부스·교실</b>이에요. (총 ' + studs.length + '명)</p>'
      +   '<div class="mc-acts">'
      +     '<button class="mc-print mc-xlsx" id="mcXlsx"><img class="btn-ic" src="img/excel.png" alt="" aria-hidden="true">엑셀</button>'
      +     '<button class="mc-print" id="mcPrint"><img class="btn-ic" src="img/print.png" alt="" aria-hidden="true">인쇄</button>'
      +   '</div>'
      + '</div>'
      + tableHtml;

    $("mcPrint").addEventListener("click", function () {
      openPrintWindow(esc(cls) + "반 학생 타임별 위치 (총 " + studs.length + "명)", tableHtml);
    });
    $("mcXlsx").addEventListener("click", function () {
      var header = ["번호", "이름"];
      for (var k = 0; k < 6; k++) header.push(SLOT_LETTERS[k] + " (" + (TIME_SLOTS[k] || "") + ")");
      var rows = [header];
      studs.forEach(function (s) {
        var row = [s.no, s.name];
        for (var k = 0; k < 6; k++) {
          var subj = s.slots[k] || "";
          var room = (ROOMS[subj] || {})[SLOT_LETTERS[k]] || "";
          row.push(subj ? (room ? room + " / " + subj : subj) : "");
        }
        rows.push(row);
      });
      downloadCsv(cls + "반_학생_타임별_위치.csv", rows);
    });
  }

  // 2차원 배열 → CSV(엑셀, UTF-8 BOM) 다운로드
  function downloadCsv(filename, rows) {
    var csv = rows.map(function (r) {
      return r.map(function (c) {
        c = (c == null) ? "" : String(c);
        return /[",\n\r]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(",");
    }).join("\r\n");
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- 인쇄용 새 창 (가로 방향) ---------- */
  function openPrintWindow(title, innerHtml) {
    var w = window.open("", "_blank");
    if (!w) { alert("팝업이 차단되어 인쇄 창을 열 수 없어요. 브라우저의 팝업 허용 후 다시 시도해 주세요."); return; }
    var css = ''
      + '@page{size:A4 landscape;margin:9mm;}'
      + '*{box-sizing:border-box;}'
      + 'body{font-family:"Pretendard","Malgun Gothic",sans-serif;margin:0;padding:14px;color:#1c1c1c;}'
      + 'h2{font-size:15px;margin:0 0 10px;}'
      + '.mc-wrap{overflow:visible;border:0;box-shadow:none;}'
      + 'table{border-collapse:collapse;width:100%;table-layout:fixed;}'
      + 'th,td{border:1px solid #444;padding:3px 4px;text-align:center;vertical-align:middle;'
      +   'font-size:9.5px;width:14.2857%;word-break:keep-all;overflow:hidden;}'
      + 'thead th{background:#2f4a1c !important;color:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
      + 'thead th .mc-when{display:block;font-size:7.5px;font-weight:400;margin-top:1px;}'
      + 'tbody th{background:#f0ede3 !important;text-align:left;padding-left:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
      + 'tbody th .mc-no{color:#999;margin-right:4px;}'
      + 'tbody th .mc-nm{font-weight:700;}'
      + '.mc-room{display:block;font-weight:700;color:#1f7a3d;font-size:9.5px;}'
      + '.mc-subj{display:block;font-size:7.5px;color:#666;margin-top:1px;line-height:1.2;}'
      + '.mc-empty{color:#bbb;}'
      + 'tbody tr:nth-child(even) td{background:#f7f7f3;-webkit-print-color-adjust:exact;print-color-adjust:exact;}';
    w.document.write('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
      + '<title>' + title + '</title><style>' + css + '</style></head><body>'
      + '<h2>' + title + '</h2>' + innerHtml
      + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},250);};</scr' + 'ipt>'
      + '</body></html>');
    w.document.close();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 히어로 박스 (학생=나의 시간표 / 교사=전체 일정)
  $("heroTimetable").addEventListener("click", function () { handleGo(this.dataset.go || "timetable"); });

  /* ---------- MY PAGE (내 정보 + 로그아웃) ---------- */
  function logout() {
    localStorage.removeItem(KEY.name);
    localStorage.removeItem(KEY.hak);
    localStorage.removeItem(KEY.grade);
    selectedGrade = null;
    // 랜딩 초기 상태로 복귀
    $("lpLogin").hidden = true;
    $("lpTeacher").hidden = true;
    $("lpGrades").hidden = false;
    $("lpHak").value = "";
    $("lpName").value = "";
    $("lpTName").value = "";
    $("lpCode").value = "";
    clearErr();
    show("landing");
  }

  function renderMyPage() {
    var hak   = localStorage.getItem(KEY.hak) || "";
    var grade = localStorage.getItem(KEY.grade) || "";
    var name  = localStorage.getItem(KEY.name) || "속초고 학생";
    var ds    = datasetFor(grade);
    var rec   = (ds && ds[hak]) ? ds[hak] : null;

    var rows;
    if (grade === "T") {                       // 교사
      var t = findTeacher(name) || {};
      rows = '<div class="mp-row"><span class="mp-k">이름</span><span class="mp-v">' + esc(name) + '</span></div>'
        + '<div class="mp-row"><span class="mp-k">구분</span><span class="mp-v">교사</span></div>'
        + (t.subject  ? '<div class="mp-row"><span class="mp-k">담당</span><span class="mp-v">' + esc(t.subject) + '</span></div>' : "")
        + (t.homeroom ? '<div class="mp-row"><span class="mp-k">담임</span><span class="mp-v">' + esc(t.homeroom) + '호실</span></div>' : "");
    } else {
      rows = '<div class="mp-row"><span class="mp-k">이름</span><span class="mp-v">' + esc(name) + '</span></div>'
        + (grade ? '<div class="mp-row"><span class="mp-k">학년</span><span class="mp-v">' + esc(grade) + '학년</span></div>' : "")
        + (rec   ? '<div class="mp-row"><span class="mp-k">학반</span><span class="mp-v">' + esc(rec.cls) + ' · ' + rec.no + '번</span></div>' : "")
        + (hak   ? '<div class="mp-row"><span class="mp-k">학번</span><span class="mp-v">' + esc(hak) + '</span></div>' : "");
    }

    $("detailBody").innerHTML = ''
      + '<div class="mp">'
      +   '<img class="mp-char" src="' + pickChar(name) + '" alt="" onerror="this.style.display=\'none\'">'
      +   '<div class="mp-name">' + esc(name) + honorific(name) + '</div>'
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
