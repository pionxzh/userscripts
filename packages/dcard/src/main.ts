import './style.scss'

const authUrl = 'https://www.dcard.tw/service/_auth/authorize';

(() => {
    console.log('[Dcard 助手] is running...')

    loginModalRemover()
})()

function isLoggedIn() {
    const links = Array.from<HTMLAnchorElement>(document.querySelectorAll('div[role="navigation"] > a'))
    return !links.some(link => link.href.startsWith(authUrl))
}

function loginModalRemover() {
    if (isLoggedIn()) return

    const portalEl = document.querySelector('.__portal')
    if (!portalEl) {
        console.log('[Dcard 助手] Failed to find portal element')
        return
    }

    const observe = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    const el = node as HTMLElement
                    const iframe = el.querySelector('iframe')
                    // use iframe detection to avoid hard-code
                    if (iframe && iframe.src.startsWith(authUrl)) {
                        el.style.display = 'none'
                    }
                })
            }
        })
    })

    observe.observe(portalEl, { childList: true })
}
