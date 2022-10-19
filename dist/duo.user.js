// ==UserScript==
// @name               Duo Security Auto Push
// @name:en            Duo Security Auto Push
// @name:zh_cn         Duo Security 自动推送
// @name:zh_tw         Duo Security 自動推送
// @namespace          pionxzh
// @version            1.0.0
// @author             pionxzh
// @description        Press "Send Me a Push" automatically for you
// @description:en     Press "Send Me a Push" automatically for you
// @description:zh_cn  自动按下 "Send Me a Push"
// @description:zh_tw  自動按下 "Send Me a Push"
// @license            MIT
// @icon               https://www.google.com/s2/favicons?sz=64&domain=duosecurity.com
// @match              https://*.duosecurity.com/frame/prompt?sid=*
// @match              https://*.duosecurity.com/frame/web/v1/auth?
// ==/UserScript==

(function() {
  "use strict";
  function onloadSafe(fn) {
    if (document.readyState === "complete") {
      fn();
    } else {
      window.addEventListener("load", fn);
    }
  }
  onloadSafe(() => {
    const authButton = document.querySelector(".push-label button.auth-button");
    if (authButton)
      authButton.click();
  });
})();
