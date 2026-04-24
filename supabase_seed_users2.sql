-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: 12 additional test profiles
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.profiles (
    id, name, email, gender, dob, region, city,
    about, gives, wants, balance,
    wechat, whatsapp, languages,
    tags, status, subscription_status, coffee_credits,
    avatar_url, created_at, updated_at
) VALUES

-- 16. Cybersecurity Expert
('22222222-0000-0000-0000-000000000001',
 'Jason Park', 'jason@test.com', 'male', '1988-05-12', 'Hong Kong', 'Central',
 'Cybersecurity consultant with 10+ years. Former HSBC security lead.',
 'Penetration testing, security audits, CISO advisory.',
 'Fintech startups needing security review, CTO connections.',
 '30_70', 'jasonpark_wx', '+85291016016', ARRAY['EN','ZH'],
 '["Cybersecurity","Fintech","CISO","Penetration Testing","Security"]',
 'active','active',4,
 'https://picsum.photos/150?random=201',
 NOW(), NOW()),

-- 17. HR & Talent
('22222222-0000-0000-0000-000000000002',
 'Grace Liu', 'grace@test.com', 'female', '1993-09-03', 'Hong Kong', 'Wan Chai',
 'Head of Talent at a Series B startup. Passionate about building remote teams.',
 'Hiring strategy, employer branding, remote team culture.',
 'Startup founders, HR tech tools, recruitment automation.',
 '50_50', 'graceliu_wx', '+85291017017', ARRAY['EN','CAN'],
 '["HR","Talent","Remote Work","Startup","Recruitment"]',
 'active','active',3,
 'https://picsum.photos/150?random=202',
 NOW(), NOW()),

-- 18. Legal Tech
('22222222-0000-0000-0000-000000000003',
 'Victor Chan', 'victor@test.com', 'male', '1986-02-14', 'Hong Kong', 'Admiralty',
 'Lawyer specializing in startup law, IP, and cross-border transactions.',
 'Term sheet review, IP protection, HK company setup.',
 'Early-stage founders, tech companies expanding to Asia.',
 '30_70', 'victorchan_wx', '+85291018018', ARRAY['EN','ZH','CAN'],
 '["Legal","Startup Law","IP","Cross-border","Hong Kong"]',
 'active','active',5,
 'https://picsum.photos/150?random=203',
 NOW(), NOW()),

-- 19. EdTech Founder
('22222222-0000-0000-0000-000000000004',
 'Lily Zhao', 'lily@test.com', 'female', '1991-06-28', 'Mainland China', 'Beijing',
 'Co-founder of an online coding school for kids. 50K students across Asia.',
 'EdTech product design, curriculum development, B2C growth.',
 'Investors in education, school partnerships, content creators.',
 '50_50', 'lilyzhao_wx', '+8613900019019', ARRAY['ZH','EN'],
 '["EdTech","Education","Kids Coding","B2C","Startup"]',
 'active','active',4,
 'https://picsum.photos/150?random=204',
 NOW(), NOW()),

-- 20. DevOps Engineer
('22222222-0000-0000-0000-000000000005',
 'Chris Ng', 'chris@test.com', 'male', '1994-11-07', 'Hong Kong', 'Kowloon',
 'DevOps engineer at a cloud company. AWS certified, Terraform expert.',
 'Cloud architecture, CI/CD pipelines, cost optimization.',
 'Backend developers, startup CTOs, cloud migration projects.',
 '30_70', 'chrisng_wx', '+85291020020', ARRAY['EN','CAN'],
 '["DevOps","AWS","Terraform","Cloud","CI/CD"]',
 'active','active',3,
 'https://picsum.photos/150?random=205',
 NOW(), NOW()),

-- 21. Fashion Tech
('22222222-0000-0000-0000-000000000006',
 'Sophie Lam', 'sophie@test.com', 'female', '1996-04-19', 'Hong Kong', 'Causeway Bay',
 'Founder of a sustainable fashion marketplace. Connecting designers with buyers.',
 'Fashion industry connections, sustainable supply chain, D2C strategy.',
 'Tech developers for marketplace, investors in fashion/retail.',
 '70_30', 'sophielam_wx', '+85291021021', ARRAY['EN','CAN'],
 '["Fashion","Sustainability","Marketplace","D2C","Retail"]',
 'active','active',2,
 'https://picsum.photos/150?random=206',
 NOW(), NOW()),

-- 22. Proptech
('22222222-0000-0000-0000-000000000007',
 'Daniel Kwok', 'daniel@test.com', 'male', '1987-08-23', 'Hong Kong', 'Tsim Sha Tsui',
 'Real estate tech entrepreneur. Built HK property analytics platform.',
 'Property market insights, real estate data, PropTech connections.',
 'AI developers, data scientists, real estate investors.',
 '50_50', 'danielkwok_wx', '+85291022022', ARRAY['EN','ZH','CAN'],
 '["PropTech","Real Estate","Data","Analytics","Hong Kong"]',
 'active','active',5,
 'https://picsum.photos/150?random=207',
 NOW(), NOW()),

-- 23. Social Impact
('22222222-0000-0000-0000-000000000008',
 'Priya Sharma', 'priya@test.com', 'female', '1990-01-15', 'Hong Kong', 'Sai Ying Pun',
 'Social entrepreneur running NGO for digital literacy in rural Asia.',
 'Grant writing, impact measurement, NGO management.',
 'CSR partnerships, tech volunteers, impact investors.',
 '70_30', 'priyasharma_wx', '+85291023023', ARRAY['EN'],
 '["Social Impact","NGO","Digital Literacy","CSR","Impact Investing"]',
 'active','active',3,
 'https://picsum.photos/150?random=208',
 NOW(), NOW()),

-- 24. Gaming Industry
('22222222-0000-0000-0000-000000000009',
 'Eric Yuen', 'eric@test.com', 'male', '1995-03-30', 'Macau', 'Macau',
 'Game developer at a mobile gaming studio. Unity expert, 3 published games.',
 'Unity development, game monetization, mobile game design.',
 'Publishers, investors in gaming, AR/VR developers.',
 '30_70', 'ericyuen_wx', '+85391024024', ARRAY['ZH','EN','CAN'],
 '["Gaming","Unity","Mobile Games","AR/VR","Monetization"]',
 'active','active',4,
 'https://picsum.photos/150?random=209',
 NOW(), NOW()),

-- 25. Supply Chain
('22222222-0000-0000-0000-000000000010',
 'Helen Tsang', 'helen@test.com', 'female', '1989-07-11', 'Hong Kong', 'Kwun Tong',
 'Supply chain consultant. Helped Fortune 500 companies optimize Asia operations.',
 'Logistics optimization, supplier sourcing, inventory management.',
 'E-commerce founders, manufacturing startups, logistics tech.',
 '50_50', 'helentsang_wx', '+85291025025', ARRAY['EN','ZH','CAN'],
 '["Supply Chain","Logistics","Manufacturing","E-commerce","Operations"]',
 'active','active',4,
 'https://picsum.photos/150?random=210',
 NOW(), NOW()),

-- 26. Biotech
('22222222-0000-0000-0000-000000000011',
 'Marcus Wong', 'marcus@test.com', 'male', '1984-12-02', 'Hong Kong', 'Sha Tin',
 'Biotech researcher turned entrepreneur. PhD in molecular biology from HKU.',
 'Life sciences expertise, biotech regulatory, lab partnerships.',
 'Biotech investors, pharma companies, AI for drug discovery.',
 '30_70', 'marcuswong_wx', '+85291026026', ARRAY['EN','ZH'],
 '["Biotech","Life Sciences","Pharma","Research","Drug Discovery"]',
 'active','active',6,
 'https://picsum.photos/150?random=211',
 NOW(), NOW()),

-- 27. Freelance Designer
('22222222-0000-0000-0000-000000000012',
 'Tina Ho', 'tina@test.com', 'female', '1998-10-08', 'Hong Kong', 'Mong Kok',
 'Freelance brand designer. Worked with 100+ startups on visual identity.',
 'Logo design, brand guidelines, pitch deck design.',
 'Startup founders, marketing teams, creative agencies.',
 '70_30', 'tinaho_wx', '+85291027027', ARRAY['EN','CAN'],
 '["Design","Branding","Freelance","Startup","Visual Identity"]',
 'active','active',2,
 'https://picsum.photos/150?random=212',
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
WHERE id LIKE '22222222%' 
ORDER BY name;
