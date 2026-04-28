import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useApp } from '@/store/useAppStore'
import DarkToggle from '@/components/DarkToggle'
import { Button } from '@/components/ui/button'
import { InputCard, Input } from '@/components/ui/input'
import { sendOtp } from '@/lib/supabaseClient'
function LegalModal({ type, onClose, t, lang }) {
    const content = {
        terms: {
            title: t('terms'),
            text: lang === 'zh' ? `Random Coffee HK — 服务条款
最后更新：2026年1月

1. 接受
使用 Random Coffee HK 即表示您同意这些条款。

2. 资格
您必须年满16岁才能使用本服务。

3. 用户行为
- 尊重其他用户
- 提供准确的个人资料
- 不得骚扰其他用户
- 不得将平台用于商业招揽

4. 会议
Random Coffee HK 促进介绍，但不对会议结果负责。

5. 积分与付款
积分一经使用不可退款。购买的积分12个月后到期。

6. 账户终止
我们保留终止违反条款账户的权利。

7. 联系方式
support@randomcoffeehk.com
Denis Ivanov Limited, 香港 (HK 79643900)` : lang === 'ru' ? `Random Coffee HK — Условия использования
Последнее обновление: январь 2026

1. Принятие
Используя Random Coffee HK, вы соглашаетесь с этими условиями.

2. Возраст
Вам должно быть не менее 16 лет для использования сервиса.

3. Поведение пользователей
- Уважайте других пользователей
- Предоставляйте точную информацию в профиле
- Не спамьте и не преследуйте других пользователей
- Не используйте платформу для коммерческих предложений

4. Встречи
Random Coffee HK способствует знакомствам, но не несёт ответственности за результат встреч.

5. Кредиты и платежи
Кредиты не возвращаются после использования. Срок действия — 12 месяцев.

6. Блокировка аккаунта
Мы оставляем за собой право заблокировать аккаунты, нарушающие условия.

7. Контакты
support@randomcoffeehk.com
Denis Ivanov Limited, Гонконг (HK 79643900)` : `Random Coffee HK — Terms of Service
Last updated: January 2026

1. Acceptance
By using Random Coffee HK, you agree to these terms.

2. Eligibility
You must be at least 16 years old to use this service.

3. User Conduct
- Be respectful to other users
- Provide accurate profile information
- Do not spam or harass other users
- Do not use the platform for commercial solicitation

4. Meetings
Random Coffee HK facilitates introductions but is not responsible for the outcome of meetings.

5. Credits & Payments
Credits are non-refundable once used. Purchased credits expire after 12 months.

6. Account Termination
We reserve the right to terminate accounts that violate these terms.

7. Contact
support@randomcoffeehk.com
Denis Ivanov Limited, Hong Kong (HK 79643900)`
        },
        privacy: {
            title: t('privacy'),
            text: lang === 'zh' ? `Random Coffee HK — 隐私政策
最后更新：2026年1月

1. 我们收集的信息
我们收集：姓名、邮箱、出生日期、性别、地区和个人资料详情。

2. 我们如何使用您的信息
您的个人资料用于为您匹配咖啡会面伙伴。我们不出售您的个人数据。

3. 数据存储
您的数据安全存储在 Supabase 服务器上，采用行业标准加密。

4. 个人资料可见性
您的个人资料（姓名、照片、关于我、能提供、想获取）对其他注册用户可见。

5. 数据删除
联系我们请求删除：+852 51741164

6. Cookie
我们使用本地存储来维护您的会话和偏好设置。

7. 联系方式
support@randomcoffeehk.com` : lang === 'ru' ? `Random Coffee HK — Политика конфиденциальности
Последнее обновление: январь 2026

1. Информация, которую мы собираем
Мы собираем: имя, email, дату рождения, пол, регион и данные профиля.

2. Как мы используем вашу информацию
Ваш профиль используется для подбора партнёров для кофе-встреч. Мы не продаём ваши данные.

3. Хранение данных
Ваши данные хранятся на серверах Supabase с шифрованием по отраслевым стандартам.

4. Видимость профиля
Ваш профиль (имя, фото, о себе, могу дать, хочу получить) виден другим зарегистрированным пользователям.

5. Удаление данных
Запрос на удаление: +852 51741164

6. Cookies
Мы используем локальное хранилище для поддержания вашей сессии и настроек.

7. Контакты
support@randomcoffeehk.com` : `Random Coffee HK — Privacy Policy
Last updated: January 2026

1. Information We Collect
We collect: name, email, date of birth, gender, region, and profile details.

2. How We Use Your Information
Your profile is used to match you with other users for coffee meetings. We do not sell your personal data.

3. Data Storage
Your data is stored securely on Supabase servers with industry-standard encryption.

4. Profile Visibility
Your profile (name, photo, about, gives, wants) is visible to other registered users.

5. Data Deletion
Request deletion by contacting: +852 51741164

6. Cookies
We use local storage to maintain your session and preferences.

7. Contact
support@randomcoffeehk.com`
        }
    }

    const { title, text } = content[type]

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end',
                justifyContent: 'center', zIndex: 200,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--app-card)', borderRadius: '24px 24px 0 0',
                    width: '100%', maxWidth: 520, maxHeight: '85vh',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--app-text)' }}>{title}</div>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(120,120,128,0.12)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--app-hint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }}>
                    <pre style={{ fontSize: 13, color: 'var(--app-hint)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                        {text}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export default function PhoneScreen() {
    const { t, i18n } = useTranslation()
    const { setScreen, setPhone } = useApp()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [modal, setModal] = useState(null)
    const lang = i18n.language

    const handleNext = async () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error(t('err_email'))
            return
        }
        setLoading(true)
        const res = await sendOtp(email)
        setLoading(false)
        if (res?.success) {
            setPhone(email)
            setScreen('otp')
        } else {
            toast.error(res?.error || t('err_email'))
        }
    }

    return (
        <div className="app-screen fade-in-up">
            <div className="fixed top-5 right-5 flex gap-2 items-center z-30">
                <DarkToggle />
            </div>

            {modal && <LegalModal type={modal} onClose={() => setModal(null)} t={t} lang={lang} />}

            <div className="flex-1 flex flex-col items-center justify-center px-4">
                <div className="screen-content w-full">
                    <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, letterSpacing: -1, color: 'var(--app-text)' }}>
                        {t('auth_title')}
                    </h1>
                    <p style={{ color: 'var(--app-hint)', fontSize: 15, marginBottom: 32, lineHeight: 1.5, fontWeight: 500 }}>
                        {t('auth_hint_email')}
                    </p>

                    <InputCard inputId="email-input">
                        <Input
                            id="email-input"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={t('email_placeholder')}
                            inputMode="email"
                            aria-label={t('email_label')}
                            onKeyDown={e => e.key === 'Enter' && handleNext()}
                        />
                    </InputCard>

                    <Button onClick={handleNext} disabled={loading}>
                        {loading ? '...' : t('next')}
                    </Button>

                    <p style={{ marginTop: 10, fontSize: 12, color: 'var(--app-hint)', lineHeight: 1.4, textAlign: 'center', padding: '0 15px' }}>
                        {t('privacy_hint')}{' '}
                        <button
                            onClick={() => setModal('terms')}
                            style={{ color: 'var(--app-primary)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }}
                        >{t('terms')}</button>
                        {' '}{t('and') || 'and'}{' '}
                        <button
                            onClick={() => setModal('privacy')}
                            style={{ color: 'var(--app-primary)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0 }}
                        >{t('privacy')}</button>.
                    </p>
                </div>
            </div>
        </div>
    )
}
