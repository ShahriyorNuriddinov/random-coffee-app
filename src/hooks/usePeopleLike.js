import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import { likeUser, unlikeUser } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export function usePeopleLike(initialLikedIds = []) {
    const { user } = useApp()
    const { t } = useTranslation()
    const [likedIds, setLikedIds] = useState(new Set(initialLikedIds))

    const handleLike = async (person) => {
        if (!user?.id) return

        if (likedIds.has(person.id)) {
            // Remove from favourites
            setLikedIds(prev => { const next = new Set(prev); next.delete(person.id); return next })
            await unlikeUser(user.id, person.id)
            toast(t('interest_removed_hint'), {
                icon: '🔕',
                duration: 3000,
                style: { fontSize: 13 },
            })
            return
        }

        // Add to favourites
        setLikedIds(prev => new Set([...prev, person.id]))
        const result = await likeUser(user.id, person.id)
        if (!result.success) {
            setLikedIds(prev => { const next = new Set(prev); next.delete(person.id); return next })
            toast.error(t('toast_interest_failed'))
            return
        }

        toast(t('interest_added_hint'), {
            icon: '❤️',
            duration: 3500,
            style: { fontSize: 13 },
        })
    }

    return { likedIds, setLikedIds, handleLike }
}
