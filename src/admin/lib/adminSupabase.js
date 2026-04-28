import { supabase } from '@/lib/supabaseClient'

// Re-export supabase for screens that need direct queries
export { supabase }

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
// Uses get_dashboard_stats() secure RPC for cached counts (admin-only).
// Revenue, charts, and feedback are fetched separately with live queries.

// incomeTab: 'today' | 'week' | 'month' | 'year'
export const getDashboardStats = async (incomeTab = 'week') => {
    const now = new Date()
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const twoMonthsAgo = new Date(now - 60 * 24 * 60 * 60 * 1000)

    // Period start for revenue tab
    const periodStart = (() => {
        const d = new Date(now)
        if (incomeTab === 'today') { d.setHours(0, 0, 0, 0); return d }
        if (incomeTab === 'week') return weekAgo
        if (incomeTab === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); return d }
        if (incomeTab === 'year') { d.setMonth(0, 1); d.setHours(0, 0, 0, 0); return d }
        return weekAgo
    })()

    // ── Parallel queries ───────────────────────────────────────────────────────
    const [
        cachedStatsRes,                                          // secure RPC — admin only
        totalMatchesRes, successMatchesRes, cancelledMatchesRes,
        momentsCountRes, revenueRes, chartPaymentsRes,
        chartProfilesRes, feedbackRes,
    ] = await Promise.all([
        supabase.rpc('get_dashboard_stats'),                     // replaces direct table access
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
        supabase.from('moments').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').gte('created_at', periodStart.toISOString()),
        supabase.from('payments').select('amount, created_at').gte('created_at', weekAgo.toISOString()),
        supabase.from('profiles').select('created_at').gte('created_at', weekAgo.toISOString()),
        supabase.from('meeting_feedback').select('status, rating, fail_reason'),
    ])

    // Extract cached stats (single row from materialized view)
    const cached = cachedStatsRes.data?.[0] || {}
    const totalMembers = Number(cached.total_members ?? 0)
    const activeMembers = Number(cached.active_members ?? 0)
    const men = Number(cached.men_count ?? 0)
    const women = Number(cached.women_count ?? 0)
    const newToday = Number(cached.new_today ?? 0)
    const newThisWeek = Number(cached.new_week ?? 0)
    const newThisMonth = Number(cached.new_month ?? 0)
    const newPrevMonth = Number(cached.new_prev_month ?? 0)
    const growthPct = newPrevMonth > 0
        ? Math.round((newThisMonth - newPrevMonth) / newPrevMonth * 100)
        : 0

    const payments = revenueRes.data || []
    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const chartPayments = chartPaymentsRes.data || []
    const chartProfiles = chartProfilesRes.data || []

    // Revenue by day (last 7 days)
    const revenueByDay = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now - (6 - i) * 24 * 60 * 60 * 1000)
        const dayStr = day.toLocaleDateString('en', { weekday: 'short' })
        const revenue = chartPayments
            .filter(p => new Date(p.created_at).toDateString() === day.toDateString())
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        return { day: dayStr, revenue }
    })

    // Members by day (last 7 days)
    const membersByDay = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now - (6 - i) * 24 * 60 * 60 * 1000)
        const dayStr = day.toLocaleDateString('en', { weekday: 'short' })
        const count = chartProfiles.filter(p => new Date(p.created_at).toDateString() === day.toDateString()).length
        return { day: dayStr, count }
    })

    const successfulMatches = successMatchesRes.count || 0
    const cancelledMatches = cancelledMatchesRes.count || 0
    const activeMatches = Math.max(0, (totalMatchesRes.count || 0) - successfulMatches - cancelledMatches)

    // Meeting satisfaction ratings
    const feedbacks = feedbackRes.data || []
    const successFeedbacks = feedbacks.filter(f => f.status === 'success' && f.rating)
    const total = successFeedbacks.length || 1
    const ratings = successFeedbacks.length > 0 ? {
        excellent: Math.round(successFeedbacks.filter(f => f.rating?.includes('Excellent')).length / total * 1000) / 10,
        good: Math.round(successFeedbacks.filter(f => f.rating?.includes('Good')).length / total * 1000) / 10,
        normal: Math.round(successFeedbacks.filter(f => f.rating?.includes('Fine')).length / total * 1000) / 10,
        bad: Math.round(successFeedbacks.filter(f => f.rating?.includes('Not great')).length / total * 1000) / 10,
    } : null

    const cancelledFromFeedback = feedbacks.filter(f => f.status === 'fail').length
    const effectiveCancelled = Math.max(cancelledMatches, cancelledFromFeedback)

    const failFeedbacks = feedbacks.filter(f => f.status === 'fail' && f.fail_reason)
    const cancelReasons = failFeedbacks.reduce((acc, f) => {
        acc[f.fail_reason] = (acc[f.fail_reason] || 0) + 1
        return acc
    }, {})

    return {
        totalMembers, activeMembers, men, women,
        totalRevenue, newThisWeek, newToday, growthPct,
        totalMatches: totalMatchesRes.count || 0,
        successfulMatches, activeMatches,
        cancelledMatches: effectiveCancelled,
        totalMoments: momentsCountRes.count || 0,
        revenueByDay, membersByDay, ratings, cancelReasons,
    }
}

// ─── MEMBERS ──────────────────────────────────────────────────────────────────
// Admin needs to read ALL profiles → requires RLS policy "profiles_admin_read"
// (added in supabase_admin_setup.sql)

export const getMembers = async ({ search = '', status = 'active', page = 0, limit = 20 } = {}) => {
    let query = supabase
        .from('profiles')
        .select('id, name, email, avatar_url, region, gender, created_at, subscription_status, coffee_credits, banned', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

    if (search) {
        // Escape special characters to prevent SQL injection
        const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&').trim()
        if (sanitizedSearch) {
            // Use textSearch for safer querying
            query = query.or(`name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`)
        }
    }

    if (status === 'active') query = query.eq('subscription_status', 'active')
    else if (status === 'inactive') query = query.neq('subscription_status', 'active').not('banned', 'eq', true)
    else if (status === 'banned') query = query.eq('banned', true)

    const { data, error, count } = await query
    if (error) {
        console.error('[getMembers]', error.message)
        return { members: [], total: 0 }
    }
    return { members: data || [], total: count || 0 }
}

export const getMemberById = async (id) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
    if (error) {
        console.error('[getMemberById]', error.message)
        return null
    }
    // Count moments and meetings in parallel, also get referrer phone
    const [{ count: momentsCount }, { count: meetingsCount }, referrerRes] = await Promise.all([
        supabase.from('moments').select('id', { count: 'exact', head: true }).eq('user_id', id),
        supabase.from('matches').select('id', { count: 'exact', head: true })
            .or(`user1_id.eq.${id},user2_id.eq.${id}`),
        data.referred_by
            ? supabase.from('profiles').select('email').eq('id', data.referred_by).single()
            : Promise.resolve({ data: null }),
    ])
    return {
        ...data,
        moments_count: momentsCount || 0,
        meetings_count: meetingsCount || 0,
        referred_by_phone: referrerRes?.data?.email || null,
    }
}

export const updateMember = async (id, updates) => {
    const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const banMember = async (id) => {
    const { error } = await supabase
        .from('profiles')
        .update({ banned: true, updated_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const unbanMember = async (id) => {
    const { error } = await supabase
        .from('profiles')
        .update({ banned: false, updated_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// ─── MOMENTS MODERATION ───────────────────────────────────────────────────────
// moments table: user_id is UUID (stage2), status col added by admin SQL

export const getMomentsAdmin = async ({ status = 'pending', page = 0, limit = 20 } = {}) => {
    let query = supabase
        .from('moments')
        .select(`id, text, image_url, image_urls, created_at, status, is_admin_post, author:user_id(id, name, avatar_url)`, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

    if (status !== 'all') query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) {
        console.error('[getMomentsAdmin]', error.message)
        return { moments: [], total: 0 }
    }
    return { moments: data || [], total: count || 0 }
}

export const approveMoment = async (id) => {
    const { error } = await supabase
        .from('moments')
        .update({ status: 'approved' })
        .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const rejectMoment = async (id, reason = '') => {
    const { error } = await supabase
        .from('moments')
        .update({ status: 'rejected', reject_reason: reason })
        .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// ─── NEWS ─────────────────────────────────────────────────────────────────────

export const getNews = async () => {
    const { data, error } = await supabase
        .from('news')
        .select('id, text, text_zh, text_ru, image_url, pinned, created_at, updated_at')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
    if (error) {
        console.error('[getNews]', error.message)
        return []
    }

    // Get all admin moments with their likes
    const { data: adminMoments } = await supabase
        .from('moments')
        .select('id, text, created_at')
        .eq('is_admin_post', true)

    let totalReactions = 0
    const momentReactions = {}

    if (adminMoments?.length > 0) {
        const { data: likes } = await supabase
            .from('moment_likes')
            .select('moment_id, emoji')
            .in('moment_id', adminMoments.map(m => m.id))

        if (likes) {
            totalReactions = likes.length
            for (const like of likes) {
                if (!momentReactions[like.moment_id]) momentReactions[like.moment_id] = {}
                momentReactions[like.moment_id][like.emoji] = (momentReactions[like.moment_id][like.emoji] || 0) + 1
            }
        }
    }

    // Match news posts to admin moments by text similarity (same text)
    const newsList = (data || []).map(n => {
        const matchedMoment = adminMoments?.find(m =>
            m.text === n.text || m.text === n.text_zh
        )
        const reactions = matchedMoment ? (momentReactions[matchedMoment.id] || {}) : {}
        return { ...n, reactions, reactions_count: Object.values(reactions).reduce((s, v) => s + v, 0) }
    })

    return { list: newsList, totalReactions }
}

export const createNews = async ({ text, text_zh, text_ru, image_url, pinned = false }) => {
    const { data, error } = await supabase
        .from('news')
        .insert({ text, text_zh, text_ru, image_url, pinned })
        .select()
        .single()
    if (error) return { success: false, error: error.message }
    return { success: true, data }
}

export const updateNews = async (id, updates) => {
    const { error } = await supabase
        .from('news')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const deleteNews = async (id) => {
    // Try to delete linked admin moment (best-effort, don't block on error)
    try {
        const { data: newsRow } = await supabase.from('news').select('moment_id').eq('id', id).single()
        if (newsRow?.moment_id) {
            await supabase.from('moments').delete().eq('id', newsRow.moment_id)
        }
    } catch { /* ignore */ }

    const { error } = await supabase.from('news').delete().eq('id', id)
    if (error) {
        console.error('[deleteNews]', error.message, error.code)
        return { success: false, error: error.message }
    }
    return { success: true }
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

export const getSettings = async () => {
    const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single()
    if (error) {
        console.error('[getSettings]', error.message)
        return null
    }
    if (!data) return null
    // Normalize booleans: null → default values
    return {
        ...data,
        lang_en: data.lang_en !== false,   // default true
        lang_zh: data.lang_zh !== false,   // default true
        lang_ru: data.lang_ru === true,    // default false
    }
}

export const saveSettings = async (settings) => {
    // Remove non-column fields
    const { id: _id, created_at: _c, ...rest } = settings
    const { error } = await supabase
        .from('app_settings')
        .upsert({ id: 1, ...rest, updated_at: new Date().toISOString() })
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const getStaff = async () => {
    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false })
    if (error) {
        console.error('[getStaff]', error.message)
        return []
    }
    return data || []
}

export const addStaff = async ({ name, email, phone, role }) => {
    const { error } = await supabase.from('staff').insert({ name, email, phone, role })
    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const removeStaff = async (id) => {
    const { error } = await supabase.from('staff').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

