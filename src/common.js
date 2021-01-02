// Note: Avoid ES6 class syntax which is not supported on mobile browsers
// (as of Sep 2020). E.g. this code does not work in mobile browsers:
//
//    class C {
//      static a = 1; // JS parse error here
//    }
//

// ***************************************************************************
//
//  Base utilities
//
// ***************************************************************************

const RvbVersionNumber = "1.7";
const RvbVersionDate = "2021-01-01";
let currentLocale = "";

const strings = {
  versionText: {
    en: `Version ${RvbVersionNumber} dated ${RvbVersionDate}`,
    "zh-CN": `版本 ${RvbVersionNumber} 日期 ${RvbVersionDate}`,
  },
  "Switch language": {
    "zh-CN": "更换语文",
  },
  "Zoom in": {
    "zh-CN": "画面放大",
  },
  "Zoom out": {
    "zh-CN": "画面缩小",
  },
  "Reset zoom to 100%": {
    "zh-CN": "重设缩放为 100%",
  },
  bibleFullName: {
    en: "Holy Bible Recovery Version 2020",
    "zh-CN": "恢复本圣经 2020",
  },
  "Back to Home Page": {
    "zh-CN": "回到首页",
  },
  Zoom: {
    "zh-CN": "字体",
  },
  "The Old Testament": {
    "zh-CN": "旧约圣经",
  },
  "The New Testament": {
    "zh-CN": "新约圣经",
  },
  Close: {
    "zh-CN": "关闭",
  },
  "No such vref {1} in {2}.": {
    // 1: vref, 2: book name
    "zh-CN": "【{2}】里无此链接{1}。",
  },
  "Failed to load the book of {1}.": {
    // 1: book name
    "zh-CN": "无法取得【{1}】的数据。",
  },
  "Show Outlines": {
    "zh-CN": "显示纲要",
  },
  "Hide Outlines": {
    "zh-CN": "隐藏纲要",
  },
  "Show Notes": {
    "zh-CN": "显示注解",
  },
  "Hide Notes": {
    "zh-CN": "隐藏注解",
  },
  "Expand Outlines": {
    "zh-CN": "展开纲要",
  },
  "Clip Outlines": {
    "zh-CN": "剪缩纲要",
  },
  "Show One Chapter": {
    "zh-CN": "仅显示一章",
  },
  "Show All Chapters": {
    "zh-CN": "显示每一章",
  },
  Chapters: {
    "zh-CN": "章数",
  },
  "Introduction to {1}": {
    // Some chinese book names end with "书", so adding one more
    // "书" will make it "书书", which is undesirable.
    "zh-CN": "{1}的介绍",
  },
  "Subject of {1}": {
    "zh-CN": "{1}的主题",
  },
  "Outlines of {1}": {
    "zh-CN": "{1}的纲要",
  },
  "Chapter {1} of {2}": {
    "zh-CN": "第{1}章 (共{2}章)",
  },
  "Back to Top": {
    "zh-CN": "回到上面",
  },
  "Home Page": {
    "zh-CN": "首页",
  },
  "Missing jump ref to outline: {1}": {
    "zh-CN": "无法找到纲要点：{1}",
  },
  "Missing jump ref to verse: {1}": {
    "zh-CN": "无法找到经节：{1}",
  },
  "Missing jump ref to chapter: {1}": {
    "zh-CN": "无法找到章数：{1}",
  },
  "Unknown jump to ref: {1}": {
    "zh-CN": "无法找到跳点：{1}",
  },
  "Book of {1}": {
    // Some chinese book names end with "书", so adding one more
    // "书" will make it "书书", which is undesirable.
    "zh-CN": "{1}",
  },
  "Unknown page: {1}": {
    "zh-CN": "无此页：{1}",
  },
  "Failed to load book names.": {
    "zh-CN": "无法加载书名数据。",
  },
  "verse-part-a": {
    en: "a",
    "zh-CN": "上",
  },
  "verse-part-b": {
    en: "b",
    "zh-CN": "下",
  },
  "para. {1}": {
    "zh-CN": "第 {1} 段",
  },
  "{1} {2} of {3}": {
    // e.g. "Ezekiel 1 of 10"
    "zh-CN": "{1} {2} 之{3}章",
  },
};

function findBestMatchingLanguage() {
  const lang = navigator.language;
  return lang === "zh" || lang.startsWith("zh-") ? "zh-CN" : "en";
}

function getOrStoreLocale() {
  if (currentLocale) return currentLocale;
  currentLocale = localStorage.getItem("locale");
  if (currentLocale) return currentLocale;

  currentLocale = findBestMatchingLanguage();
  localStorage.setItem("locale", currentLocale);
  return currentLocale;
}

// Set the locale right away.
getOrStoreLocale();

function getString(name, a1, a2, a3) {
  const a = strings[name];
  if (!a) {
    console.error(`Unknown string "${name}".`);
    return name;
  }
  let s = a[currentLocale] ?? name;
  if (a1 !== undefined) s = s.replace(/\{1}/g, a1);
  if (a2 !== undefined) s = s.replace(/\{2}/g, a2);
  if (a3 !== undefined) s = s.replace(/\{3}/g, a3);
  return s;
}

function safeParseInt(s, defaultValue = 0) {
  const i = parseInt(s);
  return isNaN(i) ? defaultValue : i;
}

// Try network (including browser cache) first, then fallback to cache.
function loadJsFile(href, onSuccess = null, onFailure = null) {
  const script = document.createElement("script");
  script.src = href;
  if (onSuccess) script.onload = onSuccess;

  script.onerror = async () => {
    try {
      const cache = await caches.open("all-pages");
      if (cache) {
        const cacheResponse = await cache.match(href);
        if (cacheResponse && cacheResponse.status === 200) {
          const text = await cacheResponse.text();
          const script = document.createElement("script");
          script.innerHTML = text;
          document.head.appendChild(script);
          onSuccess();
          return;
        }
      }
    } catch (e) {
      console.log(`Cache error: ${JSON.stringify(e)}`);
    }

    onFailure && onFailure();
  };

  document.head.appendChild(script);
}

// jQuery selectors cannot contain special chars like ':', so use this function instead.
function $id(id) {
  return document.getElementById(id);
}

// Get a persistent boolean value which always defaults to false.
function $getBool(key) {
  return localStorage.getItem(key) === "true";
}

// Set a persistent boolean value which defaults to false when the key is not present.
function $setBool(key, value) {
  value ? localStorage.setItem(key, "true") : localStorage.removeItem(key);
}

function $currentPageId() {
  return $id("currentPageId")?.value;
}

function hideTooltips() {
  $(".tooltip").tooltip("hide");
}

function setIndexContent(title, html) {
  hideTooltips();

  document.title = title;
  $id("indexContent").innerHTML = html;

  // Setup all tooltips to show.
  $('[data-toggle="tooltip"]').tooltip();
}

function topNavBarHeight() {
  return $id("indexContent").offsetTop;
}

function topScrollOffset() {
  // In mobile browsers, the top address bar will auto show and hide, so offset by
  // another 70px to go past the address bar.
  return topNavBarHeight() + 70;
}

function scrollTargetY(element) {
  let targetY = element.offset().top - topScrollOffset();
  if (targetY < 0) targetY = 0;
  return targetY;
}

function doubleTapHighlight(element) {
  const e = $(element);
  const ms = e.data("lastTouchEndMs");
  if (!ms || Date.now() - ms > 600) {
    e.data("lastTouchEndMs", Date.now());
  } else {
    e.data("lastTouchEndMs", 0);
    e.toggleClass("highlight");
  }
}

const BLACK_CIRCLE = "&#x2B24;";

// The black small triangle for left and up have different sizes, so flip
// the right and down triangles to get the left arrow.
const CHEVRON_RIGHT = "\u25B8";
// const CHEVRON_DOWN = "\u25BE";
const CHEVRON_LEFT = CHEVRON_RIGHT;
// const CHEVRON_UP = CHEVRON_DOWN;

// ***************************************************************************
//
//  Top nav bar
//
// ***************************************************************************

const TopNavBar = (function () {
  function insertElementIntoPage() {
    const html = `
      <div id="topNavBar">
        <nav id="fixedNavBar" class="bar">
          <div>
            <button class="toggler" type="button" data-toggle="collapse"
                data-target="#navbarToggleContent" aria-controls="navbarToggleContent"
                aria-expanded="false" aria-label="Toggle navigation"
                onclick="TopNavBar.onToggle()">
              <span class="icon"></span>
            </button>
          </div>
          <div class="title">
            ${BookRefUtils.linkPage(
              "Home",
              getString("bibleFullName"),
              `data-toggle="tooltip" data-placement="bottom" title="${getString(
                "Back to Home Page"
              )}"`
            )}
          </div>
          <div>
            <button class="toggler" aria-label="Switch language"
                title="${getString("Switch language")}"
                data-toggle="tooltip" data-placement="bottom"
                onclick="switchCurrentLocale()">
              <span class="langIcon">文</span>
            </button>
          </div>
        </nav>
        <div class="collapse" id="navbarToggleContent">
          <div id="topNavDropdown">
            ${genFontSizeControlsHtml()}
            ${genBookLinksInnerHtml()}
            ${genVersionHtml()}
          </div>
        </div>
      </div>
      `;
    $(html).appendTo(document.body);
  }

  function insertIntoPage() {
    insertElementIntoPage();

    ZoomControl.init();

    updateDropdownHeight();
    window.addEventListener("resize", updateDropdownHeight);

    document.body.addEventListener("click", closeNavBar);
  }

  // Used when switching locales.
  function fastRerender() {
    $("#topNavBar").remove();
    insertElementIntoPage();
    updateDropdownHeight();
  }

  function onToggle() {
    // Highlight current book.
    $("#topNavDropdown a[data-bkAbbr]")
      .css("background-color", "")
      .css("color", "");
    $(`#topNavDropdown a[data-bkAbbr="${$currentPageId()}"]`).css({
      backgroundColor: "#ffb",
      color: "blue",
    });
  }

  function updateDropdownHeight() {
    let h = $(window).height() - topNavBarHeight();
    if (h > 500) h = 500;
    $($id("topNavDropdown")).height(h + "px");
  }

  function closeNavBar() {
    $($id("navbarToggleContent")).collapse("hide");
    hideTooltips();
  }

  function genFontSizeControlsHtml() {
    // event.stopPropagation() is to avoid closing the nav bar on click.
    return `
      <div class="fontSizeSection">
        <div class="sectionTitle zoomTitle">${getString("Zoom")}</div>
        <div class="fontSizeControl">
          <a href="javascript:ZoomControl.makeSmaller()" onclick="event.stopPropagation()"
              data-toggle="tooltip" data-placement="top"
              title="${getString("Zoom out")}">-</a>
          <a href="javascript:ZoomControl.makeBigger()" onclick="event.stopPropagation()"
              data-toggle="tooltip" data-placement="top"
              title="${getString("Zoom in")}">+</a>
          <a href="javascript:ZoomControl.reset()"
              data-toggle="tooltip" data-placement="top"
              title="${getString("Reset zoom to 100%")}">o</a>
          <span class="fontSizePercent">100%</span>
        </div>
      </div>
      `;
  }

  // Links to all books in the bible.
  function genBookLinksInnerHtml() {
    const grps = [5, 12, 5, 5, 12, 4, 14, 9];
    let bk = 0;

    let s = `<div class="sectionTitle testamentTitle">${getString(
      "The Old Testament"
    )}</div>`;
    s += '<div class="grp">';
    for (let grp = 0; grp < grps.length; grp++) {
      if (grp === 5) {
        s += "</div>";
        s += `<div class="sectionTitle testamentTitle">${getString(
          "The New Testament"
        )}</div>`;
        s += '<div class="grp">';
      }
      s += `<div class="grp${grp}">`;
      for (let i = 0; i < grps[grp]; i++, bk++) {
        s += BookRefUtils.linkCode(
          `goPage('${BkAbbr[bk]}');`,
          bkNames.BkRef[bk],
          `data-toggle="tooltip" data-placement="top" title="${bkNames.BkName[bk]}" data-bkAbbr="${BkAbbr[bk]}"`
        );
      }
      s += "</div>";
    }
    return s + "</div>";
  }

  function genVersionHtml() {
    return `<div class="version">holyrvbible ${getString("versionText")}</div>`;
  }

  // Exports.
  return { insertIntoPage, fastRerender, onToggle };
})();

// ***************************************************************************
//
//  Zoom controls
//
// ***************************************************************************

const ZoomControl = (function () {
  const zoomPercents = [
    70,
    80,
    85,
    90,
    95,
    100,
    105,
    110,
    115,
    120,
    130,
    150,
    170,
    200,
    240,
    270,
    300,
  ];

  function adjust(zoomAdjust) {
    let currentPercent = safeParseInt(localStorage.getItem("zoomPercent"), 100);
    const currentIndex = zoomPercents.indexOf(currentPercent);
    if (currentIndex < 0) return reset();
    const newIndex = currentIndex + zoomAdjust;

    if (newIndex >= 0 && newIndex < zoomPercents.length) {
      const newPercent = zoomPercents[newIndex];
      reset(newPercent);
    }
  }

  function makeBigger() {
    adjust(1);
  }

  function makeSmaller() {
    adjust(-1);
  }

  function reset(percent = 100) {
    const z = zoomPercents;
    if (percent < z[0] || percent > z[z.length - 1]) {
      percent = 100;
    }

    set(percent);
  }

  // For setting the font-size/zoom level:
  // - Don't use MozTransform => causes scrollTop bug.
  // - Don't use document.body.style.zoom => entire document looks off.
  // - Don't set font-size on html tag => only top nav bar gets zoomed
  //     for mobile browsers, rest of page has no zoom.
  // - Don't set initial scale on viewport => causes scrollTop bug.
  function set(percent) {
    // Set the index content font size only. Best approach so far.
    $id("indexContent").style.cssText = `font-size: ${percent}%`;

    // Update font size label.
    $(".fontSizePercent").html(percent + "%");

    // Persist zoom percent for client.
    localStorage.setItem("zoomPercent", percent + "");
  }

  function init() {
    adjust(0);
  }

  // Exports.
  return { makeBigger, makeSmaller, reset, init };
})();

// ***************************************************************************
//
//  Toast notifications
//
// ***************************************************************************

const ToastNotifier = (function () {
  let hideToastTimer = null;

  // Right now we only show toasts for errors and nothing else.
  function notifyError(message) {
    if (hideToastTimer) {
      clearTimeout(hideToastTimer);

      // Need to hide current toast before showing the new one.
      hideToast(() => showToast(message));
    } else {
      showToast(message);
    }
  }

  // Don't call this directly. Call notifyError() instead.
  function showToast(message) {
    const toastHtml = `
      <div id="toast-notification" aria-live="polite" aria-atomic="true">
          <div class="contents">
              <div class="message">${message}</div>
              <button class="closeButton" aria-label="${getString("Close")}"
                  onclick="ToastNotifier.hideToast()">
                  <span aria-hidden="true">&times;</span>
              </button>
          </div>
      </div>
      `;

    // Make the toast disappear when the user navigates to a different page.
    $(toastHtml)
      .slideUp(0)
      .appendTo($($id("indexContent")))
      .slideDown(400);

    hideToastTimer = setTimeout(() => hideToast(), 5000);
  }

  function hideToast(callback) {
    hideToastTimer = null;
    const toast = $($id("toast-notification"));
    if (toast.length > 0) {
      toast.slideUp(400, () => {
        toast.remove();
        callback && callback();
      });
    }
  }

  // Exports.
  return { notifyError, hideToast };
})();

// ***************************************************************************
//
//  Index page
//
// ***************************************************************************

const IndexHtml = (function () {
  function genIndexTitle() {
    return `
      <div class="indexTitle">
        ${getString("bibleFullName")}
      </div>
      <div class="changeLanguageLinks">
        ${
          currentLocale === "en"
            ? "English"
            : `<a href="javascript:setCurrentLocale('en')">English</a>`
        }
        &nbsp;|&nbsp;
        ${
          currentLocale === "zh-CN"
            ? "简体中文"
            : `<a href="javascript:setCurrentLocale('zh-CN')">简体中文</a>`
        }
      </div>
      `;
  }

  function genTocHtml() {
    const grps = [5, 12, 5, 5, 12, 4, 14, 9];
    let s = `<div id="indexToc">`;
    let bk = 0;
    let grp = 0;
    let grpcnt = 0;

    for (let row = 0; row < 6; row++) {
      s += `<div class="row">`;
      for (let col = 0; col < 11; col++, bk++) {
        s += genTocCellHtml(bk, grp);
        if (++grpcnt >= grps[grp]) {
          grp++;
          grpcnt = 0;
        }
      }
      s += `</div>`;
    }
    s += `</div>`;
    return s;
  }

  function genTocCellHtml(bk, grp) {
    const bkAbbr = BkAbbr[bk];
    const bkName = bkNames.BkLongName[bk];

    return `
      <a class="cell grp${grp}" href="javascript:goPage('${bkAbbr}')"
          data-toggle="tooltip" data-placement="top" title="${bkName}">
          ${bkNames.BkShort[bk]}
      </a>`;
  }

  function genPageHtml() {
    return `
      <div class="indexOuterGrid">
        <div class="indexOuterGridInnerFiller">
          <div class="indexInnerGridCell">
            <input type="hidden" id="currentPageId" value="Home">
            ${genIndexTitle()}
            ${genTocHtml()}
          </div>
        </div>
      </div>
      `;
  }

  // Returns true if page was loaded, false if there is no need to reload the same page.
  function usePage(forceRerender = false) {
    if (!forceRerender && $currentPageId() === "Home") {
      return;
    }

    setIndexContent(getString("bibleFullName"), genPageHtml());
  }

  // Exports.
  return { usePage };
})();

// ***************************************************************************
//
//  Book data loader
//
// ***************************************************************************

const BookDataLoader = (function () {
  function loadBookData(bkAbbr, onSuccess, onFailure) {
    loadJsFile(
      `src/data/${currentLocale}/books/${bkAbbr}.js`,
      /* onSuccess */ () => {
        const bkData = BkData[bkAbbr];
        populateAdditionalBookData(bkAbbr, bkData);
        onSuccess(bkData);
      },
      onFailure
    );
  }

  // Add more fields to the book data.
  function populateAdditionalBookData(bkAbbr, bkData) {
    // Fill in bkNum, bkAbbr ... in bkData for convenience.
    const bkNum = BkAbbrNum[bkAbbr];
    bkData.bkNum = bkNum;
    bkData.bkAbbr = bkAbbr;
    bkData.bkRef = bkNames.BkRef[bkNum];
    bkData.bkName = bkNames.BkName[bkNum];
    bkData.numChapters = BkNumChapters[bkNum];
  }

  function withBookData(bkAbbr, onSuccess, onFailure) {
    const bkData = BkData[bkAbbr];
    if (bkData) {
      onSuccess(bkData);
    } else {
      loadBookData(bkAbbr, onSuccess, onFailure);
    }
  }

  // Exports.
  return { withBookData };
})();

// ***************************************************************************
//
//  Book name lookup
//
// ***************************************************************************

const BookNameLookup = (function () {
  let lookupMap = null;

  function getOrInitLookupMap() {
    if (lookupMap) return lookupMap;
    const map = {};
    BkAbbr.forEach((bkAbbr, bkNum) => {
      populateWithBookName(map, bkAbbr, bkAbbr);
      populateWithBookName(map, bkNames.BkShort[bkNum], bkAbbr);
      populateWithBookName(map, bkNames.BkRef[bkNum], bkAbbr);
      populateWithBookName(map, bkNames.BkName[bkNum], bkAbbr);
      populateWithBookName(map, bkNames.BkLongName[bkNum], bkAbbr);
    });

    // "Psalm" is not a book name, but "Psalms" is. But some verse refs look
    // like "Psalm 123" and not "Psalms 123".
    map["Psalm"] = "Psa";

    lookupMap = map;
    return map;
  }

  function populateWithBookName(map, name, bkAbbr) {
    map[name] = bkAbbr;
    map[name.toLowerCase()] = bkAbbr;

    if (name.includes(" ")) {
      // Convert '1 Pet.' to '1&nbsp;Pet.'.
      const noSpace = name.replace(" ", "&nbsp;");
      map[noSpace] = bkAbbr;
      map[noSpace.toLowerCase()] = bkAbbr;
    }
  }

  // Get the book abbreviation for any given book name, or null if not found.
  function tryGetBkAbbr(bkAnyName) {
    const map = getOrInitLookupMap();
    return map[bkAnyName] || map[bkAnyName.toLowerCase()] || null;
  }

  // Exports.
  return { tryGetBkAbbr };
})();

// ***************************************************************************
//
//  Verse tooltip
//
// ***************************************************************************

const VerseTooltip = (function () {
  function init(anchor, vref) {
    // No need to call init() again.
    anchor.removeAttribute("onmouseover");

    let bkAbbr = "";
    let chVn = "";
    let displayChVn = ""; // for one chapter only books

    let match = vref.match(/^(\w\w\w)(\d+):(\d+)$/);
    if (match) {
      bkAbbr = match[1];
      chVn = match[2] + ":" + match[3];
      displayChVn = BkOneChapterOnly.has(bkAbbr) ? match[3] : chVn;
    } else {
      // Check if this is for a one chapter only book.
      match = vref.match(/^(\w\w\w)(\d+)$/);
      if (match && BkOneChapterOnly.has(match[1])) {
        bkAbbr = match[1];
        displayChVn = match[2];
        chVn = "1:" + displayChVn;
      } else {
        // No need to show tooltip if there is no valid verse ref.
        // These are from the book source data where we do not filter them out beforehand.
        return;
      }
    }

    const bk = BkAbbrNum[bkAbbr];

    const onSuccess = (bkData) => {
      const verseText = bkData.verses[chVn];
      if (!verseText) {
        return ToastNotifier.notifyError(
          getString("No such vref {1} in {2}.", vref, bkNames.BkName[bk])
        );
      }

      // Remove superscripts.
      const text = verseText.replace(/\[[^\]]+\]/g, "");

      $(anchor)
        .tooltip({
          placement: "top",
          title: `<b>${bkNames.BkRef[bk]}&nbsp;${displayChVn}</b> ${text}`,
          html: true,
        })
        .tooltip("show");
    };

    const onFailure = () => {
      ToastNotifier.notifyError(
        getString("Failed to load the book of {1}.", bkNames.BkName[bk])
      );
    };

    BookDataLoader.withBookData(bkAbbr, onSuccess, onFailure);
  }

  // Exports.
  return { init };
})();

// ***************************************************************************
//
//  Book referencing utils
//
// ***************************************************************************

const BookRefUtils = (function () {
  const charCode0 = "0".charCodeAt(0);
  const charCode9 = "9".charCodeAt(0);

  function isDigit(char) {
    const code = char.charCodeAt(0);
    return charCode0 <= code && code <= charCode9;
  }

  function linkPage(page, text, attributes) {
    return linkCode(`goPage('${page}')`, text, attributes);
  }

  function linkCode(code, text, attributes) {
    return `<a href="javascript:${code}"${
      attributes ? " " + attributes : ""
    }>${text}</a>`;
  }

  function linkVerse(page, text, attributes) {
    return linkCode(
      `goPage('${page}')`,
      text,
      (attributes ?? "") + `onmouseover="VerseTooltip.init(this, '${page}')"`
    );
  }

  function getLinkToPreviousChapter(bkAbbr, ch) {
    if (ch == 1) {
      let prevBk = BkAbbrNum[bkAbbr] - 1;
      if (prevBk < 0) prevBk = BkAbbr.length - 1;
      return `${BkAbbr[prevBk]}${BkNumChapters[prevBk]}`;
    }
    return `${bkAbbr}${ch - 1}`;
  }

  function getLinkToNextChapter(bkAbbr, ch, numChapters) {
    if (ch == numChapters) {
      let nextBk = BkAbbrNum[bkAbbr] + 1;
      if (nextBk >= BkAbbr.length) nextBk = 0;
      return `${BkAbbr[nextBk]}`;
    }

    return `${bkAbbr}${ch + 1}`;
  }

  // Transform '{Gen1:1|Gen. 1:1}' to '<a href="...Gen1:1">Gen. 1.1</a>'.
  function makeSimpleLinks(text) {
    let t = text.replace(/\}/g, `</a>`);

    // Replace book and chapter refs.
    while (t.includes("{")) {
      const t2 = t.replace(
        /\{([^|]+)\|/,
        `<a href="javascript:goPage('$1')" onmouseover="VerseTooltip.init(this, '$1')">`
      );
      t = t2;
    }

    return t;
  }

  // Transform outline-only verse refs into a hyperlink string.
  // These verse refs can only refer to the current book.
  function makeOutlineVerseRefs(bkAbbr, chapterNumber, verseRefs) {
    let result = "";
    let remainder = verseRefs;
    let ch = chapterNumber;

    while (remainder.length > 0) {
      const firstChar = remainder[0];

      // Only digits can possibly refer to chapters and verses.
      if (isDigit(firstChar)) {
        const chPlusVerse = /^(\d+):(\d+)/.exec(remainder);
        if (chPlusVerse) {
          const ref = chPlusVerse[0];
          ch = chPlusVerse[1];
          result += linkVerse(bkAbbr + ref, ref);
          remainder = remainder.substr(ref.length);
          continue;
        }

        const verseOnly = /^\d+/.exec(remainder);
        if (verseOnly) {
          const vn = verseOnly[0];
          if (BkOneChapterOnly.has(bkAbbr)) {
            result += linkVerse(`${bkAbbr}1:${vn}`, vn);
          } else {
            result += linkVerse(`${bkAbbr}${ch}:${vn}`, vn);
          }
          remainder = remainder.substr(vn.length);
          continue;
        }
      }

      result += firstChar;
      remainder = remainder.substr(1);
    }

    return result;
  }

  // Convert proper verse refs into hyperlinks.
  function makeVerseRefsLinks(bkAbbr, chapterNumber, verseNumber, verseRefs) {
    let result = "";
    let remaining = verseRefs;
    let ch = chapterNumber;
    let vn = verseNumber;
    let forceChapter = false;

    while (remaining) {
      let match = remaining.match(
        /^((\d( |(&nbsp;)))?[A-Z][a-z]+\.?) (\d+):(\d+)[ab]?/
      );
      if (match) {
        remaining = remaining.substr(match[0].length);
        const bkName = match[1];
        ch = match[5];
        vn = match[6];

        const abbr = BookNameLookup.tryGetBkAbbr(bkName);
        if (abbr) {
          bkAbbr = abbr;
          result += linkVerse(`${bkAbbr}${ch}:${vn}`, match[0]);
        } else {
          result += bkName;
          result += " " + linkVerse(`${bkAbbr}${ch}:${vn}`, `${ch}:${vn}`);
        }
        continue;
      }

      match = remaining.match(/^((\d( |(&nbsp;)))?[A-Z][a-z]+\.?) (\d+)/);
      if (match) {
        remaining = remaining.substr(match[0].length);
        const bkName = match[1];
        ch = match[5];

        const abbr = BookNameLookup.tryGetBkAbbr(bkName);
        if (abbr) {
          bkAbbr = abbr;
          if (BkOneChapterOnly.has(bkAbbr)) {
            result += linkVerse(`${bkAbbr}1:${ch}`, match[0]);
          } else {
            result += linkPage(`${bkAbbr}${ch}`, match[0]);
          }
        } else {
          result += bkName;
          result += " " + linkPage(`${bkAbbr}${ch}`, ch);
        }
        continue;
      }

      match = remaining.match(/^(\d+):(\d+)[ab]?/);
      if (match) {
        remaining = remaining.substr(match[0].length);
        ch = match[1];
        vn = match[2];
        result += linkVerse(`${bkAbbr}${ch}:${vn}`, match[0]);
        continue;
      }

      match = remaining.match(/^(\d+) title/);
      if (match) {
        remaining = remaining.substr(match[0].length);
        ch = match[1];
        result += linkVerse(`${bkAbbr}${ch}:Title`, match[0]);
        continue;
      }

      match = remaining.match(/^(\d+)[ab]/);
      if (match) {
        remaining = remaining.substr(match[0].length);
        vn = match[1];
        if (BkOneChapterOnly.has(bkAbbr)) {
          result += linkVerse(`${bkAbbr}1:${vn}`, match[0]);
        } else {
          result += linkVerse(`${bkAbbr}${ch}:${vn}`, match[0]);
        }
        continue;
      }

      match = remaining.match(/^(\d+)/);
      if (match) {
        remaining = remaining.substr(match[0].length);
        if (forceChapter) {
          ch = match[1];
          if (BkOneChapterOnly.has(bkAbbr)) {
            result += linkPage(`${bkAbbr}1:${ch}`, match[0]);
          } else {
            result += linkPage(`${bkAbbr}${ch}`, match[0]);
          }
          forceChapter = false;
        } else {
          vn = match[1];
          if (BkOneChapterOnly.has(bkAbbr)) {
            result += linkVerse(`${bkAbbr}1:${vn}`, match[0]);
          } else {
            result += linkVerse(`${bkAbbr}${ch}:${vn}`, match[0]);
          }
        }
        continue;
      }

      match = remaining.match(/^&[a-zA-Z]+;/);
      if (match) {
        remaining = remaining.substr(match[0].length);
        result += match[0];
        if (match[0] === "&ndash;" || match[0] === "&mdash;") {
          forceChapter = true;
        }
        continue;
      }

      match = remaining.match(/^and note (\d+)/);
      if (match) {
        remaining = remaining.substr(match[0].length);
        const note = match[1];
        result +=
          "and " + linkPage(`${bkAbbr}${ch}:${vn}^${note}`, "note " + note);
        continue;
      }

      if (remaining[0] === ";" || remaining[0] === "–") {
        forceChapter = true;
      }

      result += remaining[0];
      remaining = remaining.substr(1);
    }

    return result;
  }

  // Exports.
  return {
    linkPage,
    linkCode,
    linkVerse,
    getLinkToPreviousChapter,
    getLinkToNextChapter,
    makeSimpleLinks,
    makeOutlineVerseRefs,
    makeVerseRefsLinks,
  };
})();

// ***************************************************************************
//
//  Book page
//
// ***************************************************************************

const BookHtml = (function () {
  function currentBkAbbr() {
    return $id("currentBkAbbr")?.value;
  }

  function getAllOutlinesVisible() {
    return $getBool("allOutlinesVisible");
  }

  function setAllOutlinesVisible(value) {
    $setBool("allOutlinesVisible", value);
  }

  function getAllNotesVisible() {
    return $getBool("allNotesVisible");
  }

  function setAllNotesVisible(value) {
    $setBool("allNotesVisible", value);
  }

  function getAllOutlinesExpanded() {
    return $getBool("allOutlinesExpanded");
  }

  function setAllOutlinesExpanded(value) {
    $setBool("allOutlinesExpanded", value);
  }

  function getOneChapterOnly() {
    return $getBool("oneChapterOnly");
  }

  function setOneChapterOnly(value) {
    $setBool("oneChapterOnly", value);
  }

  function getAllNotesGenerationDoneInput() {
    return $id("allNotesGenerationDone");
  }

  function getAllOutlinesTogglerText(isVisible) {
    return getString(isVisible ? "Hide Outlines" : "Show Outlines");
  }

  function updateAllOutlinesTogglerLabel(isVisible) {
    $(".allOutlinesToggler").html(getAllOutlinesTogglerText(isVisible));
    setAllOutlinesVisible(isVisible);
  }

  function getAllNotesTogglerText(isVisible) {
    return getString(isVisible ? "Hide Notes" : "Show Notes");
  }

  function updateAllNotesTogglerLabel(isVisible) {
    $(".allNotesToggler").html(getAllNotesTogglerText(isVisible));
    setAllNotesVisible(isVisible);
  }

  function getAllOutlinesClipExpandTogglerText(isExpanded) {
    return getString(isExpanded ? "Clip Outlines" : "Expand Outlines");
  }

  function updateAllOutlinesClipExpandTogglerLabel(isExpanded) {
    $(".allOutlinesClipExpandToggler a").html(
      getAllOutlinesClipExpandTogglerText(isExpanded)
    );
    setAllOutlinesExpanded(isExpanded);
  }

  function updateOneChapterOnlyTogglerLabel(value) {
    $(".oneChapterOnlyToggler").html(
      getString(value ? "Show All Chapters" : "Show One Chapter")
    );
    setOneChapterOnly(value);
  }

  function genPageHtml(bkData, ch) {
    const bkAbbr = bkData.bkAbbr;

    const preambleVisibility = !ch || ch == 1 ? "" : ' style="display: none;"';

    return `
      <div class="bookContent">
        <a name="Top"></a>
        <input type="hidden" id="currentPageId" value="${bkAbbr}"/>
        <input type="hidden" id="currentBkAbbr" value="${bkAbbr}"/>
        <input type="hidden" id="allNotesGenerationDone" value="false"/>
        ${genBookTitleHtml(bkData)}
        ${genChapterLinksHtml(bkData)}
        <div id="bookPreamble"${preambleVisibility}>
          ${genIntroHtml(bkData)}
          ${genSubjectHtml(bkData)}
        </div>
        ${getAllOutlinesVisible() ? genAllOutlinesHtml(bkData) : ""}
        ${genChaptersHtml(bkData, ch)}
        ${genPageFooterHtml(bkData, ch)}
        <a name="Bottom"></a>
      </div>
      `;
  }

  function genLinkToPrevBookHtml(bkAbbr) {
    const bk = BkAbbrNum[bkAbbr];
    const prevBk = bk === 0 ? BkAbbr.length - 1 : bk - 1;

    return BookRefUtils.linkPage(
      BkAbbr[prevBk],
      CHEVRON_LEFT,
      'class="chevron left"'
    );
  }

  function genLinkToNextBookHtml(bkAbbr) {
    const bk = BkAbbrNum[bkAbbr];
    const nextBk = bk === BkAbbr.length - 1 ? 0 : bk + 1;

    return BookRefUtils.linkPage(
      BkAbbr[nextBk],
      CHEVRON_RIGHT,
      'class="chevron right"'
    );
  }

  function genBookTitleHtml(bkData) {
    const allOutlinesToggler = BookRefUtils.linkCode(
      "BookHtml.toggleAllOutlines()",
      getAllOutlinesTogglerText(getAllOutlinesVisible()),
      `class="allOutlinesToggler"`
    );

    const allNotesToggler = BookRefUtils.linkCode(
      "BookHtml.toggleAllNotes()",
      getAllNotesTogglerText(getAllNotesVisible()),
      `class="allNotesToggler"`
    );

    return `
      <a name="${bkData.bkAbbr}"></a>
      <div class="bookTitleRow">
        ${genLinkToPrevBookHtml(bkData.bkAbbr)}
        <div class="bookTitle">${bkData.bigTitle}</div>
        ${genLinkToNextBookHtml(bkData.bkAbbr)}
      </div>
      <div class="bookTitleSubLinks">
          ${BookRefUtils.linkPage("Home", getString("Home Page"))} |
          ${allOutlinesToggler} |
          ${allNotesToggler}
      </div>
      `;
  }

  function genChapterLinksHtml(bkData) {
    const numChapters = BkNumChapters[bkData.bkNum];
    if (numChapters === 1) return "";

    return `
      <div class="chapterLinks">
          ${getString("Chapters")}
          <div class="links">
              ${genChapterNumberLinksHtml(bkData)}
          </div>
      </div>
      `;
  }

  function genChapterNumberLinksHtml(bkData) {
    const bkAbbr = bkData.bkAbbr;
    const numChapters = BkNumChapters[bkData.bkNum];

    let s = "";
    const dot = BLACK_CIRCLE;
    for (let ch = 1; ch <= numChapters; ch++) {
      const text =
        numChapters <= 9 || ch === 1 || ch === numChapters || ch % 5 === 0
          ? ch
          : dot;
      const attributes = text === dot ? 'class="dot"' : "";
      s += BookRefUtils.linkPage(`${bkAbbr}${ch}`, text, attributes);
    }
    return s;
  }

  function genIntroHtml(bkData) {
    const introLines = bkData.intro
      .map(
        (line) =>
          '<div class="bookIntroText">' +
          (line[0] ? "<b>" + line[0] + ":</b> " : "") +
          BookRefUtils.makeSimpleLinks(line[1]) +
          "</div>"
      )
      .join("\n");

    return `
      <a name="${bkData.bkAbbr}:intro"></a>
      <div class="bookIntro">
          <div class="bookIntroTitle">${getString(
            "Introduction to {1}",
            bkData.bkName
          )}</div>
          ${introLines}
      </div>
      `;
  }

  function genSubjectHtml(bkData) {
    return `
      <a name="${bkData.bkAbbr}:subject"></a>
      <div class="bookSubject">
        <div class="bookSubjectTitle">
          ${getString("Subject of {1}", bkData.bkName)}
        </div>
        <div>${bkData.subject}</div>
      </div>
      `;
  }

  function genChaptersHtml(bkData, chapterNumber) {
    const numChapters = bkData.numChapters;

    let s = "";
    for (let ch = 1; ch <= numChapters; ch++) {
      if (!chapterNumber || chapterNumber == ch) {
        s += `
          <div id="chapter${ch}" class="wholeChapter">
            ${genChapterInnerHtml(bkData, ch, numChapters)}
          </div>
          `;
      } else {
        s += `<div id="chapter${ch}" class="wholeChapter" style="display:none;"></div>`;
      }
    }
    return s;
  }

  // Dynamic generate all chapters when we are now showing one chapter only,
  // and the user clicks on "Show All Chapters".
  function genAllChapters() {
    const bkAbbr = currentBkAbbr();
    const bkData = BkData[bkAbbr];
    const numChapters = bkData.numChapters;

    for (let ch = 1; ch <= numChapters; ch++) {
      const element = $id(`chapter${ch}`);
      if (element.children.length === 0) {
        element.innerHTML = genChapterInnerHtml(bkData, ch, numChapters);
      }
    }
  }

  function genChapterInnerHtml(bkData, ch, numChapters) {
    return `
      <a name="${bkData.bkAbbr}${ch}"></a>
      ${genOneChapterHtml(bkData, ch, numChapters)}
      `;
  }

  function genPrevChapterLinkHtml(bkAbbr, ch) {
    return BookRefUtils.linkPage(
      BookRefUtils.getLinkToPreviousChapter(bkAbbr, ch),
      CHEVRON_LEFT,
      'class="chevron left"'
    );
  }

  function genNextChapterLinkHtml(bkAbbr, ch, numChapters) {
    return BookRefUtils.linkPage(
      BookRefUtils.getLinkToNextChapter(bkAbbr, ch, numChapters),
      CHEVRON_RIGHT,
      'class="chevron right"'
    );
  }

  function genChapterHeaderHtml(bkAbbr, ch, numChapters) {
    const oneChapterToggler = BookRefUtils.linkCode(
      `BookHtml.toggleOneChapterOnly(${ch})`,
      getString(getOneChapterOnly() ? "Show All Chapters" : "Show One Chapter"),
      `class="oneChapterOnlyToggler"`
    );

    const allNotesToggler = BookRefUtils.linkCode(
      `BookHtml.toggleAllNotes(${ch})`,
      getAllNotesTogglerText(getAllNotesVisible()),
      `class="allNotesToggler"`
    );

    const chapterTitle = BookRefUtils.linkPage(
      `Top`,
      getString("Chapter {1} of {2}", ch, numChapters),
      `data-toggle="tooltip" data-placement="top" title="${getString(
        "Back to Top"
      )}"`
    );

    return `
      <div class="chapterHeader">
          <div class="titleRow">
              ${genPrevChapterLinkHtml(bkAbbr, ch)}
              <span class="title">${chapterTitle}</span>
              ${genNextChapterLinkHtml(bkAbbr, ch, numChapters)}
          </div>
          <div class="links">
              ${BookRefUtils.linkPage(`Home`, getString("Home Page"))} |
              ${oneChapterToggler} |
              ${allNotesToggler}
          </div>
      </div>
      `;
  }

  // Currently applies only to Psalms.
  function genChapterTitleHtmlIfAny(bkData, ch, allNotesVisible) {
    if (!bkData.chTitle) return "";
    const title = bkData.chTitle[ch];
    if (!title) return "";

    const fullVerseRef = `${bkData.bkAbbr}${ch}:Title`;

    // Anchor HTML with regex placeholders.
    const anchorHtml = BookRefUtils.linkCode(
      `BookHtml.toggleXref('${fullVerseRef}^$1')`,
      "<sup>$1</sup>$2",
      `id="open-${fullVerseRef}^$1"`
    );

    const titleHtml = title.replace(superscriptRegex, anchorHtml);

    return `
      <a name="${fullVerseRef}"></a>
      <div class="chapterTitle">${titleHtml}</div>
      ${allNotesVisible ? genChapterTitleXrefsHtmlIfAny(fullVerseRef, ch) : ""}
      `;
  }

  function genChapterTitleXrefsHtmlIfAny(fullVerseRef, ch) {
    const bkAbbr = fullVerseRef.substring(0, 3);
    const bkData = BkData[bkAbbr];
    const notesRefs = bkData.chTitleNote;
    if (!ch) {
      ch = safeParseInt(fullVerseRef.substring(3).split(":")[0], 1);
    }
    const verseNotesRefs = notesRefs[ch];

    if (!verseNotesRefs) return "";

    return `
      <div class="verseXrefs" id="verseXrefs-${fullVerseRef}">
        ${verseNotesRefs
          .map((nr) => genOneChapterTitleXrefHtml(fullVerseRef, bkAbbr, ch, nr))
          .join("")}
      </div>
      `;
  }

  function genOneChapterTitleXrefHtml(fullVerseRef, bkAbbr, ch, note) {
    const header = BookRefUtils.linkCode(
      `BookHtml.toggleXref('${fullVerseRef}^${note.sup}')`,
      `<span><sup>${note.sup}</sup>${note.word ?? ""}</span>`,
      `id="open-${fullVerseRef}^${note.sup}"`
    );

    let text = "";
    if (note.text) {
      if (currentLocale === "zh-CN") {
        text = BookRefUtils.makeSimpleLinks(note.text);
      } else {
        text = BookRefUtils.makeVerseRefsLinks(bkAbbr, ch, 0, note.text);
      }
    }

    return `
      <div id="${bkAbbr}${ch}:Title^${note.sup}" class="xLine">
        <a name="${bkAbbr}${ch}:Title^${note.sup}"></a>
        <div>
          <span class="word">
            ${header}
          </span>
          ${
            note.vrefs
              ? BookRefUtils.makeOutlineVerseRefs(bkAbbr, ch, note.vrefs)
              : ""
          }
          ${text}
        </div>
      </div>
      `;
  }

  const VERSE_SPLIT_SEPARATOR = '<br class="split">';

  function splitVerseText(verseText, partAorB = undefined) {
    const v = verseText.split('<br class="split">');
    if (v.length !== 2) {
      console.error(`Verse must have 2 parts: ${verseText}`);
    }
    if (partAorB) {
      return partAorB === "a" ? v[0] : v[1];
    }
    return v;
  }

  function genOneChapterHtml(bkData, ch, numChapters) {
    const numVerses = BkChapterNumVerses[bkData.bkNum][ch - 1];
    const allNotesVisible = getAllNotesVisible();

    // Outlines at verse "-1" are for Psalm book titles.
    // They are special because they come before the chapter header.
    let s = genOutlineLineHtmlIfAny(bkData, ch, `${ch}:-1`);
    if (s) s = `<div class="chapterVerses">${s}</div>`;

    s += genChapterHeaderHtml(bkData.bkAbbr, ch, numChapters);
    s += '<div class="chapterVerses">';
    s += genChapterTitleHtmlIfAny(bkData, ch, allNotesVisible);
    for (let vn = 1; vn <= numVerses; vn++) {
      const verseText = bkData.verses[`${ch}:${vn}`];
      if (verseText.includes(VERSE_SPLIT_SEPARATOR)) {
        const [a, b] = splitVerseText(verseText);
        s += genVerseLineHtml(bkData, ch, vn, allNotesVisible, a, "a");
        s += genVerseLineHtml(bkData, ch, vn, allNotesVisible, b, "b");
      } else {
        s += genVerseLineHtml(bkData, ch, vn, allNotesVisible, verseText, "");
      }
    }
    return s + "</div>";
  }

  function getVersePartSuffix(partAorB) {
    return getString(partAorB === "a" ? "verse-part-a" : "verse-part-b");
  }

  function genVerseLineHtml(
    bkData,
    ch,
    vn,
    allNotesVisible,
    verseText,
    partAorB
  ) {
    const verseRef = ch + ":" + vn;
    const fullVerseRef = `${bkData.bkAbbr}${verseRef}`;
    const readableVref = bkData.numChapters == 1 ? vn : verseRef;

    let hasNotes;
    if (partAorB) {
      const verseText = bkData.verses[verseRef];
      const vt = splitVerseText(verseText, partAorB);
      hasNotes = vt.includes("[");
    } else {
      hasNotes = bkData.notesRefs.hasOwnProperty(verseRef);
    }

    const suffix = partAorB
      ? `<span class="partSuffix">${getVersePartSuffix(partAorB)}</span>`
      : "";

    const vrefTitle = hasNotes
      ? `<a class="verseRef" href="javascript:BookHtml.toggleVerseXrefs('${fullVerseRef}${partAorB}')"` +
        `>${bkData.bkRef}&nbsp;${readableVref}${suffix}</a>`
      : `<span class="verseRef">${bkData.bkRef}&nbsp;${readableVref}${suffix}</span>`;

    return `
      ${genOutlineLineHtmlIfAny(bkData, ch, verseRef, partAorB)}
      ${genVerseHeaderHtmlIfAny(bkData, verseRef)}
      ${!partAorB || partAorB === "a" ? `<a name="${fullVerseRef}"></a>` : ""}
      ${partAorB === "a" ? `<a name="${fullVerseRef}a"></a>` : ""}
      ${partAorB === "b" ? `<a name="${fullVerseRef}b"></a>` : ""}
      <div class="verseLine" ontouchend="doubleTapHighlight(this)">
        ${vrefTitle}
        ${genVerseTextHtml(fullVerseRef, verseText)}
      </div>
      ${allNotesVisible ? genVerseXrefsHtmlIfAny(fullVerseRef) : ""}
      `;
  }

  function genVerseHeaderHtmlIfAny(bkData, verseRef) {
    if (!bkData.vvInsert) return "";
    const header = bkData.vvInsert[verseRef];
    if (!header) return "";

    return `<div class="verseHeader">${header}</div>`;
  }

  const superscriptRegex = /\[([^\]]+)\]([\w\-]*)/g;

  function genVerseTextHtml(fullVerseRef, verseText) {
    // Convert all notes and cross-references into superscript and anchor links.
    const anchorHtml = BookRefUtils.linkCode(
      `BookHtml.toggleXref('${fullVerseRef}^$1')`,
      "<sup>$1</sup>$2",
      `id="open-${fullVerseRef}^$1"`
    );
    return verseText.replace(superscriptRegex, anchorHtml);
  }

  function getOrGenVerseXrefs(fullVerseRef) {
    // Play safe and don't create this block twice.
    let element = $id(`verseXrefs-${fullVerseRef}`);
    if (element) return $(element);

    const verseLine = findNextNonAnchorNameElement(
      $(`a[name="${fullVerseRef}"]`).next()
    );

    const html = genXrefsHtmlIfAny(fullVerseRef);
    if (!html) {
      return ToastNotifier.notifyError(`${fullVerseRef} has no notes or refs.`);
    }
    element = $(html);
    element.children().slideUp(0).hide();
    element.hide().insertAfter(verseLine);

    return element;
  }

  function genXrefsHtmlIfAny(fullVerseRef) {
    return fullVerseRef.endsWith(":Title")
      ? genChapterTitleXrefsHtmlIfAny(fullVerseRef)
      : genVerseXrefsHtmlIfAny(fullVerseRef);
  }

  // Create html for all xrefs within verse at once.
  // This is to ensure they are always ordered correctly.
  function genVerseXrefsHtmlIfAny(fullVerseRef) {
    const bkAbbr = fullVerseRef.substring(0, 3);
    let verseRef = fullVerseRef.substring(3);

    const partAorB = verseRef.endsWith("a")
      ? "a"
      : verseRef.endsWith("b")
      ? "b"
      : "";
    if (partAorB) {
      verseRef = verseRef.substring(0, verseRef.length - 1);
    }

    const bkData = BkData[bkAbbr];
    const notesRefs = bkData.notesRefs;
    let verseNotesRefs = notesRefs[verseRef];

    if (!verseNotesRefs) return "";

    // Split notes+refs for verse parts A or B.
    if (partAorB) {
      const bkData = BkData[bkAbbr];
      const verseText = bkData.verses[verseRef];
      const vt = splitVerseText(verseText, partAorB);

      verseNotesRefs = verseNotesRefs.filter((nr) =>
        vt.includes(`[${nr.sup}]`)
      );
      if (verseNotesRefs.length === 0) return "";
    }

    return `
      <div class="verseXrefs" id="verseXrefs-${fullVerseRef}">
        ${genVerseXrefsInnerHtml(bkAbbr, verseRef, verseNotesRefs)}
      </div>
      `;
  }

  function showXref(fullVerseXref) {
    // fullVerseXref contains ':' which cannot be used for jquery selectors.
    let xrefElement = $id(fullVerseXref);
    if (!xrefElement) {
      getOrGenVerseXrefs(fullVerseXref.split("^")[0]);
      xrefElement = $id(fullVerseXref);
    }
    xrefElement = $(xrefElement);

    if (xrefElement.is(":visible")) return;

    xrefElement.parent().show();
    xrefElement
      .slideDown("fast", () => {
        if (isOffScreen(xrefElement)) {
          jumpToElement(xrefElement, 0);
        }
      })
      .effect("highlight", {}, 500);
  }

  function hideXref(fullVerseXref) {
    // When the xref is offscreen, so that hiding it won't show any visible animation,
    // we highlight the xref anchor within the verse itself to show some user feedback.
    const xrefLink = $($id("open-" + fullVerseXref));
    xrefLink.effect("highlight", {}, 1500);

    const xrefElement = $($id(fullVerseXref));

    xrefElement.slideUp("fast", () => {
      const parent = xrefElement.parent();
      if (parent.children(":visible").length === 0) {
        parent.hide();
      }
    });
  }

  function toggleXref(fullVerseXref) {
    const xrefElement = $($id(fullVerseXref));
    if (xrefElement.length === 0 || xrefElement.is(":hidden")) {
      showXref(fullVerseXref);
    } else if (isOffScreen(xrefElement)) {
      tryGoAnchorInSamePage(fullVerseXref);
    } else {
      hideXref(fullVerseXref);
    }
  }

  function toggleVerseXrefs(fullVerseRef) {
    const verseXrefs = getOrGenVerseXrefs(fullVerseRef);

    if (verseXrefs.is(":visible")) {
      verseXrefs.slideUp(400, () => verseXrefs.find(".xLine").hide());
    } else {
      verseXrefs.find(".xLine").show().slideDown(0);
      verseXrefs.slideDown(400);
    }
  }

  function genVerseXrefsInnerHtml(bkAbbr, verseRef, verseNotesRefs) {
    const [ch, vn] = verseRef.includes(":")
      ? verseRef.split(":")
      : [1, verseRef];
    return verseNotesRefs
      .map((nr) => genOneXrefHtml(bkAbbr, ch, vn, nr))
      .join("\n");
  }

  function genOneXrefHtml(bkAbbr, ch, vn, notesRefs) {
    const readableVref = BkData[bkAbbr].numChapters == 1 ? vn : `${ch}:${vn}`;

    const header = BookRefUtils.linkCode(
      `BookHtml.toggleXref('${bkAbbr}${ch}:${vn}^${notesRefs.sup}')`,
      `${bkNames.BkRef[BkAbbrNum[bkAbbr]]} ${readableVref}<sup>${
        notesRefs.sup
      }</sup>`
    );

    // The extra span within .word is used to group the flex elements together.
    return `
      <div id="${bkAbbr}${ch}:${vn}^${notesRefs.sup}" class="xLine">
        <a name="${bkAbbr}${ch}:${vn}^${notesRefs.sup}"></a>
        <div>
          <span class="word"><span>${header}</span> ${
      notesRefs.word ?? ""
    }</span>
          ${genNotesRefTextHtml(bkAbbr, ch, vn, notesRefs)}
        </div>
      </div>
      `;
  }

  function genNotesRefTextHtml(bkAbbr, ch, vn, notesRefs) {
    let s = "";

    if (notesRefs.vrefs) {
      // This conversion is from raw text, hence is more complex.
      s += BookRefUtils.makeVerseRefsLinks(bkAbbr, ch, vn, notesRefs.vrefs);
    }

    if (notesRefs.lines) {
      const needPara = notesRefs.lines.length > 1;
      notesRefs.lines.forEach((line, index) => {
        const paraNum = getString("para. {1}", index + 1);
        s += `
          <div class="paragraph" ontouchend="doubleTapHighlight(this)">
            ${needPara ? `<span class="para">[${paraNum}]</span> ` : ""}
            ${BookRefUtils.makeSimpleLinks(line)}
          </div>`;
      });
    }

    return s;
  }

  function findXref(ch, vn, xref) {
    const bkAbbr = currentBkAbbr();
    const bkData = BkData[bkAbbr];
    const notesRefs = bkData.notesRefs;
    const verseRef = `${ch}:${vn}`;

    const xrefObjects = notesRefs[verseRef];
    if (!xrefObjects) {
      return null;
    }

    for (const xrefObject of xrefObjects) {
      const sup = xrefObject.sup;
      if (xref == sup) {
        return `${bkAbbr}${verseRef}^${sup}`;
      }

      // If sup contains any note in xref, then match.
      // e.g. sup='2b', xref='b' ==> match.
      for (let i = 0; i < xref.length; i++) {
        if (sup.includes(xref[i])) {
          return `${bkAbbr}${verseRef}^${sup}`;
        }
      }
    }

    return null;
  }

  function genOutlineLineHtmlIfAny(bkData, ch, verseRef, partAorB) {
    const verseOutlines = bkData.outlines[verseRef];
    const anchorSuffix = "";

    return verseOutlines
      ? genOutlineLineHtml(
          bkData.bkAbbr,
          ch,
          verseRef,
          verseOutlines,
          anchorSuffix,
          partAorB
        )
      : "";
  }

  // The outline link will look like 'Gen1:1o1' or 'Gen1:1o1(anchorSuffix)'.
  // 'o1' is the outline serial number to distinguish between multiple outlines for the same verse.
  // anchorSuffix will be '-all' for the outlines in the top section with all outlines.
  // anchorSuffix will be empty for the outlines inlined with the verse text.
  function genOutlineLineHtml(
    bkAbbr,
    ch,
    verseRef,
    verseOutlines,
    anchorSuffix,
    partAorB
  ) {
    const type = anchorSuffix ? "OUTLINE" : "TEXT";

    // Add serial numbers to each outline before filtering them.
    let serialNumber = 0;
    verseOutlines.forEach((o) => (o.serialNumber = ++serialNumber));

    // Skip outlines meant to be shown only in one place only.
    verseOutlines = verseOutlines.filter((o) => !o.type || o.type === type);
    if (verseOutlines.length === 0) return "";

    if (partAorB) {
      verseOutlines = verseOutlines.filter(
        (o) => (partAorB === "a" && !o.b) || (partAorB === "b" && o.b)
      );
      if (verseOutlines.length === 0) return "";
    }

    const innerHtml = genOutlineLineInnerHtml(
      bkAbbr,
      ch,
      verseRef,
      verseOutlines,
      anchorSuffix
    );

    // For all outlines, no need to wrap with outlineLine.
    if (type === "OUTLINE") {
      return innerHtml;
    }

    return `
      <div class="outlineLine">
        ${innerHtml}
      </div>
      `;
  }

  function genOutlineLineInnerHtml(
    bkAbbr,
    ch,
    verseRef,
    verseOutlines,
    anchorSuffix
  ) {
    return verseOutlines
      .map((outline) =>
        genOutlinePointHtml(bkAbbr, ch, verseRef, outline, anchorSuffix)
      )
      .join("");
  }

  function genOutlinePointHtml(bkAbbr, ch, verseRef, outline, anchorSuffix) {
    const anchorName = `${bkAbbr}${verseRef}o${outline.serialNumber}${anchorSuffix}`;

    const jumpToHref = getOutlineJumpTarget(
      bkAbbr,
      verseRef,
      outline,
      anchorSuffix
    );

    const point = outline.pt
      ? BookRefUtils.linkCode(
          `BookHtml.goOutline('${jumpToHref}')`,
          outline.pt,
          `class="numbering"`
        )
      : "";

    const text = outline.pt
      ? outline.text
      : BookRefUtils.linkPage(jumpToHref, outline.text);

    // Psalms verse refs will refer to the book name "Psalms", while other books will not
    // refer to book names, so need the full vref to link converter only for Psalms.
    const vrefs = outline.vrefs
      ? `&mdash; ` +
        (bkAbbr === "Psa"
          ? BookRefUtils.makeVerseRefsLinks(
              bkAbbr,
              ch,
              verseRef.split(":")[1],
              outline.vrefs
            )
          : BookRefUtils.makeOutlineVerseRefs(bkAbbr, ch, outline.vrefs))
      : "";

    // Wrap with an extra div to allow the link jump to highlight the whole line.
    return `
      <a name="${anchorName}"></a>
      <div>
        <div class="level${outline.lv}">
          ${outline.parens ? "(" : ""}
          ${point}
          ${text}
          ${outline.parens ? ")" : ""}
          ${vrefs}
        </div>
      </div>
      `;
  }

  function getOutlineJumpTarget(bkAbbr, verseRef, outline, anchorSuffix) {
    // linkToSuffix points to the same outline in the different location.
    const linkToSuffix = anchorSuffix ? "" : "-all";

    if (!outline.label) {
      return `${bkAbbr}${verseRef}o${outline.serialNumber}${linkToSuffix}`;
    }

    const type = anchorSuffix ? "OUTLINE" : "TEXT";
    const oref =
      type === "OUTLINE" ? outline.jumpToText : outline.jumpToAllOutlines;

    if (!oref) {
      console.error(
        `Missing outline jump ref! type=${type}, outline=${JSON.stringify(
          outline
        )}`
      );
    }

    return `${bkAbbr}${oref}${linkToSuffix}`;
  }

  function jumpToOutlinePoint(anchorName) {
    if (!tryGoAnchorInSamePage(anchorName)) {
      ToastNotifier.notifyError(
        getString("Missing jump ref to outline: {1}", anchorName)
      );
    }
  }

  function goOutline(anchorName) {
    if (anchorName.endsWith("-all")) {
      goOutlineInAllOutlines(anchorName);
    } else {
      goOutlineInText(anchorName);
    }
  }

  function goOutlineInAllOutlines(anchorName) {
    const isVisible = getAllOutlinesVisible();
    if (isVisible) {
      jumpToOutlinePoint(anchorName);
      return;
    }

    const allOutlines = getOrGenAllOutlines();
    allOutlines.slideDown(400, () => {
      initAllOutlinesClipping();
      jumpToOutlinePoint(anchorName);
    });
    updateAllOutlinesTogglerLabel(!isVisible);
  }

  function goOutlineInText(anchorName) {
    const match = anchorName.match(/^(\w\w\w)(\d+):\d+o\d+$/);
    if (!match) {
      console.error(`Bad outline jump ref: ${anchorName}`);
      return;
    }

    const bkAbbr = match[1];
    const ch = safeParseInt(match[2]);

    if (bkAbbr != currentBkAbbr()) {
      return goPage(anchorName);
    }

    ensureChapterIsVisible(ch);
    jumpToOutlinePoint(anchorName);
  }

  // Outlines is simpler than notes, because it is always a show all or nothing.
  function toggleAllOutlines() {
    const isVisible = getAllOutlinesVisible();
    if (isVisible) {
      $($id("allOutlines")).slideUp(400);
    } else {
      const allOutlines = getOrGenAllOutlines();
      allOutlines.slideDown(400, () => initAllOutlinesClipping());
    }
    updateAllOutlinesTogglerLabel(!isVisible);
  }

  function getOrGenAllOutlines() {
    let element = $id("allOutlines");
    if (element) return $(element);

    const bkAbbr = currentBkAbbr();
    const bkData = BkData[bkAbbr];
    element = $(genAllOutlinesHtml(bkData));
    element.hide().insertAfter($("#bookPreamble"));
    return element;
  }

  function genAllOutlinesHtml(bkData) {
    return `
      <div id="allOutlines">
          ${genAllOutlinesInnerHtml(bkData)}
      </div>
      `;
  }

  function initAllOutlinesClipping() {
    const element = getOrGenAllOutlines().find(".body");
    const allOutlinesExpanded = getAllOutlinesExpanded();

    // The max height is needed to support mobile displays.
    const maxHeight = getAllOutlinesMaxHeight();
    const needClipping = element.height() > maxHeight;
    if (!needClipping) return;

    const isClipped = element.hasClass("scroll");
    if (!isClipped && !allOutlinesExpanded) {
      element.addClass("scroll");

      // Add in the max height manually.
      element.css("max-height", maxHeight + "px");
    } else if (isClipped && allOutlinesExpanded) {
      element.removeClass("scroll");
      element.css("max-height", "");
    }

    // Don't use $(window).on() because it could bind multiple times.
    window.addEventListener("resize", refreshAllOutlinesClipping);

    // Add clip/expand toggle.
    $(".allOutlinesClipExpandToggler").show();
    updateAllOutlinesClipExpandTogglerLabel(allOutlinesExpanded);
  }

  function areAllOutlinesClipped() {
    return (
      $(".allOutlinesClipExpandToggler").is(":visible") &&
      !getAllOutlinesExpanded()
    );
  }

  function getAllOutlinesMaxHeight() {
    const h = Math.floor(($(window).height() - topNavBarHeight()) * 0.4);
    return Math.min(Math.max(h, 100), 500);
  }

  // Update max height when window resizes.
  function refreshAllOutlinesClipping() {
    const element = $("#allOutlines .body");
    if (element.length > 0 && element.hasClass("scroll")) {
      element.css("max-height", getAllOutlinesMaxHeight() + "px");
    }
  }

  function toggleAllOutlinesClipping() {
    const element = getOrGenAllOutlines().find(".body");
    if (element.hasClass("scroll")) {
      element.removeClass("scroll");
      element.css("max-height", "");
    } else {
      element.addClass("scroll");
      element.css("max-height", getAllOutlinesMaxHeight() + "px");
    }
    updateAllOutlinesClipExpandTogglerLabel(!getAllOutlinesExpanded());
  }

  function genAllOutlinesInnerHtml(bkData) {
    const controls = genAllOutlinesControlsHtml();

    return `
      <div class="header">${getString("Outlines of {1}", bkData.bkName)}</div>
      ${controls}
      <div class="body">
        <div class="outlineLine">
          ${genAllOutlinesBodyInnerHtml(bkData)}
        </div>
      </div>
      ${controls}
      `;
  }

  function genAllOutlinesControlsHtml() {
    const allOutlinesToggler = BookRefUtils.linkCode(
      "BookHtml.toggleAllOutlines()",
      getAllOutlinesTogglerText(true)
    );

    const clipExpandTogglerLink = BookRefUtils.linkCode(
      "BookHtml.toggleAllOutlinesClipping()",
      getAllOutlinesClipExpandTogglerText(getAllOutlinesExpanded())
    );

    return `
      <div class="controls">
        ${allOutlinesToggler}
        <span class="allOutlinesClipExpandToggler" style="display: none">
          | ${clipExpandTogglerLink}
        </span>
      </div>
      `;
  }

  function genAllOutlinesBodyInnerHtml(bkData) {
    return Object.entries(bkData.outlines)
      .map(([verseRef, outline]) => {
        const ch = verseRef.split(":")[0];

        // anchorSuffix is '-all' for the allOutlines section.
        return genOutlineLineHtml(bkData.bkAbbr, ch, verseRef, outline, "-all");
      })
      .join("\n");
  }

  // Notes are more complex than outlines because the user can always click
  // to show or hide any notes individually.
  function toggleAllNotes(ch) {
    if (!getOneChapterOnly() && ch > 1) {
      const bkAbbr = currentBkAbbr();
      const anchorTag = $(`a[name="${bkAbbr}${ch}"]`);
      const html = $("html");
      const body = $(document.body);

      const targetY = scrollTargetY(anchorTag);
      if (Math.abs(html.scrollTop() - targetY) < 30) {
        toggleChapterNotesContinue(html, body, anchorTag);
      } else {
        html
          .animate({ scrollTop: targetY }, { duration: 200 })
          .promise()
          .done(() => toggleChapterNotesContinue(html, body, anchorTag));
      }
    } else {
      toggleAllNotesInternal(400);
    }
  }

  function toggleChapterNotesContinue(html, body, anchorTag) {
    body
      .css({ opacity: 1.0, visibility: "visible" })
      .animate({ opacity: 0 }, { duration: 300 })
      .promise()
      .done(() => {
        toggleAllNotesInternal(0, () => {
          html.scrollTop(scrollTargetY(anchorTag));
          body.css({ opacity: 0 }).animate({ opacity: 1.0 }, { duration: 300 });
        });
      });
  }

  function toggleAllNotesInternal(animationInterval, callback) {
    const isVisible = getAllNotesVisible();
    if (isVisible) {
      $(".verseXrefs")
        .slideUp(animationInterval)
        .promise()
        .done(() => {
          $(".verseXrefs .xLine").hide();
          callback && callback();
        });
    } else {
      genAllNotesHtml();
      $(".verseXrefs .xLine").show().slideDown(0);
      $(".verseXrefs").slideDown(animationInterval).promise().done(callback);
    }
    updateAllNotesTogglerLabel(!isVisible);
  }

  function genAllNotesHtml() {
    // Don't waste time doing this more than once.
    const doneInput = getAllNotesGenerationDoneInput();
    if (doneInput.value === "true") return;
    doneInput.value = "true";

    // Collect all full verse refs with dedupe.
    const bkAbbr = currentBkAbbr();
    const bkData = BkData[bkAbbr];
    const notesRefs = bkData.notesRefs;

    // Generate refs for each verse.
    for (const verseRef of Object.keys(notesRefs)) {
      getOrGenVerseXrefs(bkAbbr + verseRef);
    }
  }

  function toggleOneChapterOnly(ch) {
    const oneChapterOnly = getOneChapterOnly();
    const chapterBox = $($id(`chapter${ch}`));
    const bkAbbr = currentBkAbbr();

    if (oneChapterOnly) {
      $($id("bookPreamble")).show();
      $(".wholeChapter").show();
      genAllChapters();
      updatePageFooterHtml(BkData[bkAbbr], 0);
    } else {
      // ch may be a string, so don't use '===' below.
      ch == 1 ? $($id("bookPreamble")).show() : $($id("bookPreamble")).hide();
      $(".wholeChapter").not(chapterBox).hide();
      chapterBox.show();
      updatePageFooterHtml(BkData[bkAbbr], ch);
    }

    tryGoAnchorInSamePage(bkAbbr + ch);
    updateOneChapterOnlyTogglerLabel(!oneChapterOnly);
  }

  function showOneChapterOnly(ch) {
    let chapterElement = $id(`chapter${ch}`);
    if (!chapterElement) {
      ch = 1;
      chapterElement = $id(`chapter1`);
      if (!chapterElement) {
        return ToastNotifier.notifyError(`Unknown chapter '${ch}'.`);
      }
    }
    const chapterBox = $(chapterElement);

    // ch may be a string, so don't use '===' below.
    ch == 1 ? $($id("bookPreamble")).show() : $($id("bookPreamble")).hide();
    $(".wholeChapter").not(chapterBox).hide();

    const bkData = BkData[currentBkAbbr()];

    if (chapterElement.children.length === 0) {
      const html = genChapterInnerHtml(bkData, ch, bkData.numChapters);
      chapterBox.append($(html));
    }
    chapterBox.show();
    updatePageFooterHtml(bkData, ch);

    updateOneChapterOnlyTogglerLabel(true);
  }

  function ensureChapterIsVisible(ch) {
    if (getOneChapterOnly()) {
      showOneChapterOnly(safeParseInt(ch, 1));
    }
  }

  function genPageFooterHtml(bkData, ch) {
    const bookName = ch
      ? genPageFooterInnerHtmlForOneChapterOnly(bkData, safeParseInt(ch))
      : genPageFooterInnerHtmlForAllChapters(bkData);

    return `
      <div class="footer">
        <div class="bookName">
          ${bookName}
        </div>
        <div class="links">
          ${BookRefUtils.linkPage("Home", getString("Home Page"))} |
          ${BookRefUtils.linkPage("Top", getString("Back to Top"))}
        </div>
      </div>
      `;
  }

  function genPageFooterInnerHtmlForOneChapterOnly(bkData, ch) {
    return `
      ${genPrevChapterLinkHtml(bkData.bkAbbr, ch)}
      <span class="header">
        ${getString("{1} {2} of {3}", bkData.bkName, ch, bkData.numChapters)}
      </span>
      ${genNextChapterLinkHtml(bkData.bkAbbr, ch, bkData.numChapters)}
      `;
  }

  function updatePageFooterHtml(bkData, ch) {
    const html = ch
      ? genPageFooterInnerHtmlForOneChapterOnly(bkData, ch)
      : genPageFooterInnerHtmlForAllChapters(bkData);

    $(".footer .bookName").html(html);
  }

  function genPageFooterInnerHtmlForAllChapters(bkData) {
    return `
      ${genLinkToPrevBookHtml(bkData.bkAbbr)}
      <span class="header">
        ${getString("Book of {1}", bkData.bkName)}
      </span>
      ${genLinkToNextBookHtml(bkData.bkAbbr)}
      `;
  }

  function jumpToRef(page, ref) {
    // Outlines.
    let match = ref.match(/^(\d+):\d+o\d+(-all)?$/);
    if (match) {
      const ch = match[1];
      const hasAll = !!match[2];

      if (hasAll) {
        return goOutline(page);
      } else {
        ensureChapterIsVisible(ch);
      }

      jumpToOutlinePoint(page);
      return;
    }

    // Note or ref.
    match = ref.match(/^(\d+):(\d+)\^(\w+)$/);
    if (match) {
      const ch = match[1];
      const vn = match[2];
      const xref = match[3];
      ensureChapterIsVisible(ch);

      // Find the correct xref to show.
      // page='Gen1:1^1' may need to show 'Gen1:1^1a' instead.
      const fullVerseXref = findXref(ch, vn, xref);
      if (fullVerseXref) {
        showXref(fullVerseXref);
      } else {
        ToastNotifier.notifyError(`Jump to unknown xref "${page}"`);
      }
      return;
    }

    // Verse.
    match = ref.match(/^(\d+):\d+$/);
    if (match) {
      const ch = match[1];
      ensureChapterIsVisible(ch);

      if (!tryGoAnchorInSamePage(page)) {
        ToastNotifier.notifyError(
          getString("Missing jump ref to verse: {1}", ref)
        );
      }
      return;
    }

    // Chapter.
    match = ref.match(/^\d+$/);
    if (match) {
      const ch = match[0];
      ensureChapterIsVisible(ch);

      if (!tryGoAnchorInSamePage(page)) {
        ToastNotifier.notifyError(
          getString("Missing jump ref to chapter: {1}", page)
        );
      }
      return;
    }

    ToastNotifier.notifyError(getString("Unknown jump to ref: {1}", ref));
  }

  function handleClickEvent(event) {
    const element = event.originalTarget;
    if (
      element?.classList.contains("verseLine") ||
      element?.classList.contains("paragraph")
    ) {
      $(element).toggleClass("highlight");
      event.preventDefault();
      event.stopPropagation();
    }
  }

  let initDone = false;

  function initOnce() {
    if (initDone) return;
    initDone = true;

    // Add click listener to highlight verses.
    // Since this potentially applies to a large number of elements, we only
    // register it once here as this seems like the simplest approach.
    // Important: This cannot be registered more than once.
    document.addEventListener("mouseup", handleClickEvent);

    // touchend does not work on mobile browsers because the event object is
    // "{isTrusted:true}" and not the proper object.
    // document.addEventListener("touchend", handleClickEvent);
  }

  function usePage(page, forceRerender = false) {
    const bkAbbr = page.substr(0, 3);

    if (!forceRerender && $currentPageId() === bkAbbr) {
      // Already in page, so do nothing.
      if (page.length === 3) return;

      const ref = page.substr(3);
      return jumpToRef(page, ref);
    }

    BookDataLoader.withBookData(
      bkAbbr,
      (bkData) => {
        let ch = null;
        if (getOneChapterOnly()) {
          const ref = page.substr(3);
          ch = 1;
          if (ref) {
            const match = ref.match(/^\d+/);
            if (match) {
              ch = match[0];
            }
          }
        }

        const html = genPageHtml(bkData, ch);
        setIndexContent(bkData.bkName, html);

        if (getAllOutlinesVisible()) {
          initAllOutlinesClipping();
        }

        if (page.length > 3) {
          jumpToRef(page, page.substr(3));
        } else {
          jumpToTop();
        }

        initOnce();
      },
      () => {
        undoNavigation();

        ToastNotifier.notifyError(
          getString(
            `Failed to load the book of {1}.`,
            bkNames.BkName[BkAbbrNum[bkAbbr]]
          )
        );
      }
    );
  }

  // Exports.
  return {
    usePage,
    goOutline,
    toggleAllOutlines,
    toggleAllNotes,
    toggleOneChapterOnly,
    toggleXref,
    toggleVerseXrefs,
    toggleAllOutlinesClipping,
    areAllOutlinesClipped,
  };
})();

// ***************************************************************************
//
//  Page navigation
//
// ***************************************************************************

function isOffScreen(element) {
  // This function doesn't work for elements inside scrollable divs.
  if (element.parents("#allOutlines .body").length > 0) {
    return true;
  }

  const rect = element[0].getBoundingClientRect();
  return (
    rect.x + rect.width < 0 ||
    rect.y + rect.height < 0 ||
    rect.x > window.innerWidth ||
    rect.y > window.innerHeight
  );
}

function findNextNonAnchorNameElement(element) {
  while (element.prop("tagName") === "A" && element[0].hasAttribute("name")) {
    element = element.next();
  }
  return element;
}

function tryGoAnchorInSamePage(page) {
  const anchorTag = $(`a[name="${page}"]`);
  if (anchorTag.length > 0 && anchorTag.is(":visible")) {
    if (isOffScreen(anchorTag)) {
      // Jumping to anchor tags works quite reliably, as opposed to jumping to some div.
      jumpToElement(anchorTag);
    } else {
      // Skip consecutive anchor name tags.
      const element = findNextNonAnchorNameElement(anchorTag.next());
      element.effect("highlight", {}, 3000);
    }
    return true;
  }
  return false;
}

function jumpToElement(element, highlightMillis = 3000) {
  if (element.length === 0) return;

  // Jumping will cause tooltips to become stranded.
  hideTooltips();

  if (element.attr("name") && element.attr("name").endsWith("-all")) {
    focusOnElementForAllOutlines(element);
  } else {
    focusOnElement(element);
  }

  if (highlightMillis) {
    element.next().effect("highlight", {}, highlightMillis);
  }
}

function focusOnElement(element) {
  let targetY = element.offset().top - topScrollOffset();
  if (targetY < 0) targetY = 0;
  $([document.documentElement, document.body]).scrollTop(targetY);
}

function focusOnElementForAllOutlines(element) {
  const isClipped = BookHtml.areAllOutlinesClipped();
  isClipped
    ? focusOnElementForClippedOutline(element)
    : focusOnElement(element);
}

function focusOnElementForClippedOutline(element) {
  focusOnElement($($id("allOutlines")));

  let targetY = element[0].offsetTop - topScrollOffset();
  if (targetY < 0) targetY = 0;
  $("#allOutlines .body")[0].scrollTop = targetY;
}

function jumpToTop() {
  window.scrollTo(0, 0);
}

// Use page='Home' to go to the home page.
function goPage(page) {
  const path = location.href.split("?")[0].split("#")[0];
  // const href = path + "?page=" + page + '#' + page;
  const href = path + "#" + page;

  // State and Title are both unsed. Use Href only.
  // This is because only href can be specified from the address bar by the user,
  // so we will need to handle it regardless of state and title.
  history.pushState(null, "", href);

  navigateToCurrentHref();
}

// Sometimes we change the window history but don't need to navigate anywhere.
let skipNavigateOnce = false;

function navigateToCurrentHref() {
  if (skipNavigateOnce) {
    skipNavigateOnce = false;
    return;
  }

  const page = location.hash.substr(1);
  if (page === $currentPageId()) {
    return undoNavigation();
  }

  navigateToPage(page);
}

function navigateToPage(page, forceRerender = false) {
  if (!page || page === "Home") {
    navigateToHomePage(forceRerender);
    return;
  }

  if (!forceRerender && tryGoAnchorInSamePage(page)) {
    return;
  }

  // Navigate to book.
  const bkAbbr = page.substring(0, 3);
  if (BkAbbrNum.hasOwnProperty(bkAbbr)) {
    BookHtml.usePage(page, forceRerender);
    return;
  }

  ToastNotifier.notifyError(getString("Unknown page: {1}", page));
  navigateToHomePage(forceRerender);
}

function navigateToHomePage(forceRerender = false) {
  // The location href might contain some invalid links, so just clean out
  // everything and replace with an empty state.
  history.replaceState(null, "", "index.html");

  IndexHtml.usePage(forceRerender);
}

function undoNavigation() {
  if ($currentPageId()) {
    // When user tries to navigate to an unknown page, go back and don't navigate anywhere.
    skipNavigateOnce = true;
    history.back();
  } else {
    navigateToHomePage();
  }
}

let pageInitDone = false;

function initPageOnce() {
  if (pageInitDone) return;
  pageInitDone = true;

  // Holder for all books data.
  window.BkData = {};
  window.onpopstate = navigateToCurrentHref;
}

function loadBookNames(onSuccess) {
  loadJsFile(
    `src/data/${currentLocale}/BookNames.js`,
    /* onSuccess */ () => {
      window.bkNames = BookNames[currentLocale];
      onSuccess();
    },
    /* onFailure */ () => {
      ToastNotifier.notifyError(getString("Failed to load book names."));
    }
  );
}

function fastReloadPage() {
  window.BkData = {};

  loadBookNames(() => {
    TopNavBar.fastRerender();
    navigateToPage(location.hash.substr(1), /* forceRerender */ true);
  });
}

function setCurrentLocale(locale) {
  currentLocale = locale;
  localStorage.setItem("locale", locale);
  fastReloadPage();
}

function switchCurrentLocale() {
  setCurrentLocale(currentLocale === "en" ? "zh-CN" : "en");
}

function onPageLoad() {
  initPageOnce();

  loadBookNames(() => {
    TopNavBar.insertIntoPage();
    navigateToCurrentHref();
  });
}

onPageLoad();
