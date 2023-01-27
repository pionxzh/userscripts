import './style.scss'

function detectPage() {
    const url = new URL(window.location.href)
    let page = 'main'
    if (url.pathname === '/post') page = 'post'
    else if (url.pathname === '/search') {
        const type = url.searchParams.get('type') ?? '0'
        // 课程
        if (type === '12') page = 'search-course'
        // others
        else page = 'search'
    }

    document.body.setAttribute('data-juejin-page', page)
}

(() => {
    console.log(`[Juejin Plus] v${__VERSION__}`)

    detectPage()
    window.addEventListener('popstate', () => {
        detectPage()
    })
})()
