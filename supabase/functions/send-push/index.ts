// Supabase Edge Function: send-push
// Sends Web Push notification to a user via their saved push subscription.
// Called by send-notification function.
//
// Required env vars (set in Supabase Dashboard → Settings → Edge Functions):
//   VAPID_SUBJECT   = mailto:support@randomcoffeehk.com
//   VAPID_PUBLIC_KEY  = your VAPID public key (same as VITE_VAPID_PUBLIC_KEY)
//   VAPID_PRIVATE_KEY = your VAPID private key (keep secret!)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── VAPID JWT signing (Web Crypto API — available in Deno) ──────────────────
async function buildVapidJwt(audience: string, subject: string, privateKeyB64: string): Promise<string> {
    const header = { typ: 'JWT', alg: 'ES256' }
    const now = Math.floor(Date.now() / 1000)
    const payload = { aud: audience, exp: now + 12 * 3600, sub: subject }

    const encode = (obj: object) =>
        btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const signingInput = `${encode(header)}.${encode(payload)}`

    // Import private key
    const keyBytes = Uint8Array.from(atob(privateKeyB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const privateKey = await crypto.subtle.importKey(
        'pkcs8', keyBytes,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false, ['sign']
    )

    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        privateKey,
        new TextEncoder().encode(signingInput)
    )

    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    return `${signingInput}.${sigB64}`
}

// ─── Send one push notification ───────────────────────────────────────────────
async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<boolean> {
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@randomcoffeehk.com'
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') || ''
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') || ''

    if (!vapidPublic || !vapidPrivate) {
        console.warn('[send-push] VAPID keys not configured')
        return false
    }

    const url = new URL(sub.endpoint)
    const audience = `${url.protocol}//${url.host}`

    const jwt = await buildVapidJwt(audience, vapidSubject, vapidPrivate)

    const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `vapid t=${jwt},k=${vapidPublic}`,
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'TTL': '86400',
        },
        body: new TextEncoder().encode(payload),
    })

    return res.status === 201 || res.status === 200
}

// ─── Main handler ─────────────────────────────────────────────────────────────
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

    const { user_id, title, body, url = '/' } = await req.json()

    if (!user_id || !title || !body) {
        return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
    }

    // Get all push subscriptions for this user
    const { data: subs, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', user_id)

    if (error || !subs?.length) {
        return new Response(JSON.stringify({ sent: 0, reason: 'no_subscriptions' }), { status: 200 })
    }

    // Notification payload
    const payload = JSON.stringify({
        title,
        body,
        url,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
    })

    let sent = 0
    const expired: string[] = []

    for (const sub of subs) {
        try {
            const ok = await sendPush(sub, payload)
            if (ok) {
                sent++
            } else {
                expired.push(sub.endpoint)
            }
        } catch (e) {
            console.error('[send-push] Error sending to', sub.endpoint, e)
            expired.push(sub.endpoint)
        }
    }

    // Remove expired/invalid subscriptions
    if (expired.length > 0) {
        await supabase
            .from('push_subscriptions')
            .delete()
            .in('endpoint', expired)
            .catch(() => { })
    }

    return new Response(JSON.stringify({ sent, total: subs.length }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
})
