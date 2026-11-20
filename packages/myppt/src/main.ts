import { GM_download, GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client'
import './style.scss'

const LOG = '[myppt-helper]'
const log = (...a: unknown[]) => console.log(LOG, ...a)

// ---------------------------------------------------------------------------
// 0. 最優先：document-start 寫入 domain-wide 年齡 cookie，年齡彈窗連跳都不跳
//    （站方效期只給 1 天，這裡寫 1 年）
// ---------------------------------------------------------------------------
try {
    document.cookie = `over18_years=true;path=/;max-age=${60 * 60 * 24 * 365}`
}
catch { /* ignore */ }

// ---------------------------------------------------------------------------
// 1. 關閉年齡彈窗 + 廣告遮罩（cookie 失效 / 改版時的保險）
// ---------------------------------------------------------------------------
function dismissPopups(): void {
    const over18 = document.querySelector<HTMLElement>('#confirmOver18')
    if (over18 && over18.offsetParent !== null) {
        log('點擊『我已年滿18歲』')
        over18.click()
    }
    document.querySelectorAll<HTMLElement>('.modal.show, #Modal_over18years').forEach((m) => {
        m.classList.remove('show')
        m.style.display = 'none'
    })
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove())
    document.body?.classList.remove('modal-open')
    if (document.body) {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
    }
    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
        const s = getComputedStyle(el)
        if (s.position !== 'fixed') return
        const r = el.getBoundingClientRect()
        const coversMost = r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9
        const key = `${el.id} ${el.className}`.toLowerCase()
        if (coversMost && /overlay|popup|interstitial|mask|cover/.test(key) && +s.zIndex >= 1000) {
            log('移除疑似廣告遮罩:', el.id || el.className)
            el.remove()
        }
    })
}

// ---------------------------------------------------------------------------
// 2. 密碼候選
// ---------------------------------------------------------------------------
interface YMD { y: number, mo: number, d: number }

const pad = (n: number) => String(n).padStart(2, '0')

function getUploadDate(): YMD | null {
    const span = Array.from(document.querySelectorAll('.login_span'))
        .find(s => /上傳日期|\d{4}-\d{2}-\d{2}/.test(s.textContent ?? ''))
    const m = span?.textContent?.match(/(\d{4})-(\d{2})-(\d{2})/)
    return m ? { y: +m[1], mo: +m[2], d: +m[3] } : null
}

function dateVariants(dt: YMD | null): string[] {
    if (!dt) return []
    const { y, mo, d } = dt
    const MM = pad(mo)
    const DD = pad(d)
    const roc = y - 1911
    return [
        MM + DD, // 1020
        DD + MM, // 2010
        `${mo}${d}`, // 無前導 0
        `${y}${MM}${DD}`, // 20261020
        MM + DD + y, // 10202026
        `${roc}${MM}${DD}`, // 民國 1151020
    ]
}

function buildCandidates(): string[] {
    const upload = getUploadDate()
    const now = new Date()
    const today: YMD = { y: now.getFullYear(), mo: now.getMonth() + 1, d: now.getDate() }
    return [...new Set([...dateVariants(upload), ...dateVariants(today)].filter(Boolean))]
}

// ---------------------------------------------------------------------------
// 3. 填密碼 + 送出（沿用站方送出流程才會帶對反爬欄位）
// ---------------------------------------------------------------------------
function findPasswordInput(): HTMLInputElement | null {
    return document.querySelector<HTMLInputElement>('#pasahaicsword')
        ?? document.querySelector<HTMLInputElement>('input#password')
        ?? document.querySelector<HTMLInputElement>(
            'form[id^=form_] input[type=text]:not([id=myppt_fuck]):not([type=hidden])',
        )
}

function setNativeValue(input: HTMLInputElement, value: string): void {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
}

function submitPassword(password: string): boolean {
    const input = findPasswordInput()
    if (!input) return false
    const honey = document.querySelector<HTMLInputElement>('#myppt_fuck')
    if (honey) honey.value = '' // 蜜罐欄位須留空，否則站方靜默擋下
    log('嘗試密碼:', password)
    input.focus()
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true })) // 觸發站方重算 pp_a
    setNativeValue(input, password)
    const btn = document.querySelector<HTMLElement>('#main_fjim60unBU')
        ?? document.querySelector<HTMLElement>('form[id^=form_] button[name=submit]')
        ?? document.querySelector<HTMLElement>('form[id^=form_] button')
    if (btn) {
        btn.click()
        return true
    }
    const form = input.closest('form')
    if (form) {
        if (form.requestSubmit) form.requestSubmit()
        else form.submit()
    }
    return true
}

// 兩段式記錄：candidate 只有「真的送出並觸發 reload」才算 tried（避免正確的第一個
// 候選在按鈕 handler 還沒綁好時被誤標試過）。pending = 送出中（未確認）。
const triedKey = `myppt-helper-tried:${location.pathname}`
const pendingKey = `myppt-helper-pending:${location.pathname}`

const ss = {
    get(k: string, d: string | null): string | null {
        try {
            const v = sessionStorage.getItem(k)
            return v == null ? d : v
        }
        catch { return d }
    },
    set(k: string, v: string): void {
        try {
            sessionStorage.setItem(k, v)
        }
        catch { /* ignore */ }
    },
    del(k: string): void {
        try {
            sessionStorage.removeItem(k)
        }
        catch { /* ignore */ }
    },
}

function getTried(): string[] {
    try {
        return JSON.parse(ss.get(triedKey, '[]') ?? '[]') as string[]
    }
    catch { return [] }
}
const setTried = (a: string[]) => ss.set(triedKey, JSON.stringify(a))

// 送出按鈕 handler 綁好了沒 — 粗略以「頁面 complete + jQuery 載入 + 按鈕存在」判斷
function submitReady(): boolean {
    const btn = document.querySelector(
        '#main_fjim60unBU, #main_funBUTTON, form[id^=form_] button[name=submit], form[id^=form_] button',
    )
    const hasJQuery = 'jQuery' in window
    return document.readyState === 'complete' && hasJQuery && !!btn
}

function tryNextPassword(attempt = 0): void {
    const input = findPasswordInput()
    if (!input || input.offsetParent === null) {
        ss.del(pendingKey) // 已解鎖 / 不需密碼
        return
    }

    // 若這次是「上一個 pending 送出造成的 reload」回來，代表那候選確實試過了 → 轉正
    const pending = ss.get(pendingKey, null)
    if (pending) {
        const t = getTried()
        if (!t.includes(pending)) {
            t.push(pending)
            setTried(t)
        }
        ss.del(pendingKey)
    }

    if (!submitReady()) {
        if (attempt < 40) setTimeout(() => tryNextPassword(attempt + 1), 300)
        return // 等頁面與 handler 就緒再送，避免浪費第一個候選
    }

    const tried = getTried()
    const candidate = buildCandidates().find(p => !tried.includes(p))
    if (!candidate) {
        log('候選密碼都試過仍未解鎖。')
        showStatus('自動試密碼失敗，請手動輸入密碼', 0)
        return
    }

    ss.set(pendingKey, candidate) // 標記送出中（尚未確認）
    showStatus(`自動嘗試密碼：${candidate}`)
    submitPassword(candidate) // 成功/失敗站方都會 location.reload

    // 3 秒內沒 reload（代表點擊沒觸發送出）→ 清掉 pending 重試，不浪費候選
    setTimeout(() => {
        if (findPasswordInput() && ss.get(pendingKey, null) === candidate) {
            ss.del(pendingKey)
            tryNextPassword(0)
        }
    }, 3000)
}

// ---------------------------------------------------------------------------
// 4. 下載：直接取原始檔 URL（不經 canvas，保留原解析度）
//    URL 由站方 /js/ajax_url.php 回傳後載入，撈 performance resource entries。
// ---------------------------------------------------------------------------
const MEDIA_RE = /\/\d{8}\/[0-9a-f]{16,}\.(?:jpg|jpeg|png|webp|gif|mp4|webm|m4v|mov)(?:\?|$)/i
const MEDIA_HOST_RE = /\/\/(?:mpr\d*|v\d*|img\d*|cdn\d*)\.(?:myppt|lurl)\.cc\//i

function findMediaUrl(): string | null {
    const mediaEls = Array.from(document.querySelectorAll<HTMLSourceElement | HTMLVideoElement>(
        'video source[src], video[src], #my_video_html5_api source[src]',
    ))
    for (const v of mediaEls) {
        const s = v.getAttribute('src')
        if (s && /^https?:/.test(s)) return s
    }
    const hit = performance.getEntriesByType('resource')
        .map(e => e.name)
        .filter(u => (MEDIA_RE.test(u) || MEDIA_HOST_RE.test(u)) && !/news_img|\.svg|thumb/i.test(u))
    return hit.length ? hit[hit.length - 1] : null
}

function filenameFor(url: string): string {
    let base = 'myppt_media'
    try {
        base = new URL(url).pathname.split('/').pop() || base
    }
    catch { /* ignore */ }
    const code = location.pathname.replace(/\//g, '') || 'myppt'
    return `${code}_${base}`
}

function setBtn(btn: HTMLButtonElement, text: string, disabled: boolean, revertMs?: number): void {
    btn.textContent = text
    btn.disabled = disabled
    if (revertMs) {
        setTimeout(() => {
            btn.textContent = '⬇ 下載原檔'
            btn.disabled = false
        }, revertMs)
    }
}

function xhrDownload(url: string, name: string, headers: Record<string, string>, btn: HTMLButtonElement): void {
    GM_xmlhttpRequest({
        method: 'GET',
        url,
        headers,
        responseType: 'blob',
        onload: (r) => {
            const blob = r.response as Blob | undefined
            if (r.status >= 200 && r.status < 300 && blob) {
                const a = document.createElement('a')
                const obj = URL.createObjectURL(blob)
                a.href = obj
                a.download = name
                document.body.appendChild(a)
                a.click()
                a.remove()
                setTimeout(() => URL.revokeObjectURL(obj), 10000)
                setBtn(btn, '✅ 已下載', false, 2500)
            }
            else {
                log('XHR 狀態:', r.status, '→ 開新分頁')
                window.open(url, '_blank')
                setBtn(btn, '⬇ 下載原檔', false)
            }
        },
        onerror: () => {
            window.open(url, '_blank')
            setBtn(btn, '⬇ 下載原檔', false)
        },
    })
}

function doDownload(url: string, btn: HTMLButtonElement): void {
    const name = filenameFor(url)
    const headers = { Referer: location.href }
    log('下載:', url, '→', name)
    GM_download({
        url,
        name,
        headers,
        onload: () => setBtn(btn, '✅ 已下載', false, 2500),
        onerror: (e) => {
            log('GM_download 失敗，改用 XHR:', e)
            xhrDownload(url, name, headers, btn)
        },
    })
}

function injectDownloadButton(url: string): void {
    if (document.getElementById('myppt-dl-btn')) return
    const btn = document.createElement('button')
    btn.id = 'myppt-dl-btn'
    btn.className = 'myppt-dl-btn'
    btn.type = 'button'
    btn.textContent = '⬇ 下載原檔'
    btn.title = url
    btn.addEventListener('click', () => {
        setBtn(btn, '⏳ 下載中…', true)
        const fresh = findMediaUrl() ?? url // 點擊當下重撈最新 URL
        btn.title = fresh
        doDownload(fresh, btn)
    })
    document.body.appendChild(btn)
    log('已注入下載按鈕:', url)
}

function watchForMedia(tries = 0): void {
    if (document.getElementById('myppt-dl-btn')) return
    const url = findMediaUrl()
    if (url) {
        injectDownloadButton(url)
        return
    }
    if (tries < 40) setTimeout(() => watchForMedia(tries + 1), 500) // 最多等 ~20 秒
}

// ---------------------------------------------------------------------------
// 畫面狀態提示（讓使用者看得到腳本在做什麼，不用猜）
// ---------------------------------------------------------------------------
function showStatus(text: string, autoHideMs = 2500): void {
    if (!document.body) return
    let el = document.getElementById('myppt-status')
    if (!el) {
        el = document.createElement('div')
        el.id = 'myppt-status'
        el.className = 'myppt-status'
        document.body.appendChild(el)
    }
    el.textContent = `${LOG} ${text}`
    el.style.display = 'block'
    if (autoHideMs > 0) {
        const node = el
        setTimeout(() => {
            node.style.display = 'none'
        }, autoHideMs)
    }
}

// ---------------------------------------------------------------------------
function run(): void {
    dismissPopups()
    tryNextPassword(0) // 內部自帶 ready gate
    watchForMedia()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 400))
}
else {
    setTimeout(run, 400)
}
