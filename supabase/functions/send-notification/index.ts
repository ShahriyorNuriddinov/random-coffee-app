// Supabase Edge Function: send-notification
// Called from client when: new match, new interest, etc.
// Triggers a Web Push notification to the target user.

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

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { type, from_user_id, to_user_id } = body

    // Build notification content based on event type
    let title = 'Random Coffee HK'
    let message = ''
    let url = '/'

    if (type === 'match') {
        // Fetch sender name
        const { data: sender } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', from_user_id)
            .single()

        title = '🎉 New Match!'
        message = sender?.name
            ? `You matched with ${sender.name}! Check your meetings.`
            : 'You have a new match! Check your meetings.'
        url = '/'
    } else if (type === 'interest') {
        const { data: sender } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', from_user_id)
            .single()

        title = '🤍 Someone is interested!'
        message = sender?.name
            ? `${sender.name} sent you an interest.`
            : 'Someone sent you an interest.'
        url = '/'
    } else if (type === 'news') {
        title = '📰 Random Coffee HK'
        message = body.text || 'New update from Random Coffee!'
        url = '/'
    }

    if (!to_user_id || !message) {
        return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    // Call send-push function
    const pushUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`
    const pushRes = await fetch(pushUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ user_id: to_user_id, title, body: message, url }),
    })

    const result = await pushRes.json()
    return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
})
