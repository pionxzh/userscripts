// ==UserScript==
// @name         MyPPT / LURL 助手
// @namespace    pionxzh
// @version      1.1.0
// @author       pionxzh
// @description  自動關年齡彈窗、以發布日期/今天日期自動試密碼解鎖，並一鍵下載原圖/影片
// @license      MIT
// @match        *://myppt.cc/*
// @match        *://*.myppt.cc/*
// @match        *://lurl.cc/*
// @match        *://*.lurl.cc/*
// @connect      myppt.cc
// @connect      lurl.cc
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(function() {
	"use strict";
	var s = new Set();
	var _css = async (t) => {
		if (s.has(t)) return;
		s.add(t);
		((c) => {
			if (typeof GM_addStyle === "function") GM_addStyle(c);
			else (document.head || document.documentElement).appendChild(document.createElement("style")).append(c);
		})(t);
	};
	var _GM_download = (() => typeof GM_download != "undefined" ? GM_download : void 0)();
	var _GM_xmlhttpRequest = (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
	_css(".myppt-dl-btn {\n  position: fixed;\n  right: 24px;\n  bottom: 24px;\n  z-index: 2147483647;\n  padding: 12px 22px;\n  border: none;\n  border-radius: 8px;\n  background: #ff5162;\n  color: #fff;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n  font-size: 16px;\n  font-weight: 600;\n  text-autospace: normal;\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n  cursor: pointer;\n}\n.myppt-dl-btn:disabled {\n  opacity: 0.7;\n  cursor: default;\n}\n\n.myppt-status {\n  position: fixed;\n  top: 12px;\n  left: 50%;\n  z-index: 2147483647;\n  padding: 8px 16px;\n  border-radius: 6px;\n  background: rgba(0, 0, 0, 0.82);\n  color: #fff;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif;\n  font-size: 14px;\n  text-autospace: normal;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);\n  transform: translateX(-50%);\n}");
	var LOG = "[myppt-helper]";
	var log = (...a) => console.log(LOG, ...a);
	try {
		document.cookie = `over18_years=true;path=/;max-age=31536000`;
	} catch {}
	function dismissPopups() {
		const over18 = document.querySelector("#confirmOver18");
		if (over18 && over18.offsetParent !== null) {
			log("點擊『我已年滿18歲』");
			over18.click();
		}
		document.querySelectorAll(".modal.show, #Modal_over18years").forEach((m) => {
			m.classList.remove("show");
			m.style.display = "none";
		});
		document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
		document.body?.classList.remove("modal-open");
		if (document.body) {
			document.body.style.overflow = "";
			document.body.style.paddingRight = "";
		}
		document.querySelectorAll("body *").forEach((el) => {
			const s = getComputedStyle(el);
			if (s.position !== "fixed") return;
			const r = el.getBoundingClientRect();
			const coversMost = r.width >= innerWidth * .9 && r.height >= innerHeight * .9;
			const key = `${el.id} ${el.className}`.toLowerCase();
			if (coversMost && /overlay|popup|interstitial|mask|cover/.test(key) && +s.zIndex >= 1e3) {
				log("移除疑似廣告遮罩:", el.id || el.className);
				el.remove();
			}
		});
	}
	var pad = (n) => String(n).padStart(2, "0");
	function getUploadDate() {
		const m = Array.from(document.querySelectorAll(".login_span")).find((s) => /上傳日期|\d{4}-\d{2}-\d{2}/.test(s.textContent ?? ""))?.textContent?.match(/(\d{4})-(\d{2})-(\d{2})/);
		return m ? {
			y: +m[1],
			mo: +m[2],
			d: +m[3]
		} : null;
	}
	function dateVariants(dt) {
		if (!dt) return [];
		const { y, mo, d } = dt;
		const MM = pad(mo);
		const DD = pad(d);
		const roc = y - 1911;
		return [
			MM + DD,
			DD + MM,
			`${mo}${d}`,
			`${y}${MM}${DD}`,
			MM + DD + y,
			`${roc}${MM}${DD}`
		];
	}
	function buildCandidates() {
		const upload = getUploadDate();
		const now = new Date();
		const today = {
			y: now.getFullYear(),
			mo: now.getMonth() + 1,
			d: now.getDate()
		};
		return [...new Set([...dateVariants(upload), ...dateVariants(today)].filter(Boolean))];
	}
	function findPasswordInput() {
		return document.querySelector("#pasahaicsword") ?? document.querySelector("input#password") ?? document.querySelector("form[id^=form_] input[type=text]:not([id=myppt_fuck]):not([type=hidden])");
	}
	function setNativeValue(input, value) {
		(Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set)?.call(input, value);
		input.dispatchEvent(new Event("input", { bubbles: true }));
		input.dispatchEvent(new Event("change", { bubbles: true }));
	}
	function submitPassword(password) {
		const input = findPasswordInput();
		if (!input) return false;
		const honey = document.querySelector("#myppt_fuck");
		if (honey) honey.value = "";
		log("嘗試密碼:", password);
		input.focus();
		input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
		setNativeValue(input, password);
		const btn = document.querySelector("#main_fjim60unBU") ?? document.querySelector("form[id^=form_] button[name=submit]") ?? document.querySelector("form[id^=form_] button");
		if (btn) {
			btn.click();
			return true;
		}
		const form = input.closest("form");
		if (form) {
			if (form.requestSubmit) form.requestSubmit();
			else form.submit();
		}
		return true;
	}
	var triedKey = `myppt-helper-tried:${location.pathname}`;
	var pendingKey = `myppt-helper-pending:${location.pathname}`;
	var ss = {
		get(k, d) {
			try {
				const v = sessionStorage.getItem(k);
				return v == null ? d : v;
			} catch {
				return d;
			}
		},
		set(k, v) {
			try {
				sessionStorage.setItem(k, v);
			} catch {}
		},
		del(k) {
			try {
				sessionStorage.removeItem(k);
			} catch {}
		}
	};
	function getTried() {
		try {
			return JSON.parse(ss.get(triedKey, "[]") ?? "[]");
		} catch {
			return [];
		}
	}
	var setTried = (a) => ss.set(triedKey, JSON.stringify(a));
	function submitReady() {
		const btn = document.querySelector("#main_fjim60unBU, #main_funBUTTON, form[id^=form_] button[name=submit], form[id^=form_] button");
		const hasJQuery = "jQuery" in window;
		return document.readyState === "complete" && hasJQuery && !!btn;
	}
	function tryNextPassword(attempt = 0) {
		const input = findPasswordInput();
		if (!input || input.offsetParent === null) {
			ss.del(pendingKey);
			return;
		}
		const pending = ss.get(pendingKey, null);
		if (pending) {
			const t = getTried();
			if (!t.includes(pending)) {
				t.push(pending);
				setTried(t);
			}
			ss.del(pendingKey);
		}
		if (!submitReady()) {
			if (attempt < 40) setTimeout(() => tryNextPassword(attempt + 1), 300);
			return;
		}
		const tried = getTried();
		const candidate = buildCandidates().find((p) => !tried.includes(p));
		if (!candidate) {
			log("候選密碼都試過仍未解鎖。");
			showStatus("自動試密碼失敗，請手動輸入密碼", 0);
			return;
		}
		ss.set(pendingKey, candidate);
		showStatus(`自動嘗試密碼：${candidate}`);
		submitPassword(candidate);
		setTimeout(() => {
			if (findPasswordInput() && ss.get(pendingKey, null) === candidate) {
				ss.del(pendingKey);
				tryNextPassword(0);
			}
		}, 3e3);
	}
	var MEDIA_RE = /\/\d{8}\/[0-9a-f]{16,}\.(?:jpg|jpeg|png|webp|gif|mp4|webm|m4v|mov)(?:\?|$)/i;
	var MEDIA_HOST_RE = /\/\/(?:mpr\d*|v\d*|img\d*|cdn\d*)\.(?:myppt|lurl)\.cc\//i;
	function findMediaUrl() {
		const mediaEls = Array.from(document.querySelectorAll("video source[src], video[src], #my_video_html5_api source[src]"));
		for (const v of mediaEls) {
			const s = v.getAttribute("src");
			if (s && /^https?:/.test(s)) return s;
		}
		const hit = performance.getEntriesByType("resource").map((e) => e.name).filter((u) => (MEDIA_RE.test(u) || MEDIA_HOST_RE.test(u)) && !/news_img|\.svg|thumb/i.test(u));
		return hit.length ? hit[hit.length - 1] : null;
	}
	function filenameFor(url) {
		let base = "myppt_media";
		try {
			base = new URL(url).pathname.split("/").pop() || base;
		} catch {}
		return `${location.pathname.replace(/\//g, "") || "myppt"}_${base}`;
	}
	function setBtn(btn, text, disabled, revertMs) {
		btn.textContent = text;
		btn.disabled = disabled;
		if (revertMs) setTimeout(() => {
			btn.textContent = "⬇ 下載原檔";
			btn.disabled = false;
		}, revertMs);
	}
	function xhrDownload(url, name, headers, btn) {
		_GM_xmlhttpRequest({
			method: "GET",
			url,
			headers,
			responseType: "blob",
			onload: (r) => {
				const blob = r.response;
				if (r.status >= 200 && r.status < 300 && blob) {
					const a = document.createElement("a");
					const obj = URL.createObjectURL(blob);
					a.href = obj;
					a.download = name;
					document.body.appendChild(a);
					a.click();
					a.remove();
					setTimeout(() => URL.revokeObjectURL(obj), 1e4);
					setBtn(btn, "✅ 已下載", false, 2500);
				} else {
					log("XHR 狀態:", r.status, "→ 開新分頁");
					window.open(url, "_blank");
					setBtn(btn, "⬇ 下載原檔", false);
				}
			},
			onerror: () => {
				window.open(url, "_blank");
				setBtn(btn, "⬇ 下載原檔", false);
			}
		});
	}
	function doDownload(url, btn) {
		const name = filenameFor(url);
		const headers = { Referer: location.href };
		log("下載:", url, "→", name);
		_GM_download({
			url,
			name,
			headers,
			onload: () => setBtn(btn, "✅ 已下載", false, 2500),
			onerror: (e) => {
				log("GM_download 失敗，改用 XHR:", e);
				xhrDownload(url, name, headers, btn);
			}
		});
	}
	function injectDownloadButton(url) {
		if (document.getElementById("myppt-dl-btn")) return;
		const btn = document.createElement("button");
		btn.id = "myppt-dl-btn";
		btn.className = "myppt-dl-btn";
		btn.type = "button";
		btn.textContent = "⬇ 下載原檔";
		btn.title = url;
		btn.addEventListener("click", () => {
			setBtn(btn, "⏳ 下載中…", true);
			const fresh = findMediaUrl() ?? url;
			btn.title = fresh;
			doDownload(fresh, btn);
		});
		document.body.appendChild(btn);
		log("已注入下載按鈕:", url);
	}
	function watchForMedia(tries = 0) {
		if (document.getElementById("myppt-dl-btn")) return;
		const url = findMediaUrl();
		if (url) {
			injectDownloadButton(url);
			return;
		}
		if (tries < 40) setTimeout(() => watchForMedia(tries + 1), 500);
	}
	function showStatus(text, autoHideMs = 2500) {
		if (!document.body) return;
		let el = document.getElementById("myppt-status");
		if (!el) {
			el = document.createElement("div");
			el.id = "myppt-status";
			el.className = "myppt-status";
			document.body.appendChild(el);
		}
		el.textContent = `${LOG} ${text}`;
		el.style.display = "block";
		if (autoHideMs > 0) {
			const node = el;
			setTimeout(() => {
				node.style.display = "none";
			}, autoHideMs);
		}
	}
	function run() {
		dismissPopups();
		tryNextPassword(0);
		watchForMedia();
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(run, 400));
	else setTimeout(run, 400);
})();
