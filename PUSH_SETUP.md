# Browser Push Notifications — Setup Guide

## 1. VAPID kalitlarini generatsiya qilish

Terminalda:
```bash
npx web-push generate-vapid-keys
```

Natija:
```
Public Key: Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 2. .env faylini yangilash

```env
VITE_VAPID_PUBLIC_KEY=<Public Key>
```

## 3. Supabase Edge Function secrets qo'shish

Supabase Dashboard → Settings → Edge Functions → Secrets:

```
VAPID_PUBLIC_KEY   = <Public Key>
VAPID_PRIVATE_KEY  = <Private Key>
VAPID_SUBJECT      = mailto:support@randomcoffeehk.com
```

## 4. SQL ni ishga tushirish

`supabase_push_notifications.sql` faylini Supabase SQL Editor da ishga tushiring.

## 5. Edge funksiyalarni deploy qilish

```bash
supabase functions deploy send-push
supabase functions deploy send-notification
```

## 6. Service Worker tekshirish

`public/sw.js` da push event handler bo'lishi kerak:
```js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Random Coffee', {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-72.png',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
})
```

## Hozirgi holat

- ✅ `usePushNotifications` hook — ishlaydi
- ✅ `push_subscriptions` jadval — SQL yuqorida
- ✅ `send-push` edge function — yaratildi
- ✅ `send-notification` edge function — mavjud
- ⚠️ VAPID kalitlari — generatsiya qilish kerak
- ⚠️ Service Worker push handler — tekshirish kerak
