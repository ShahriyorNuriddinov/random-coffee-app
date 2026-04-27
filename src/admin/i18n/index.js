// ─── Admin Panel — All translations ──────────────────────────────────────────
// Usage: import { t } from '@/admin/i18n'; t('dashboard.title', lang)

export const translations = {
    // ── Common ──────────────────────────────────────────────────────────────────
    common: {
        en: {
            save: 'Save Changes', cancel: 'Cancel', back: 'Back', done: 'Done',
            delete: 'Delete', edit: 'Edit', add: 'Add', loading: 'Loading...',
            noResults: 'No results found.', confirm: 'Are you sure?',
            saved: 'Saved!', deleted: 'Deleted.', error: 'Something went wrong.',
        },
        zh: {
            save: '保存更改', cancel: '取消', back: '返回', done: '完成',
            delete: '删除', edit: '编辑', add: '添加', loading: '加载中...',
            noResults: '未找到结果。', confirm: '您确定吗？',
            saved: '已保存！', deleted: '已删除。', error: '出现错误。',
        },
        ru: {
            save: 'Сохранить', cancel: 'Отмена', back: 'Назад', done: 'Готово',
            delete: 'Удалить', edit: 'Редактировать', add: 'Добавить', loading: 'Загрузка...',
            noResults: 'Ничего не найдено.', confirm: 'Вы уверены?',
            saved: 'Сохранено!', deleted: 'Удалено.', error: 'Что-то пошло не так.',
        },
    },

    nav: {
        en: { dashboard: 'Dashboard', members: 'Members', moments: 'Moments', news: 'News', reports: 'Reports', notifications: 'Alerts', settings: 'Settings' },
        zh: { dashboard: '仪表板', members: '会员', moments: '动态', news: '新闻', reports: '举报', notifications: '通知', settings: '设置' },
        ru: { dashboard: 'Дашборд', members: 'Участники', moments: 'Моменты', news: 'Новости', reports: 'Жалобы', notifications: 'Уведомления', settings: 'Настройки' },
    },

    login: {
        en: {
            sub: 'RC Admin', emailTitle: 'Admin Sign In', emailHint: 'Enter your administrator email address.',
            emailLabel: 'Email address', emailPlaceholder: 'admin@example.com', sendCode: 'Send Code',
            checking: 'Checking...', otpTitle: 'Enter Code', otpHint: 'We sent a 6-digit code to',
            verify: 'Access Panel', verifying: 'Verifying...', changeEmail: 'Change email',
            errNotAdmin: '⛔ This email is not authorized.', errOtp: 'Invalid code. Please try again.', errGeneric: 'Something went wrong. Try again.',
        },
        zh: {
            sub: 'RC Admin', emailTitle: '管理员登录', emailHint: '请输入您的管理员邮箱地址。',
            emailLabel: '邮箱地址', emailPlaceholder: 'admin@example.com', sendCode: '发送验证码',
            checking: '验证中...', otpTitle: '输入验证码', otpHint: '我们已向以下邮箱发送了6位验证码：',
            verify: '进入管理后台', verifying: '验证中...', changeEmail: '修改邮箱',
            errNotAdmin: '⛔ 该邮箱无权访问管理后台。', errOtp: '验证码无效，请重试。', errGeneric: '出现错误，请重试。',
        },
        ru: {
            sub: 'RC Admin', emailTitle: 'Вход для администратора', emailHint: 'Введите адрес электронной почты администратора.',
            emailLabel: 'Email', emailPlaceholder: 'admin@example.com', sendCode: 'Отправить код',
            checking: 'Проверка...', otpTitle: 'Введите код', otpHint: 'Мы отправили 6-значный код на',
            verify: 'Войти в панель', verifying: 'Проверка...', changeEmail: 'Изменить email',
            errNotAdmin: '⛔ Этот email не авторизован.', errOtp: 'Неверный код. Попробуйте снова.', errGeneric: 'Что-то пошло не так. Попробуйте снова.',
        },
    },

    dashboard: {
        en: {
            income: 'Income & Sales', revenue: 'Total Revenue', newMembers: 'New Members (Last 7 Days)',
            meetings: 'Meetings Overview', totalMatches: 'Total Matches', successful: 'Successful', cancelled: 'Cancelled',
            totalMembers: 'Total Members', active: 'Active', newThisWeek: 'New This Week', men: 'Men', women: 'Women',
            genderDist: 'Gender Distribution', today: 'Today', week: 'Week', month: 'Month', year: 'Year',
            totalMoments: 'Total Moments', newMembersLabel: 'New Members', ratingTitle: 'Meeting Satisfaction',
            ratingExcellent: 'Excellent', ratingGood: 'Good', ratingNormal: 'Normal', ratingBad: 'So-so',
            cancelTitle: 'Cancellation Reasons', cancelDone: 'Done', cancelMainReasons: 'Main Reasons',
            ofTotal: 'of total', growingFast: '', noData: 'No data yet', membersOverview: 'Members Overview', ratingNoData: 'No feedback data yet.',
        },
        zh: {
            income: '收入与销售', revenue: '总收入', newMembers: '新会员（近7天）',
            meetings: '会议概览', totalMatches: '总匹配数', successful: '已完成', cancelled: '已取消',
            totalMembers: '总会员数', active: '活跃', newThisWeek: '本周新增', men: '男性', women: '女性',
            genderDist: '性别分布', today: '今日', week: '本周', month: '本月', year: '全年',
            totalMoments: '动态总数', newMembersLabel: '新会员', ratingTitle: '会议满意度',
            ratingExcellent: '非常满意', ratingGood: '满意', ratingNormal: '一般', ratingBad: '不满意',
            cancelTitle: '取消原因', cancelDone: '完成', cancelMainReasons: '主要原因',
            ofTotal: '占总数', growingFast: '', noData: '暂无数据', membersOverview: '会员概览', ratingNoData: '暂无反馈数据。',
        },
        ru: {
            income: 'Доходы и продажи', revenue: 'Общий доход', newMembers: 'Новые участники (7 дней)',
            meetings: 'Обзор встреч', totalMatches: 'Всего совпадений', successful: 'Успешных', cancelled: 'Отменено',
            totalMembers: 'Всего участников', active: 'Активных', newThisWeek: 'Новых за неделю', men: 'Мужчины', women: 'Женщины',
            genderDist: 'Распределение по полу', today: 'Сегодня', week: 'Неделя', month: 'Месяц', year: 'Год',
            totalMoments: 'Всего моментов', newMembersLabel: 'Новые участники', ratingTitle: 'Удовлетворённость встречами',
            ratingExcellent: 'Отлично', ratingGood: 'Хорошо', ratingNormal: 'Нормально', ratingBad: 'Плохо',
            cancelTitle: 'Причины отмены', cancelDone: 'Готово', cancelMainReasons: 'Основные причины',
            ofTotal: 'от общего', growingFast: '', noData: 'Нет данных', membersOverview: 'Обзор участников', ratingNoData: 'Нет данных обратной связи.',
        },
    },

    members: {
        en: {
            listTitle: 'Members List', searchPlaceholder: 'Search by name or email...', all: 'All', active: 'Active',
            inactive: 'Inactive', banned: 'Banned', free: 'Free', noResults: 'No members found.', editTitle: 'Edit Member',
            sysInfo: 'System Info', regDate: 'Registered', subscription: 'Subscription', profile: 'Profile',
            name: 'Name', email: 'Email', credits: 'Credits', about: 'About', gives: 'Gives', wants: 'Wants',
            dob: 'Date of Birth', gender: 'Gender', location: 'Location', emailVerified: 'Email Verified',
            messengers: 'Messengers', activityTitle: 'Activity & Stats', actMeetings: 'Meetings Held',
            actPosts: 'Posts Created', actReferrals: 'Invited Members', actInvitedBy: 'Invited By',
            bannedBadge: 'BANNED', banBtn: 'Ban Member', unbanBtn: 'Unban Member',
            banConfirm: 'Ban this user?', unbanConfirm: 'Unban this user?',
        },
        zh: {
            listTitle: '会员列表', searchPlaceholder: '按姓名或邮箱搜索...', all: '全部', active: '活跃',
            inactive: '未激活', banned: '已封禁', free: '免费', noResults: '未找到会员。', editTitle: '编辑会员',
            sysInfo: '系统信息', regDate: '注册日期', subscription: '订阅状态', profile: '基础资料',
            name: '姓名', email: '邮箱', credits: '积分', about: '关于我', gives: '我能提供', wants: '我想寻求',
            dob: '出生日期', gender: '性别', location: '所在地', emailVerified: '邮箱已验证',
            messengers: '社交软件', activityTitle: '活跃度与统计', actMeetings: '已进行会议',
            actPosts: '发布动态数', actReferrals: '成功邀请人数', actInvitedBy: '邀请人',
            bannedBadge: '已封禁', banBtn: '封禁会员', unbanBtn: '解除封禁',
            banConfirm: '确定封禁该用户？', unbanConfirm: '确定解除封禁？',
        },
        ru: {
            listTitle: 'Список участников', searchPlaceholder: 'Поиск по имени или email...', all: 'Все', active: 'Активные',
            inactive: 'Неактивные', banned: 'Заблокированные', free: 'Бесплатно', noResults: 'Участники не найдены.', editTitle: 'Редактировать участника',
            sysInfo: 'Системная информация', regDate: 'Дата регистрации', subscription: 'Подписка', profile: 'Профиль',
            name: 'Имя', email: 'Email', credits: 'Кредиты', about: 'О себе', gives: 'Могу дать', wants: 'Хочу получить',
            dob: 'Дата рождения', gender: 'Пол', location: 'Местоположение', emailVerified: 'Email подтверждён',
            messengers: 'Мессенджеры', activityTitle: 'Активность и статистика', actMeetings: 'Встреч проведено',
            actPosts: 'Постов создано', actReferrals: 'Приглашено участников', actInvitedBy: 'Приглашён',
            bannedBadge: 'ЗАБЛОКИРОВАН', banBtn: 'Заблокировать', unbanBtn: 'Разблокировать',
            banConfirm: 'Заблокировать этого пользователя?', unbanConfirm: 'Разблокировать пользователя?',
        },
    },

    moments: {
        en: {
            pending: 'Pending', approved: 'Approved', rejected: 'Rejected', all: 'All',
            approve: 'Approve', reject: 'Reject', noItems: 'Nothing here.',
            selectReason: 'Select Reason for Rejection',
            reasons: ['Spam / Advertising', 'Inappropriate Content', 'Off-topic', 'Low Quality'],
            approvedMsg: 'Approved!', rejectedMsg: 'Rejected.',
        },
        zh: {
            pending: '待审核', approved: '已通过', rejected: '已拒绝', all: '全部',
            approve: '通过', reject: '拒绝', noItems: '暂无内容。',
            selectReason: '选择拒绝原因',
            reasons: ['垃圾广告', '不当内容', '与主题无关', '质量低下'],
            approvedMsg: '已通过！', rejectedMsg: '已拒绝。',
        },
        ru: {
            pending: 'На проверке', approved: 'Одобрено', rejected: 'Отклонено', all: 'Все',
            approve: 'Одобрить', reject: 'Отклонить', noItems: 'Ничего нет.',
            selectReason: 'Выберите причину отклонения',
            reasons: ['Спам / Реклама', 'Неприемлемый контент', 'Не по теме', 'Низкое качество'],
            approvedMsg: 'Одобрено!', rejectedMsg: 'Отклонено.',
        },
    },

    news: {
        en: {
            totalPosts: 'Total Posts', pinned: 'Pinned', addPost: 'Add Post', noPosts: 'No posts yet.',
            newPost: 'New Post', editPost: 'Edit Post', managePost: 'Manage Post', imageLabel: 'Post Image',
            uploadPhoto: 'Upload Photo', changePhoto: 'Change Photo', contentEn: 'Content (EN)', contentZh: 'Content (ZH)',
            publish: 'Publish', pinToTop: 'Pin to Top', unpin: 'Unpin', deletePost: 'Delete Post',
            deleteConfirm: 'Delete this post?', publishedMsg: 'Published!', pinnedLabel: 'Pinned',
            enterContent: 'Enter content', uploadFailed: 'Upload failed',
        },
        zh: {
            totalPosts: '总帖子数', pinned: '已置顶', addPost: '添加帖子', noPosts: '暂无帖子。',
            newPost: '新建帖子', editPost: '编辑帖子', managePost: '管理帖子', imageLabel: '帖子图片',
            uploadPhoto: '上传图片', changePhoto: '更换图片', contentEn: '内容（英文）', contentZh: '内容（中文）',
            publish: '发布', pinToTop: '置顶', unpin: '取消置顶', deletePost: '删除帖子',
            deleteConfirm: '确定删除该帖子？', publishedMsg: '已发布！', pinnedLabel: '已置顶',
            enterContent: '请输入内容', uploadFailed: '上传失败',
        },
        ru: {
            totalPosts: 'Всего постов', pinned: 'Закреплено', addPost: 'Добавить пост', noPosts: 'Постов пока нет.',
            newPost: 'Новый пост', editPost: 'Редактировать пост', managePost: 'Управление постом', imageLabel: 'Изображение',
            uploadPhoto: 'Загрузить фото', changePhoto: 'Изменить фото', contentEn: 'Контент (EN)', contentZh: 'Контент (ZH)',
            publish: 'Опубликовать', pinToTop: 'Закрепить', unpin: 'Открепить', deletePost: 'Удалить пост',
            deleteConfirm: 'Удалить этот пост?', publishedMsg: 'Опубликовано!', pinnedLabel: 'Закреплено',
            enterContent: 'Введите контент', uploadFailed: 'Ошибка загрузки',
        },
    },

    settings: {
        en: {
            tariffs: 'Tariffs & Cups', stdPrice: 'Standard Price ($)', stdCups: 'Standard Cups',
            bestPrice: 'Best Price ($)', bestCups: 'Best Cups', rewards: 'Rewards (Cups)',
            refReward: 'Referral Invitation', bdReward: 'Birthday Bonus', postReward: 'Post Creation',
            languages: 'Website Languages', staffTitle: 'Staff Management', addStaff: 'Add Staff Member',
            saveAll: 'Save All Settings', admin: 'Admin', moderator: 'Moderator', noStaff: 'No staff members yet.',
            addStaffTitle: 'Add Staff', staffName: 'Name', staffEmail: 'Email', staffPhone: 'Phone', staffRole: 'Role',
            create: 'Create', removeConfirm: (name) => `Remove ${name}?`, staffAdded: 'Staff added!',
            removed: 'Removed.', settingsSaved: 'Settings saved!',
            aiPromptTitle: 'AI Matching Prompt', aiPromptDesc: 'This prompt is sent to the AI engine during weekly matching and boost search.',
            aiPromptReset: 'Reset to default', aiPromptHint: 'Used in n8n workflow + boost search',
            aiPromptVars: 'Available variables', aiVarGives: 'What person offers', aiVarWants: 'What person needs',
            aiVarAbout: "Person's bio", aiVarRegion: "Person's region",
        },
        zh: {
            tariffs: '资费与杯数', stdPrice: '标准价格 ($)', stdCups: '标准杯数',
            bestPrice: '最优价格 ($)', bestCups: '最优杯数', rewards: '奖励 (杯数)',
            refReward: '推荐邀请', bdReward: '生日奖励', postReward: '发布动态',
            languages: '网站语言', staffTitle: '员工管理', addStaff: '添加员工',
            saveAll: '保存所有设置', admin: '管理员', moderator: '审核员', noStaff: '暂无员工。',
            addStaffTitle: '添加员工', staffName: '姓名', staffEmail: '邮箱', staffPhone: '电话', staffRole: '角色',
            create: '创建', removeConfirm: (name) => `确定删除 ${name}？`, staffAdded: '员工已添加！',
            removed: '已删除。', settingsSaved: '设置已保存！',
            aiPromptTitle: 'AI 匹配提示词', aiPromptDesc: '此提示词在每周匹配和即时搜索时发送给 AI 引擎。',
            aiPromptReset: '恢复默认', aiPromptHint: '用于 n8n 工作流 + 即时搜索',
            aiPromptVars: '可用变量', aiVarGives: '用户能提供的', aiVarWants: '用户想寻求的',
            aiVarAbout: '用户简介', aiVarRegion: '用户所在地区',
        },
        ru: {
            tariffs: 'Тарифы и кредиты', stdPrice: 'Стандартная цена ($)', stdCups: 'Стандартных кредитов',
            bestPrice: 'Лучшая цена ($)', bestCups: 'Лучших кредитов', rewards: 'Награды (кредиты)',
            refReward: 'Реферальное приглашение', bdReward: 'Бонус в день рождения', postReward: 'Создание поста',
            languages: 'Языки сайта', staffTitle: 'Управление персоналом', addStaff: 'Добавить сотрудника',
            saveAll: 'Сохранить все настройки', admin: 'Администратор', moderator: 'Модератор', noStaff: 'Сотрудников пока нет.',
            addStaffTitle: 'Добавить сотрудника', staffName: 'Имя', staffEmail: 'Email', staffPhone: 'Телефон', staffRole: 'Роль',
            create: 'Создать', removeConfirm: (name) => `Удалить ${name}?`, staffAdded: 'Сотрудник добавлен!',
            removed: 'Удалено.', settingsSaved: 'Настройки сохранены!',
            aiPromptTitle: 'Промпт AI-подбора', aiPromptDesc: 'Этот промпт отправляется в AI-движок при еженедельном подборе и буст-поиске.',
            aiPromptReset: 'Сбросить по умолчанию', aiPromptHint: 'Используется в n8n + буст-поиске',
            aiPromptVars: 'Доступные переменные', aiVarGives: 'Что предлагает пользователь', aiVarWants: 'Что ищет пользователь',
            aiVarAbout: 'Биография пользователя', aiVarRegion: 'Регион пользователя',
        },
    },
}

// ─── Helper: get translation object for a section ────────────────────────────
// Usage: const t = useT('dashboard')  →  t.revenue
export const getT = (section, lang) => translations[section]?.[lang] ?? translations[section]?.en ?? {}
