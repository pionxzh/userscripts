import sentinel from 'sentinel-js'
import { getBlockedUser } from './api'
import './style.scss'

function insertStyle(content: string) {
    const style = document.createElement('style')
    style.innerHTML = content
    document.head.appendChild(style)
}

(async() => {
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

// 屏蔽搜索结果
div.SearchResult-Card.blocked {
    display: none !important;
}


`
        // remove comment
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')).join(''))

    // 屏蔽搜索结果
    sentinel.on('div.SearchResult-Card span[itemprop="articleBody"] > b[data-first-child]', (el) => {
        const username = el.textContent
        if (blockedUserList.some(user => user.name === username)) {
            el.closest('div.SearchResult-Card')?.classList.add('blocked')
        }
    })

    // 屏蔽視頻回答
    sentinel.on('div.SearchResult-Card[data-za-extra-module]', (el) => {
        const extraModule = JSON.parse(el.dataset.zaExtraModule || '{}')
        if (extraModule?.card?.content?.type === 'Zvideo') {
            el.classList.add('blocked')
        }
    })
})()
