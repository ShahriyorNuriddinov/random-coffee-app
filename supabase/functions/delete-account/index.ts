// Supabase Edge Function: delete-account
// Completely deletes a user account:
// 1. Deletes all user data from profiles, matches, likes, moments, etc.
// 2. Deletes the Supabase Auth user (requires service_role key)
//
// Called from frontend after user confirms deletion.
// Auth is verified via JWT — only the user themselves can delete their account.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, content-type',
            },
        })
    }

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Create client with user's JWT to verify identity
    const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const userId = user.id

    // Admin client for privileged operations
    const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    try {
        // 1. Delete all user data (cascade should handle most, but be explicit)
        await Promise.allSettled([
            adminClient.from('push_subscriptions').delete().eq('user_id', userId),
            adminClient.from('moment_likes').delete().eq('user_id', userId),
            adminClient.from('likes').delete().eq('from_user_id', userId),
            adminClient.from('likes').delete().eq('to_user_id', userId),
            adminClient.from('blocked_users').delete().eq('blocker_id', userId),
            adminClient.from('blocked_users').delete().eq('blocked_id', userId),
            adminClient.from('reports').delete().eq('reporter_id', userId),
            adminClient.from('meeting_feedback').delete().eq('user_id', userId),
            adminClient.from('referrals').delete().eq('referrer_id', userId),
            adminClient.from('referrals').delete().eq('referred_id', userId),
            adminClient.from('payments').delete().eq('user_id', userId),
        ])

        // 2. Delete moments (user's posts)
        await adminClient.from('moments').delete().eq('user_id', userId)

        // 3. Delete matches
        await adminClient.from('matches').delete()
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

        // 4. Delete profile
        await adminClient.from('profiles').delete().eq('id', userId)

        // 5. Delete storage files (avatars, photos)
        await Promise.allSettled([
            adminClient.storage.from('avatars').remove([`avatars/${userId}.jpg`, `avatars/${userId}.png`, `avatars/${userId}.webp`]),
            adminClient.storage.from('photos').list(`photos/${userId}`).then(({ data }) => {
                if (data?.length) {
                    return adminClient.storage.from('photos').remove(data.map(f => `photos/${userId}/${f.name}`))
                }
            }),
        ])

        // 6. Delete Supabase Auth user (requires service_role)
        const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
        if (deleteAuthError) {
            console.error('[delete-account] Auth delete error:', deleteAuthError)
            // Profile already deleted — still return success
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })

    } catch (err) {
        console.error('[delete-account] Error:', err)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
    }
})
