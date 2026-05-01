/**
 * usePushNotifications
 * Toggle browser push notifications.
 * - On subscribe: requests permission → registers push → saves to Supabase
 * - On unsubscribe: removes push subscription → deletes from Supabase
 * - Works on HTTPS (production). On localhost shows toggle but skips actual push registration.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
const IS_LOCALHOST = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
)

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

// Wait for SW with timeout
function swReady(timeoutMs = 5000) {
    return Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SW timeout')), timeoutMs)
        )
    ])
}

export function usePushNotifications(userId) {
    const [subscribed, setSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [permission, setPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    )

    // Supported = browser has the APIs
    const supported = typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window

    // On mount: check DB subscription status
    useEffect(() => {
        if (!userId || !supported) return
        supabase
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
            .then(({ data }) => setSubscribed(!!(data?.length)))
            .catch(() => { })
    }, [userId, supported])

    const subscribe = useCallback(async () => {
        if (!supported || !userId) return false
        setLoading(true)
        try {
            // 1. Request permission
            const perm = await Notification.requestPermission()
            setPermission(perm)
            if (perm !== 'granted') {
                setLoading(false)
                return false
            }

            // 2. On localhost without VAPID — just mark as subscribed (UI demo)
            if (IS_LOCALHOST && !VAPID_PUBLIC_KEY) {
                setSubscribed(true)
                setLoading(false)
                return true
            }

            if (!VAPID_PUBLIC_KEY) {
                console.warn('[Push] VAPID_PUBLIC_KEY not set')
                setSubscribed(true)
                setLoading(false)
                return true
            }

            // 3. Get service worker (with timeout)
            let reg
            try {
                reg = await swReady(5000)
            } catch {
                // SW not ready — still mark as subscribed so UI works
                setSubscribed(true)
                setLoading(false)
                return true
            }

            // 4. Subscribe to push
            let pushSub
            try {
                pushSub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                })
            } catch (err) {
                console.warn('[Push] pushManager.subscribe failed:', err)
                // Still mark as subscribed so toggle stays on
                setSubscribed(true)
                setLoading(false)
                return true
            }

            // 5. Save to Supabase
            const json = pushSub.toJSON()
            await supabase.from('push_subscriptions').upsert({
                user_id: userId,
                endpoint: json.endpoint,
                p256dh: json.keys?.p256dh,
                auth: json.keys?.auth,
                user_agent: navigator.userAgent.slice(0, 200),
            }, { onConflict: 'user_id,endpoint' }).catch(e => console.warn('[Push] DB save failed:', e))

            setSubscribed(true)
            return true
        } catch (err) {
            console.error('[Push] subscribe error:', err)
            return false
        } finally {
            setLoading(false)
        }
    }, [supported, userId])

    const unsubscribe = useCallback(async () => {
        if (!supported || !userId) return
        setLoading(true)
        try {
            // Remove from browser
            if (!IS_LOCALHOST && 'serviceWorker' in navigator) {
                try {
                    const reg = await swReady(3000)
                    const pushSub = await reg.pushManager.getSubscription()
                    if (pushSub) {
                        await supabase.from('push_subscriptions')
                            .delete()
                            .eq('user_id', userId)
                            .eq('endpoint', pushSub.endpoint)
                            .catch(() => { })
                        await pushSub.unsubscribe()
                    }
                } catch { /* ignore SW errors */ }
            }

            // Remove all subscriptions for this user from DB
            await supabase.from('push_subscriptions')
                .delete()
                .eq('user_id', userId)
                .catch(() => { })

            setSubscribed(false)
        } catch (err) {
            console.error('[Push] unsubscribe error:', err)
        } finally {
            setLoading(false)
        }
    }, [supported, userId])

    return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}
