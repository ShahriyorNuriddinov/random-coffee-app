-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: Chinese translations for all test profiles
-- Run AFTER supabase_translations.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Alex Chen
UPDATE public.profiles SET
    about_zh = '香港资深React开发工程师，拥有6年金融科技产品开发经验。',
    gives_zh = 'React、TypeScript、系统设计指导、代码审查。',
    wants_zh = 'SaaS创业公司联合创始人、金融科技领域投资人。'
WHERE id = '11111111-0000-0000-0000-000000000001';

-- 2. Mia Wong
UPDATE public.profiles SET
    about_zh = '热衷于移动应用和设计系统的UX/UI设计师。',
    gives_zh = 'Figma工作坊、设计审查、用户研究。',
    wants_zh = '开发联合创始人、创业想法、产品反馈。'
WHERE id = '11111111-0000-0000-0000-000000000002';

-- 3. David Li
UPDATE public.profiles SET
    about_zh = '香港独角兽公司机器学习工程师，专注于NLP和推荐系统。',
    gives_zh = 'ML模型部署、Python、数据管道架构。',
    wants_zh = '商业联合创始人、产品经理、创业机会。'
WHERE id = '11111111-0000-0000-0000-000000000003';

-- 4. Sarah Kim
UPDATE public.profiles SET
    about_zh = '连续创业者，两次成功退出。目前正在为亚洲打造教育科技平台。',
    gives_zh = '融资建议、商业计划书审查、投资人引荐。',
    wants_zh = '技术联合创始人、增长黑客、教育科技合作伙伴。'
WHERE id = '11111111-0000-0000-0000-000000000004';

-- 5. Kevin Zhang
UPDATE public.profiles SET
    about_zh = 'Web3开发者，构建DeFi协议，拥有4年区块链经验。',
    gives_zh = '智能合约审计、Solidity、Web3架构。',
    wants_zh = 'DeFi投资人、加密货币交易员、区块链创业想法。'
WHERE id = '11111111-0000-0000-0000-000000000005';

-- 6. Emma Lau
UPDATE public.profiles SET
    about_zh = '增长营销专家，帮助3家初创公司从0增长到100万用户。',
    gives_zh = '增长策略、SEO、社交媒体营销、品牌建设。',
    wants_zh = '科技创始人、产品团队、B2B SaaS公司。'
WHERE id = '11111111-0000-0000-0000-000000000006';

-- 7. James Ho
UPDATE public.profiles SET
    about_zh = '专注于东南亚科技初创公司的A轮基金合伙人。',
    gives_zh = '投资条款指导、投资人网络、尽职调查支持。',
    wants_zh = '天使轮和种子轮创始人、深科技初创公司。'
WHERE id = '11111111-0000-0000-0000-000000000007';

-- 8. Lisa Chan
UPDATE public.profiles SET
    about_zh = '香港领先金融科技公司高级产品经理，曾任职谷歌。',
    gives_zh = '产品路线图、用户访谈、OKR框架。',
    wants_zh = '工程师、设计师、创业联合创始人。'
WHERE id = '11111111-0000-0000-0000-000000000008';

-- 9. Tom Wu
UPDATE public.profiles SET
    about_zh = '游戏公司数据分析师，热衷于商业智能。',
    gives_zh = 'SQL、Tableau、数据可视化、A/B测试。',
    wants_zh = '数据工程师、机器学习工程师、初创公司分析职位。'
WHERE id = '11111111-0000-0000-0000-000000000009';

-- 10. Nina Ng
UPDATE public.profiles SET
    about_zh = '拥有5年经验的iOS开发者，开发的应用下载量超过50万次。',
    gives_zh = 'Swift、SwiftUI、App Store优化、移动架构。',
    wants_zh = '跨平台项目的Android开发者、创业想法。'
WHERE id = '11111111-0000-0000-0000-000000000010';

-- 11. Ryan Cheung
UPDATE public.profiles SET
    about_zh = '投资银行家转型金融科技创业者，拥有10年金融经验。',
    gives_zh = '财务建模、并购咨询、融资策略。',
    wants_zh = '科技联合创始人、金融科技初创公司、区块链项目。'
WHERE id = '11111111-0000-0000-0000-000000000011';

-- 12. Chloe Yip
UPDATE public.profiles SET
    about_zh = '拥有20万粉丝的科技内容创作者，涵盖AI、创业和生产力。',
    gives_zh = '内容策略、YouTube、LinkedIn增长、个人品牌。',
    wants_zh = '创业创始人合作、科技公司赞助。'
WHERE id = '11111111-0000-0000-0000-000000000012';

-- 13. Michael Tan
UPDATE public.profiles SET
    about_zh = '专注于分布式系统和微服务的后端工程师。',
    gives_zh = 'Go、Kubernetes、系统架构、性能优化。',
    wants_zh = '前端开发者、初创公司CTO职位、远程工作机会。'
WHERE id = '11111111-0000-0000-0000-000000000013';

-- 14. Amy Fong
UPDATE public.profiles SET
    about_zh = '医生转型健康科技创业者，正在构建AI诊断平台。',
    gives_zh = '医学专业知识、临床试验设计、医疗法规。',
    wants_zh = 'AI工程师、健康科技投资人、医院合作伙伴。'
WHERE id = '11111111-0000-0000-0000-000000000014';

-- 15. Ben Leung
UPDATE public.profiles SET
    about_zh = '电商顾问，帮助50多个品牌在天猫和Shopify上扩大规模。',
    gives_zh = '跨境电商、供应链、中国市场进入。',
    wants_zh = '品牌创始人、物流合作伙伴、支付解决方案。'
WHERE id = '11111111-0000-0000-0000-000000000015';

-- 16. Jason Park
UPDATE public.profiles SET
    about_zh = '拥有10年以上经验的网络安全顾问，前汇丰银行安全负责人。',
    gives_zh = '渗透测试、安全审计、CISO咨询。',
    wants_zh = '需要安全审查的金融科技初创公司、CTO人脉。'
WHERE id = '22222222-0000-0000-0000-000000000001';

-- 17. Grace Liu
UPDATE public.profiles SET
    about_zh = 'B轮初创公司人才负责人，热衷于构建远程团队。',
    gives_zh = '招聘策略、雇主品牌、远程团队文化。',
    wants_zh = '创业创始人、HR科技工具、招聘自动化。'
WHERE id = '22222222-0000-0000-0000-000000000002';

-- 18. Victor Chan
UPDATE public.profiles SET
    about_zh = '专注于初创公司法律、知识产权和跨境交易的律师。',
    gives_zh = '投资条款审查、知识产权保护、香港公司注册。',
    wants_zh = '早期创始人、向亚洲扩张的科技公司。'
WHERE id = '22222222-0000-0000-0000-000000000003';

-- 19. Lily Zhao
UPDATE public.profiles SET
    about_zh = '儿童在线编程学校联合创始人，亚洲各地拥有5万名学生。',
    gives_zh = '教育科技产品设计、课程开发、B2C增长。',
    wants_zh = '教育领域投资人、学校合作伙伴、内容创作者。'
WHERE id = '22222222-0000-0000-0000-000000000004';

-- 20. Chris Ng
UPDATE public.profiles SET
    about_zh = '云公司DevOps工程师，AWS认证，Terraform专家。',
    gives_zh = '云架构、CI/CD管道、成本优化。',
    wants_zh = '后端开发者、初创公司CTO、云迁移项目。'
WHERE id = '22222222-0000-0000-0000-000000000005';

-- 21. Sophie Lam
UPDATE public.profiles SET
    about_zh = '可持续时尚市场创始人，连接设计师与买家。',
    gives_zh = '时尚行业人脉、可持续供应链、D2C策略。',
    wants_zh = '市场平台技术开发者、时尚/零售领域投资人。'
WHERE id = '22222222-0000-0000-0000-000000000006';

-- 22. Daniel Kwok
UPDATE public.profiles SET
    about_zh = '房地产科技创业者，构建香港房产分析平台。',
    gives_zh = '房产市场洞察、房地产数据、PropTech人脉。',
    wants_zh = 'AI开发者、数据科学家、房地产投资人。'
WHERE id = '22222222-0000-0000-0000-000000000007';

-- 23. Priya Sharma
UPDATE public.profiles SET
    about_zh = '为亚洲农村地区提供数字素养的NGO社会创业者。',
    gives_zh = '申请资助、影响力评估、NGO管理。',
    wants_zh = 'CSR合作伙伴、技术志愿者、影响力投资人。'
WHERE id = '22222222-0000-0000-0000-000000000008';

-- 24. Eric Yuen
UPDATE public.profiles SET
    about_zh = '移动游戏工作室游戏开发者，Unity专家，已发布3款游戏。',
    gives_zh = 'Unity开发、游戏变现、移动游戏设计。',
    wants_zh = '发行商、游戏领域投资人、AR/VR开发者。'
WHERE id = '22222222-0000-0000-0000-000000000009';

-- 25. Helen Tsang
UPDATE public.profiles SET
    about_zh = '供应链顾问，帮助财富500强公司优化亚洲运营。',
    gives_zh = '物流优化、供应商采购、库存管理。',
    wants_zh = '电商创始人、制造业初创公司、物流科技。'
WHERE id = '22222222-0000-0000-0000-000000000010';

-- 26. Marcus Wong
UPDATE public.profiles SET
    about_zh = '生物技术研究员转型创业者，香港大学分子生物学博士。',
    gives_zh = '生命科学专业知识、生物技术法规、实验室合作。',
    wants_zh = '生物技术投资人、制药公司、AI药物发现。'
WHERE id = '22222222-0000-0000-0000-000000000011';

-- 27. Tina Ho
UPDATE public.profiles SET
    about_zh = '自由品牌设计师，为100多家初创公司打造视觉形象。',
    gives_zh = 'Logo设计、品牌规范、商业计划书设计。',
    wants_zh = '创业创始人、营销团队、创意机构。'
WHERE id = '22222222-0000-0000-0000-000000000012';

-- Verify
SELECT name, about_zh IS NOT NULL as has_zh FROM public.profiles
WHERE id LIKE '11111111%' OR id LIKE '22222222%'
ORDER BY name;
