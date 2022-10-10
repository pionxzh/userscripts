import sentinel from 'sentinel-js'
import { getBlockedUser } from './api'
import './style.scss'

const url = new URL(window.location.href);

(() => {
    // 清理标题的 `(x 条消息 / x 封私信)` 和 ` - 知乎`
    purifyDocumentTitle()

    // 屏蔽黑名单用户
    blockByBlackList()

    // 屏蔽視頻回答
    blockVideoAnswer()

    // 自动收起回答 (问题页)
    autoCollapseAnswers()

    // 取消外链跳转
    removeExternalLinkRedirection()
})()

// 清理标题的 `(x 条消息 / x 封私信)` 和 ` - 知乎`
function purifyDocumentTitle() {
    const purify = () => {
        const newTitle = document.title
            .replace(/^\((\d{1,2}\+? 条消息)?( \/ )?(\d{1,2}\+? 封私信)?\) /, '')
            .replace(/ - 知乎$/, '')
        document.title = newTitle
    }

    purify()
    window.addEventListener('focus', purify)
    window.addEventListener('visibilitychange', purify)
}

// 屏蔽黑名单用户
async function blockByBlackList() {
    const blockedUserList = await getBlockedUser()

    insertStyle(blockedUserList.map(user => `
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
`
        // remove comment
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')).join(''))

    // 屏蔽搜索结果
    sentinel.on('div.SearchResult-Card span[itemprop="articleBody"] > b[data-first-child]', (el) => {
        const username = el.textContent
        if (blockedUserList.some(user => user.name === username)) {
            el.closest('div.SearchResult-Card')?.classList.add('__BLOCKED__')
        }
    })
}

// 屏蔽視頻回答
function blockVideoAnswer() {
    sentinel.on('div.SearchResult-Card[data-za-extra-module]', (el) => {
        const extraModule = JSON.parse(el.dataset.zaExtraModule || '{}')
        if (extraModule?.card?.content?.type === 'Zvideo') {
            el.classList.add('__BLOCKED__')
        }
    })
}

// 自动收起回答 (问题页)
function autoCollapseAnswers() {
    if (!url.pathname.startsWith('/question/')) return

    const answerWeakSet = new WeakSet()
    const collapseButtonSelector = 'div.List-item button[data-zop-retract-question="true"]'
    const collapseAnswer = (el: HTMLButtonElement) => {
        const answer = el.closest<HTMLDivElement>('div.List-item')
        if (!answer) return
        if (answerWeakSet.has(answer)) return
        if (answer.offsetHeight < 400) return

        answerWeakSet.add(answer)
        el.click()
    }
    document.querySelectorAll<HTMLButtonElement>(collapseButtonSelector).forEach(collapseAnswer)
    sentinel.on(collapseButtonSelector, collapseAnswer)
}

// 取消外链跳转
function removeExternalLinkRedirection() {
    const selector = 'a[href^="https://link.zhihu.com/?target="]'
    const removeRedirection = (el: HTMLAnchorElement) => {
        const target = new URL(el.href).searchParams.get('target')
        if (target) el.href = target
    }
    document.querySelectorAll<HTMLAnchorElement>(selector).forEach(removeRedirection)
    sentinel.on(selector, removeRedirection)
}

function insertStyle(content: string) {
    const style = document.createElement('style')
    style.innerHTML = content
    document.head.appendChild(style)
}
