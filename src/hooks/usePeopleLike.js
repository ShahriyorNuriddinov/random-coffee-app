import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '@/store/useAppStore'
import { likeUser, unlikeUser, checkMatchExists } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

export function usePeopleLike(initialLikedIds = []) {
    const { user } = useApp()
    const { t } = useTranslation()
    const [likedIds, setLikedIds] = useState(new Set(initialLikedIds))

    const handleLike = async (person) => {
        if (!user?.id) return
        if (likedIds.has(person.id)) return // already liked, do nothing

        setLikedIds(prev => new Set([...prev, person.id]))
        const result = await likeUser(user.id, person.id)
        if (!result.success) {
            setLikedIds(prev => { const next = new Set(prev); next.delete(person.id); return next })
            toast.error(t('toast_interest_failed', 'Failed to send interest'))
            return
        }

        const isMatch = await checkMatchExists(user.id, person.id)
        if (isMatch) {
            toast.success(`🎉 It's a Match with ${person.name}!`, {
                duration: 4000,
                style: { background: 'linear-gradient(135deg, #007aff, #5856d6)', color: '#fff', borderRadius: 20, fontWeight: 700, fontSize: 15, padding: '14px 24px' },
            })
        } else {
            toast.success(`❤️ Interest sent to ${person.name}`)
        }
    }

    return { likedIds, setLikedIds, handleLike }
}
