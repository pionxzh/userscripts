// ==UserScript==
// @name         知乎助手
// @namespace    pionxzh
// @version      1.1.0
// @author       pionxzh
// @description  自动屏蔽来自黑名单的所有评论与文章
// @license      MIT
// @icon         https://static.zhihu.com/heifetz/favicon.ico
// @match        *.zhihu.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/sentinel-js/0.0.5//sentinel.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(e=>{const n=document.createElement("style");n.dataset.source="vite-plugin-monkey",n.innerText=e,document.head.appendChild(n)})(`div.SearchResult-Card.__BLOCKED__ {
  display: none !important;
}

div.SearchResult-Card:has(div[data-za-detail-view-path-is_ad=true]) {
  display: none !important;
}

div.List-item:has(.KfeCollection-AnswerTopCard-Container) {
  display: none !important;
}

div.List-item:has(.VideoAnswerPlayer) {
  display: none !important;
}

div.List-item .Reward {
  display: none !important;
}

footer.Footer {
  display: none !important;
}`);

(function(sentinel2) {
  var _a, _b;
  "use strict";
  const _interopDefaultLegacy = (e) => e && typeof e === "object" && "default" in e ? e : { default: e };
  const sentinel__default = /* @__PURE__ */ _interopDefaultLegacy(sentinel2);
  var r = (_a = document.__monkeyWindow) != null ? _a : window;
  r.GM;
  r.unsafeWindow = (_b = r.unsafeWindow) != null ? _b : window;
  r.unsafeWindow;
  r.GM_info;
  r.GM_cookie;
  var u = (...e) => r.GM_setValue(...e), h = (...e) => r.GM_getValue(...e);
  const BLOCKED_USER_KEY = "__zhihu_blocked_user__";
  async function fetchData(offset, limit) {
    try {
      const url2 = `https://www.zhihu.com/api/v3/settings/blocked_users?offset=${offset}&limit=${limit}`;
      const res = await fetch(url2);
      const { data, paging } = await res.json();
      if (paging.is_end)
        return data;
      const result = data.concat(await fetchData(offset + limit, limit));
      u(BLOCKED_USER_KEY, result);
      return result;
    } catch (error) {
      console.error("[Zhihu]", error);
      return h(BLOCKED_USER_KEY, []);
    }
  }
  function getBlockedUser() {
    const offset = 0;
    const limit = 20;
    return fetchData(offset, limit);
  }
  const style = "";
  const url = new URL(window.location.href);
  (() => {
    purifyDocumentTitle();
    blockByBlackList();
    blockVideoAnswer();
    autoCollapseAnswers();
    removeExternalLinkRedirection();
  })();
  function purifyDocumentTitle() {
    const purify = () => {
      const newTitle = document.title.replace(/^\((\d{1,2}\+? 条消息)?( \/ )?(\d{1,2}\+? 封私信)?\) /, "").replace(/ - 知乎$/, "");
      document.title = newTitle;
    };
    purify();
    window.addEventListener("focus", purify);
    window.addEventListener("visibilitychange", purify);
  }
  async function blockByBlackList() {
    const blockedUserList = await getBlockedUser();
    insertStyle(blockedUserList.map((user) => `
// 屏蔽回答内容
div.css-194v73m:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) div.CommentContent,
div.css-8j5fyx:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) div.CommentContent {
    display: none !important;
}

// 屏蔽回答者名称
div.css-194v73m:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) a[href="https://www.zhihu.com/people/${user.id}"]:not(:has(img)),
div.css-8j5fyx:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) a[href="https://www.zhihu.com/people/${user.id}"]:not(:has(img)) {
    font-size: 0 !important;
}

// 重新命名回答者名称
div.css-194v73m:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) a[href="https://www.zhihu.com/people/${user.id}"]:not(:has(img)):after,
div.css-8j5fyx:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) a[href="https://www.zhihu.com/people/${user.id}"]:not(:has(img)):after {
    content: "该用户已被屏蔽";
    font-size: 15px;
    text-decoration: line-through;
}

// 屏蔽用户的回答
div.List-item:has(div.AuthorInfo > meta[itemprop="name"][content="${user.name}"]),
div.SearchResult-Card:has(div.AuthorInfo > meta[itemprop="name"][content="${user.name}"]) {
    display: none !important;
}
`.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "")).join(""));
    sentinel__default.default.on('div.SearchResult-Card span[itemprop="articleBody"] > b[data-first-child]', (el) => {
      var _a2;
      const username = el.textContent;
      if (blockedUserList.some((user) => user.name === username)) {
        (_a2 = el.closest("div.SearchResult-Card")) == null ? void 0 : _a2.classList.add("__BLOCKED__");
      }
    });
  }
  function blockVideoAnswer() {
    sentinel__default.default.on("div.SearchResult-Card[data-za-extra-module]", (el) => {
      var _a2, _b2;
      const extraModule = JSON.parse(el.dataset.zaExtraModule || "{}");
      if (((_b2 = (_a2 = extraModule == null ? void 0 : extraModule.card) == null ? void 0 : _a2.content) == null ? void 0 : _b2.type) === "Zvideo") {
        el.classList.add("__BLOCKED__");
      }
    });
  }
  function autoCollapseAnswers() {
    if (!url.pathname.startsWith("/question/"))
      return;
    const answerWeakSet = /* @__PURE__ */ new WeakSet();
    const collapseButtonSelector = 'div.List-item button[data-zop-retract-question="true"]';
    const collapseAnswer = (el) => {
      const answer = el.closest("div.List-item");
      if (!answer)
        return;
      if (answerWeakSet.has(answer))
        return;
      if (answer.offsetHeight < 400)
        return;
      answerWeakSet.add(answer);
      el.click();
    };
    document.querySelectorAll(collapseButtonSelector).forEach(collapseAnswer);
    sentinel__default.default.on(collapseButtonSelector, collapseAnswer);
  }
  function removeExternalLinkRedirection() {
    const selector = 'a[href^="https://link.zhihu.com/?target="]';
    const removeRedirection = (el) => {
      const target = new URL(el.href).searchParams.get("target");
      if (target)
        el.href = target;
    };
    document.querySelectorAll(selector).forEach(removeRedirection);
    sentinel__default.default.on(selector, removeRedirection);
  }
  function insertStyle(content) {
    const style2 = document.createElement("style");
    style2.innerHTML = content;
    document.head.appendChild(style2);
  }
})(sentinel);
