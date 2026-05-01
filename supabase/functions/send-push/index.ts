// Supabase Edge Function: send-push
// Sends Web Push notifications to one or all users
//
// Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY   — from web-push key generation
//   VAPID_PRIVATE_KEY  — from web-push key generation
//   VAPID_SUBJECT      — mailto:support@randomcoffeehk.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@randomcoffeehk.com'

// ─── VAPID JWT signing (manual, no external lib needed) ───────────────────────
async function signVapidJwt(audience: string): Promise<string> {
    const header = { alg: 'ES256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    const payload = { aud: audience, exp: now + 12 * 3600, sub: VAPID_SUBJECT }

    const encode = (obj: object) =>
        btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    const unsigned = `${encode(header)}.${encode(payload)}`

    // Import VAPID private key (base64url encoded raw EC key)
    const rawKey = Uint8Array.from(atob(VAPID_PRIVATE.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const key = await crypto.subtle.importKey(
        'raw', rawKey,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false, ['sign']
    )

    const sig = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        new TextEncoder().encode(unsigned)
    )

    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    return `${unsigned}.${sigB64}`
}

// ─── Send one push notification ───────────────────────────────────────────────
async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
    const url = new URL(sub.endpoint)
    const audience = `${url.protocol}//${url.host}`
    const jwt = await signVapidJwt(audience)

    const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': `vapid t=${jwt},k=${VAPID_PUBLIC}`,
            'TTL': '86400',
        },
        body: payload,
    })

    return res.status
}

// ─── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    // body: { user_id?: string, title: string, body: string, url?: string, icon?: string }
    const { user_id, title, body: msgBody, url = '/', icon = '/icon-192.png' } = body

    const payload = JSON.stringify({ title, body: msgBody, url, icon, badge: '/icon-192.png' })

    // Fetch subscriptions — for one user or all
    let query = supabase.from('push_subscriptions').select('endpoint, p256dh, auth')
    if (user_id) query = query.eq('user_id', user_id)

    const { data: subs, error } = await query
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

    // Send to all subscriptions in parallel, remove expired ones (410 Gone)
    const results = await Promise.allSettled(
        subs.map(async (sub) => {
            const status = await sendPush(sub, payload)
            if (status === 410 || status === 404) {
                // Subscription expired — remove it
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            }
            return status
        })
    )

    const sent = results.filter(r => r.status === 'fulfilled' && (r.value === 200 || r.value === 201)).length
    return new Response(JSON.stringify({ sent, total: subs.length }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
})
