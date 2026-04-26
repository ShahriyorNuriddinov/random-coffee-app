import { supabase } from '@/lib/supabaseClient'

// Re-export supabase for screens that need direct queries
export { supabase }

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
// NOTE: profiles RLS allows reading all rows (public select policy added in admin SQL)
// matches uses user1_id/user2_id (supabase_stage2.sql version)

// incomeTab: 'today' | 'week' | 'month' | 'year'
export const getDashboardStats = async (incomeTab = 'week') => {
    const [profilesRes, matchesRes, momentsCountRes, paymentsRes, feedbackRes] = await Promise.all([
        supabase.from('profiles').select('id, created_at, subscription_status, gender', { count: 'exact' }),
        supabase.from('matches').select('id, created_at, status', { count: 'exact' }),
        supabase.from('moments').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount, created_at'),
        supabase.from('meeting_feedback').select('status, rating, fail_reason'),
    ])

    const profiles = profilesRes.data || []
    const matches = matchesRes.data || []
    const payments = paymentsRes.data || []

    const totalMembers = profilesRes.count || 0
    const activeMembers = profiles.filter(p => p.subscription_status === 'active').length
    const men = profiles.filter(p => p.gender === 'male').length
    const women = profiles.filter(p => p.gender === 'female').length

    const now = new Date()

    // Filter payments by incomeTab period
    const periodStart = (() => {
        const d = new Date(now)
        if (incomeTab === 'today') { d.setHours(0, 0, 0, 0); return d }
        if (incomeTab === 'week') return new Date(now - 7 * 24 * 60 * 60 * 1000)
        if (incomeTab === 'month') { d.setDate(1); d.setHours(0, 0, 0, 0); return d }
        if (incomeTab === 'year') { d.setMonth(0, 1); d.setHours(0, 0, 0, 0); return d }
        return new Date(now - 7 * 24 * 60 * 60 * 1000)
    })()

    const filteredPayments = payments.filter(p => new Date(p.created_at) >= periodStart)
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const newThisWeek = profiles.filter(p => new Date(p.created_at) > weekAgo).length

    // Revenue by day (last 7 days) — always show 7-day chart
    const revenueByDay = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now - (6 - i) * 24 * 60 * 60 * 1000)
        const dayStr = day.toLocaleDateString('en', { weekday: 'short' })
        const revenue = payments
            .filter(p => new Date(p.created_at).toDateString() === day.toDateString())
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        return { day: dayStr, revenue }
    })

    // Members by day (last 7 days)
    const membersByDay = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now - (6 - i) * 24 * 60 * 60 * 1000)
        const dayStr = day.toLocaleDateString('en', { weekday: 'short' })
        const count = profiles.filter(p => new Date(p.created_at).toDateString() === day.toDateString()).length
        return { day: dayStr, count }
    })

    // matches status — only completed = successful, null/active = pending (not yet confirmed)
    const successfulMatches = matches.filter(m => m.status === 'completed').length
    const cancelledMatches = matches.filter(m => m.status === 'cancelled').length
    const activeMatches = matches.filter(m => !m.status || m.status === 'active').length

    // Meeting satisfaction ratings from real meeting_feedback table
    const feedbacks = feedbackRes.data || []
    const successFeedbacks = feedbacks.filter(f => f.status === 'success' && f.rating)
    const total = successFeedbacks.length || 1
    const ratings = successFeedbacks.length > 0 ? {
        excellent: Math.round(successFeedbacks.filter(f => f.rating?.includes('Excellent')).length / total * 1000) / 10,
        good: Math.round(successFeedbacks.filter(f => f.rating?.includes('Good')).length / total * 1000) / 10,
        normal: Math.round(successFeedbacks.filter(f => f.rating?.includes('Fine')).length / total * 1000) / 10,
        bad: Math.round(successFeedbacks.filter(f => f.rating?.includes('Not great')).length / total * 1000) / 10,
    } : null

    // Also count cancelled from feedback (in case matches.status update fails due to RLS)
    const cancelledFromFeedback = feedbacks.filter(f => f.status === 'fail').length
    const effectiveCancelled = Math.max(cancelledMatches, cancelledFromFeedback)

    // Cancel reasons from failed feedbacks
    const failFeedbacks = feedbacks.filter(f => f.status === 'fail' && f.fail_reason)
    const cancelReasons = failFeedbacks.reduce((acc, f) => {
        acc[f.fail_reason] = (acc[f.fail_reason] || 0) + 1
        return acc
    }, {})

    return {
        totalMembers,
        activeMembers,
        men,
        women,
        totalRevenue,
        newThisWeek,
        totalMatches: matchesRes.count || 0,
        successfulMatches,
        activeMatches,
        cancelledMatches: effectiveCancelled,
        totalMoments: momentsCountRes.count || 0,
        revenueByDay,
        membersByDay,
        ratings,
        cancelReasons,
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
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
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
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
    if (error) {
        console.error('[getNews]', error.message)
        return []
    }
    // Attach empty reactions object (news_reactions table is optional)
    // If you add a news_reactions table later, fetch here
    return (data || []).map(n => ({ ...n, reactions: n.reactions || {} }))
}

export const createNews = async ({ text, text_zh, image_url, pinned = false }) => {
    const { data, error } = await supabase
        .from('news')
        .insert({ text, text_zh, image_url, pinned })
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
    const { error } = await supabase.from('news').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
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
    return data
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
