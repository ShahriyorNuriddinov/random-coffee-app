// Supabase Edge Function: birthday-bonus
// Checks all users whose birthday is today and gives them credits.
// Uses birthday_bonus_given_at to prevent double-giving on same day.
// Called from Admin panel → Settings → "Run Birthday Bonus Now"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, content-type',
            }
        })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get birthday reward from app_settings
    const { data: settings } = await supabase
        .from('app_settings')
        .select('reward_birthday')
        .eq('id', 1)
        .single()

    const reward = Number(settings?.reward_birthday ?? 2)
    if (reward <= 0) {
        return new Response(
            JSON.stringify({ sent: 0, message: 'reward_birthday is 0, skipped' }),
            { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
    }

    // Today's date
    const today = new Date()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayStr = today.toISOString().slice(0, 10) // YYYY-MM-DD

    // Fetch active users with dob + birthday_bonus_given_at
    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, name, dob, birthday_bonus_given_at')
        .not('dob', 'is', null)
        .is('deleted_at', null)
        .eq('banned', false)

    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
    }

    // Filter: birthday today AND not already given today
    const birthdayUsers = (users || []).filter((u: any) => {
        if (!u.dob) return false
        const d = new Date(u.dob)
        const dobMm = String(d.getMonth() + 1).padStart(2, '0')
        const dobDd = String(d.getDate()).padStart(2, '0')
        if (dobMm !== mm || dobDd !== dd) return false
        // Prevent double-giving on same day
        if (u.birthday_bonus_given_at) {
            const givenDate = u.birthday_bonus_given_at.slice(0, 10)
            if (givenDate === todayStr) return false
        }
        return true
    })

    if (birthdayUsers.length === 0) {
        return new Response(
            JSON.stringify({ sent: 0, message: 'No birthdays today (or already given)' }),
            { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
    }

    let sent = 0
    for (const user of birthdayUsers) {
        // Give credits atomically
        const { error: rpcErr } = await supabase.rpc('increment_credits', {
            p_user_id: user.id,
            p_credits: reward,
        })
        if (!rpcErr) {
            sent++
            // Mark as given today to prevent duplicates
            await supabase
                .from('profiles')
                .update({ birthday_bonus_given_at: today.toISOString() })
                .eq('id', user.id)

            // Push notification (non-blocking)
            fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                    user_id: user.id,
                    title: '🎂 Happy Birthday!',
                    body: `You received ${reward} free coffee credit${reward > 1 ? 's' : ''} as a birthday gift! ☕`,
                    url: '/',
                }),
            }).catch(() => { })
        }
    }

    return new Response(
        JSON.stringify({ sent, total: birthdayUsers.length, reward }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
})
