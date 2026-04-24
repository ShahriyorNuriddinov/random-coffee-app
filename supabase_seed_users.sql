-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: 15 test profiles for AI matching test
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.profiles (
    id, name, email, gender, dob, region, city,
    about, gives, wants, balance,
    wechat, whatsapp, languages,
    tags, status, subscription_status, coffee_credits,
    avatar_url, created_at, updated_at
) VALUES

-- 1. React Developer
('11111111-0000-0000-0000-000000000001',
 'Alex Chen', 'alex@test.com', 'male', '1992-03-15', 'Hong Kong', 'Central',
 'Senior React developer with 6 years experience. Building fintech products.',
 'React, TypeScript, system design mentorship, code reviews.',
 'Co-founder for a SaaS startup, investors in fintech space.',
 '30_70', 'alexchen_wx', '+85291001001', ARRAY['EN','ZH'],
 '["React Developer","Fintech","Startup","TypeScript","SaaS"]',
 'active','active',4,
 'https://picsum.photos/150?random=101',
 NOW(), NOW()),

-- 2. UX Designer
('11111111-0000-0000-0000-000000000002',
 'Mia Wong', 'mia@test.com', 'female', '1995-07-22', 'Hong Kong', 'Wan Chai',
 'UX/UI designer passionate about mobile apps and design systems.',
 'Figma workshops, design audits, user research.',
 'Developer co-founder, startup ideas, product feedback.',
 '50_50', 'miawong_wx', '+85291002002', ARRAY['EN','CAN'],
 '["UX Designer","Mobile Apps","Figma","Design Systems","Product"]',
 'active','active',3,
 'https://picsum.photos/150?random=102',
 NOW(), NOW()),

-- 3. AI/ML Engineer
('11111111-0000-0000-0000-000000000003',
 'David Li', 'david@test.com', 'male', '1990-11-08', 'Hong Kong', 'Kowloon',
 'Machine learning engineer at a HK unicorn. Specializing in NLP and recommendation systems.',
 'ML model deployment, Python, data pipeline architecture.',
 'Business co-founder, product managers, startup opportunities.',
 '30_70', 'davidli_wx', '+85291003003', ARRAY['EN','ZH'],
 '["Machine Learning","NLP","Python","AI","Data Science"]',
 'active','active',5,
 'https://picsum.photos/150?random=103',
 NOW(), NOW()),

-- 4. Startup Founder
('11111111-0000-0000-0000-000000000004',
 'Sarah Kim', 'sarah@test.com', 'female', '1988-04-30', 'Hong Kong', 'Admiralty',
 'Serial entrepreneur, 2 exits. Currently building an edtech platform for Asia.',
 'Fundraising advice, pitch deck review, investor introductions.',
 'Technical co-founder, growth hackers, edtech partnerships.',
 '50_50', 'sarahkim_wx', '+85291004004', ARRAY['EN'],
 '["Entrepreneur","Edtech","Fundraising","Startup","Growth"]',
 'active','active',6,
 'https://picsum.photos/150?random=104',
 NOW(), NOW()),

-- 5. Blockchain Developer
('11111111-0000-0000-0000-000000000005',
 'Kevin Zhang', 'kevin@test.com', 'male', '1993-09-14', 'Mainland China', 'Shenzhen',
 'Web3 developer building DeFi protocols. 4 years in blockchain.',
 'Smart contract audits, Solidity, Web3 architecture.',
 'DeFi investors, crypto traders, blockchain startup ideas.',
 '30_70', 'kevinzhang_wx', '+8613900005005', ARRAY['ZH','EN'],
 '["Blockchain","Web3","DeFi","Solidity","Crypto"]',
 'active','active',3,
 'https://picsum.photos/150?random=105',
 NOW(), NOW()),

-- 6. Marketing Director
('11111111-0000-0000-0000-000000000006',
 'Emma Lau', 'emma@test.com', 'female', '1991-12-05', 'Hong Kong', 'Tsim Sha Tsui',
 'Growth marketing expert. Scaled 3 startups from 0 to 1M users.',
 'Growth strategy, SEO, social media marketing, brand building.',
 'Tech founders, product teams, B2B SaaS companies.',
 '50_50', 'emmalau_wx', '+85291006006', ARRAY['EN','CAN'],
 '["Marketing","Growth Hacking","SEO","Brand","Social Media"]',
 'active','active',4,
 'https://picsum.photos/150?random=106',
 NOW(), NOW()),

-- 7. VC Investor
('11111111-0000-0000-0000-000000000007',
 'James Ho', 'james@test.com', 'male', '1985-06-18', 'Hong Kong', 'Central',
 'Partner at a Series A fund focused on Southeast Asia tech startups.',
 'Term sheet guidance, investor network, due diligence support.',
 'Pre-seed and seed stage founders, deep tech startups.',
 '30_70', 'jamesho_wx', '+85291007007', ARRAY['EN','ZH','CAN'],
 '["Investor","Venture Capital","Startup","Fintech","Southeast Asia"]',
 'active','active',8,
 'https://picsum.photos/150?random=107',
 NOW(), NOW()),

-- 8. Product Manager
('11111111-0000-0000-0000-000000000008',
 'Lisa Chan', 'lisa@test.com', 'female', '1994-02-28', 'Hong Kong', 'Causeway Bay',
 'Senior PM at a leading HK fintech. Previously at Google.',
 'Product roadmap, user interviews, OKR frameworks.',
 'Engineers, designers, startup co-founders.',
 '50_50', 'lisachan_wx', '+85291008008', ARRAY['EN','CAN'],
 '["Product Manager","Fintech","Google","OKR","User Research"]',
 'active','active',3,
 'https://picsum.photos/150?random=108',
 NOW(), NOW()),

-- 9. Data Analyst
('11111111-0000-0000-0000-000000000009',
 'Tom Wu', 'tom@test.com', 'male', '1996-08-11', 'Macau', 'Macau',
 'Data analyst at a gaming company. Passionate about business intelligence.',
 'SQL, Tableau, data visualization, A/B testing.',
 'Data engineers, ML engineers, startup analytics roles.',
 '50_50', 'tomwu_wx', '+85391009009', ARRAY['ZH','CAN'],
 '["Data Analyst","SQL","Business Intelligence","Gaming","Analytics"]',
 'active','active',2,
 'https://picsum.photos/150?random=109',
 NOW(), NOW()),

-- 10. iOS Developer
('11111111-0000-0000-0000-000000000010',
 'Nina Ng', 'nina@test.com', 'female', '1993-05-25', 'Hong Kong', 'Mong Kok',
 'iOS developer with 5 years experience. Built apps with 500K+ downloads.',
 'Swift, SwiftUI, App Store optimization, mobile architecture.',
 'Android developers for cross-platform projects, startup ideas.',
 '50_50', 'ninang_wx', '+85291010010', ARRAY['EN','CAN'],
 '["iOS Developer","Swift","SwiftUI","Mobile","App Store"]',
 'active','active',3,
 'https://picsum.photos/150?random=110',
 NOW(), NOW()),

-- 11. Finance Professional
('11111111-0000-0000-0000-000000000011',
 'Ryan Cheung', 'ryan@test.com', 'male', '1989-10-03', 'Hong Kong', 'Central',
 'Investment banker turned fintech entrepreneur. 10 years in finance.',
 'Financial modeling, M&A advisory, fundraising strategy.',
 'Tech co-founders, fintech startups, blockchain projects.',
 '30_70', 'ryancheung_wx', '+85291011011', ARRAY['EN','ZH'],
 '["Finance","Investment Banking","Fintech","M&A","Fundraising"]',
 'active','active',5,
 'https://picsum.photos/150?random=111',
 NOW(), NOW()),

-- 12. Content Creator
('11111111-0000-0000-0000-000000000012',
 'Chloe Yip', 'chloe@test.com', 'female', '1997-01-17', 'Hong Kong', 'Sham Shui Po',
 'Tech content creator with 200K followers. Covers AI, startups, and productivity.',
 'Content strategy, YouTube, LinkedIn growth, personal branding.',
 'Startup founders for collaborations, tech companies for sponsorships.',
 '70_30', 'chloeyip_wx', '+85291012012', ARRAY['EN','CAN'],
 '["Content Creator","YouTube","LinkedIn","Personal Branding","AI"]',
 'active','active',2,
 'https://picsum.photos/150?random=112',
 NOW(), NOW()),

-- 13. Backend Engineer
('11111111-0000-0000-0000-000000000013',
 'Michael Tan', 'michael@test.com', 'male', '1991-07-09', 'Mainland China', 'Guangzhou',
 'Backend engineer specializing in distributed systems and microservices.',
 'Go, Kubernetes, system architecture, performance optimization.',
 'Frontend developers, startup CTO roles, remote work opportunities.',
 '30_70', 'michaeltan_wx', '+8613900013013', ARRAY['ZH','EN'],
 '["Backend Engineer","Go","Kubernetes","Microservices","Distributed Systems"]',
 'active','active',4,
 'https://picsum.photos/150?random=113',
 NOW(), NOW()),

-- 14. Healthcare Startup
('11111111-0000-0000-0000-000000000014',
 'Amy Fong', 'amy@test.com', 'female', '1987-03-21', 'Hong Kong', 'Sha Tin',
 'Doctor turned healthtech entrepreneur. Building AI diagnostics platform.',
 'Medical expertise, clinical trial design, healthcare regulations.',
 'AI engineers, investors in healthtech, hospital partnerships.',
 '50_50', 'amyfong_wx', '+85291014014', ARRAY['EN','ZH'],
 '["Healthcare","Healthtech","AI","Doctor","Medical"]',
 'active','active',6,
 'https://picsum.photos/150?random=114',
 NOW(), NOW()),

-- 15. E-commerce Expert
('11111111-0000-0000-0000-000000000015',
 'Ben Leung', 'ben@test.com', 'male', '1990-11-30', 'Hong Kong', 'Kwun Tong',
 'E-commerce consultant. Helped 50+ brands scale on Tmall and Shopify.',
 'Cross-border e-commerce, supply chain, China market entry.',
 'Brand founders, logistics partners, payment solutions.',
 '50_50', 'benleung_wx', '+85291015015', ARRAY['EN','ZH','CAN'],
 '["E-commerce","Shopify","Tmall","Supply Chain","China Market"]',
 'active','active',3,
 'https://picsum.photos/150?random=115',
 NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    about = EXCLUDED.about,
    gives = EXCLUDED.gives,
    wants = EXCLUDED.wants,
    tags = EXCLUDED.tags,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Verify
SELECT id, name, region, tags FROM public.profiles 
WHERE id LIKE '11111111%' 
ORDER BY name;
