// ==UserScript==
// @name         知乎助手
// @namespace    pionxzh
// @version      1.0.0
// @author       pionxzh
// @description  自动屏蔽来自黑名单的所有评论与文章
// @license      MIT
// @icon         https://static.zhihu.com/heifetz/favicon.ico
// @match        *.zhihu.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/sentinel-js/0.0.5//sentinel.min.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(t=>{const e=document.createElement("style");e.dataset.source="vite-plugin-monkey",e.innerText=t,document.head.appendChild(e)})(`div.SearchResult-Card:has(div[data-za-detail-view-path-is_ad=true]) {
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
      const url = `https://www.zhihu.com/api/v3/settings/blocked_users?offset=${offset}&limit=${limit}`;
      const res = await fetch(url);
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
  function insertStyle(content) {
    const style2 = document.createElement("style");
    style2.innerHTML = content;
    document.head.appendChild(style2);
  }
  (async () => {
    const blockedUserList = await getBlockedUser();
    insertStyle(blockedUserList.map((user) => `
// \u5C4F\u853D\u56DE\u7B54\u5185\u5BB9
div.css-194v73m:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) div.CommentContent,
div.css-8j5fyx:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) div.CommentContent {
    display: none !important;
}

// \u5C4F\u853D\u56DE\u7B54\u8005\u540D\u79F0
div.css-194v73m:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) a[href="https://www.zhihu.com/people/${user.id}"]:not(:has(img)),
div.css-8j5fyx:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) a[href="https://www.zhihu.com/people/${user.id}"]:not(:has(img)) {
    font-size: 0 !important;
}

// \u91CD\u65B0\u547D\u540D\u56DE\u7B54\u8005\u540D\u79F0
div.css-194v73m:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) a[href="https://www.zhihu.com/people/${user.id}"]:not(:has(img)):after,
div.css-8j5fyx:has(a[href="https://www.zhihu.com/people/${user.id}"] > img[alt="${user.name}"]) a[href="https://www.zhihu.com/people/${user.id}"]:not(:has(img)):after {
    content: "\u8BE5\u7528\u6237\u5DF2\u88AB\u5C4F\u853D";
    font-size: 15px;
    text-decoration: line-through;
}

// \u5C4F\u853D\u7528\u6237\u7684\u56DE\u7B54
div.List-item:has(div.AuthorInfo > meta[itemprop="name"][content="${user.name}"]),
div.SearchResult-Card:has(div.AuthorInfo > meta[itemprop="name"][content="${user.name}"]) {
    display: none !important;
}

// \u5C4F\u853D\u641C\u7D22\u7ED3\u679C
div.SearchResult-Card.blocked {
    display: none !important;
}


`.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "")).join(""));
    sentinel__default.default.on('div.SearchResult-Card span[itemprop="articleBody"] > b[data-first-child]', (el) => {
      var _a2;
      const username = el.textContent;
      if (blockedUserList.some((user) => user.name === username)) {
        (_a2 = el.closest("div.SearchResult-Card")) == null ? void 0 : _a2.classList.add("blocked");
      }
    });
    sentinel__default.default.on("div.SearchResult-Card[data-za-extra-module]", (el) => {
      var _a2, _b2;
      const extraModule = JSON.parse(el.dataset.zaExtraModule || "{}");
      if (((_b2 = (_a2 = extraModule == null ? void 0 : extraModule.card) == null ? void 0 : _a2.content) == null ? void 0 : _b2.type) === "Zvideo") {
        el.classList.add("blocked");
      }
    });
  })();
})(sentinel);
