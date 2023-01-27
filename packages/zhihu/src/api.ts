import { GM_getValue, GM_setValue } from 'vite-plugin-monkey/dist/client'

export interface BlockedUser {
    id: string
    name: string
    type: string
    url: string
    url_token: string
    user_type: string
    is_followed: boolean
    is_following: boolean
    voteup_count: number
    answer_count: number
    question_count: number
    follower_count: number
    gender: number
    headline: string
    avatar_url: string
    badge: []
    vip_info: {
        is_vip: boolean
    }
}

interface Resp {
    data: BlockedUser[]
    paging: {
        is_end: boolean
        next: string
        previous: string
        totals: number
    }
}

const BLOCKED_USER_KEY = '__zhihu_blocked_user__'

async function fetchData(offset: number, limit: number): Promise<BlockedUser[]> {
    try {
        const url = `https://www.zhihu.com/api/v3/settings/blocked_users?offset=${offset}&limit=${limit}`
        const res = await fetch(url)
        const { data, paging } = await res.json() as Resp
        if (paging.is_end) return data

        const result = data.concat(await fetchData(offset + limit, limit))
        GM_setValue(BLOCKED_USER_KEY, result)
        return result
    }
    catch (error) {
        console.error('[Zhihu]', error)

        return GM_getValue(BLOCKED_USER_KEY, [])
    }
}

export function getBlockedUser() {
    // default limit: 6
    // maximum limit: 20

    const offset = 0
    const limit = 20

    return fetchData(offset, limit)
}
