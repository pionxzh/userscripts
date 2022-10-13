import sentinel from 'sentinel-js'
import { getBlockedUser } from './api'
import './style.scss'
import { onloadSafe } from './utils'

const url = new URL(window.location.href)

// 清理标题的 `(x 条消息 / x 封私信)` 和 ` - 知乎`
purifyDocumentTitle()

// 屏蔽黑名单用户
blockByBlackList()

// 屏蔽視頻回答
blockVideoAnswer()

// 自动收起回答 (问题页)
autoCollapseAnswers()

// 调整相关问题样式 (问题页)
adjustRelatedQuestions()

// 取消外链跳转
removeExternalLinkRedirection()

// 清理标题的 `(x 条消息 / x 封私信)` 和 ` - 知乎`
function purifyDocumentTitle() {
    const title = document.title
        .replace(/^\((\d{1,2}\+? 条消息)?( \/ )?(\d{1,2}\+? 封私信)?\) /, '')
        .replace(/^\((\d{1,2}\+? 封私信)?( \/ )?(\d{1,2}\+? 条消息)?\) /, '')
        .replace(/ - 知乎$/, '')
    document.title = title

    const titleEl = document.head.querySelector('title')!
    const mutationObserver = new MutationObserver(() => {
        if (document.title === title) return
        document.title = title
    })
    mutationObserver.observe(titleEl, { childList: true })
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

    const expandButtonSelector = 'div.List-item button.ContentItem-expandButton'
    const collapseButtonSelector = 'div.QuestionAnswer-content button[data-zop-retract-question="true"], div.List-item button[data-zop-retract-question="true"]'
    const collapseAnswer = (el: HTMLButtonElement) => {
        const answer = el.closest<HTMLDivElement>('div.QuestionAnswer-content, div.List-item')
        if (!answer) return
        if (answerWeakSet.has(answer)) return
        answerWeakSet.add(answer)
        if (answer.offsetHeight < 400) return

        if (el.classList.contains('ContentItem-expandButton')) return
        el.click()
    }

    document.querySelectorAll<HTMLButtonElement>(expandButtonSelector).forEach(collapseAnswer)
    document.querySelectorAll<HTMLButtonElement>(collapseButtonSelector).forEach(collapseAnswer)
    sentinel.on(collapseButtonSelector, collapseAnswer)
}

// 调整相关问题样式 (问题页)
function adjustRelatedQuestions() {
    if (!url.pathname.startsWith('/question/')) return

    onloadSafe(() => {
        const questionMain = document.querySelector<HTMLDivElement>('div.Question-main')
        const relatedQuestions = document.querySelector<HTMLDivElement>('div.Question-sideColumn div[aria-label="相关问题"]')
        const inviteBtn = document.querySelector<HTMLButtonElement>('div.QuestionHeaderActions button.Button')
        if (!questionMain || !relatedQuestions || !inviteBtn) return

        relatedQuestions.style.display = 'none'
        relatedQuestions.style.position = 'absolute'
        relatedQuestions.style.border = '1px solid #ebebeb'
        relatedQuestions.style.boxShadow = '0 5px 20px rgba(18,18,18,.1)'
        questionMain.after(relatedQuestions)

        const relatedQuestionBtn = document.createElement('button')
        relatedQuestionBtn.textContent = '相关问题'
        relatedQuestionBtn.classList.add('Button', 'Button--grey', 'Button--withIcon', 'Button--withLabel')
        relatedQuestionBtn.style.marginLeft = '0'
        relatedQuestionBtn.style.marginRight = '8px'
        inviteBtn.insertAdjacentElement('afterend', relatedQuestionBtn)

        const iconHtml = '&ZeroWidthSpace;<svg width="12" height="12" viewBox="0 0 24 24" data-new-api="OpposeFill24" data-old-api="TriangleDown" class="Zi Zi--TriangleDown Button-zi" fill="currentColor"><path d="M13.792 20.319c-.781 1.406-2.803 1.406-3.584 0L2.418 6.296c-.76-1.367.228-3.046 1.791-3.046h15.582c1.563 0 2.55 1.68 1.791 3.046l-7.79 14.023z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>'
        const icon = document.createElement('span')
        icon.style.display = 'inline-flex'
        icon.style.alignItems = 'center'
        icon.innerHTML = iconHtml
        relatedQuestionBtn.insertAdjacentElement('afterbegin', icon)

        let isHoveringBtn = false
        let isHoveringRelatedQuestions = false
        const onLeave = () => {
            setTimeout(() => {
                if (!isHoveringBtn && !isHoveringRelatedQuestions) {
                    relatedQuestions.style.display = 'none'
                }
            }, 200)
        }
        relatedQuestionBtn.addEventListener('mouseenter', () => {
            relatedQuestions.style.display = 'block'
            relatedQuestions.style.top = `${relatedQuestionBtn.offsetTop + relatedQuestionBtn.offsetHeight}px`
            relatedQuestions.style.left = `${relatedQuestionBtn.offsetLeft}px`
            isHoveringBtn = true
        })
        relatedQuestionBtn.addEventListener('mouseleave', () => {
            isHoveringBtn = false
            onLeave()
        })
        relatedQuestions.addEventListener('mouseenter', () => {
            isHoveringRelatedQuestions = true
        })
        relatedQuestions.addEventListener('mouseleave', () => {
            isHoveringRelatedQuestions = false
            onLeave()
        })
    })
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
