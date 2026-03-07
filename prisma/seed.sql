-- Seed: Channels (from production)
INSERT INTO channels (id, name, createdAt) VALUES
('ch_phone_in', 'Phone (Inbound calls)', NOW()),
('ch_phone_out', 'Phone (Outbound calls)', NOW()),
('ch_email', 'Email', NOW()),
('ch_webchat', 'Web Chat', NOW()),
('ch_cobrowse', 'Co-Browse', NOW()),
('ch_screenshare', 'Screen Share / Control', NOW()),
('ch_mobilechat', 'Mobile / Text Chat', NOW());

-- Seed: Skills (curated from production — removed test/joke entries)
INSERT INTO skills (id, name, isCustom, createdAt) VALUES
('sk_email_support', 'Email Support', 0, NOW()),
('sk_product_qa', 'Answering Product Questions', 0, NOW()),
('sk_comm_etiquette', 'Communication Etiquette', 0, NOW()),
('sk_order_tracking', 'Order Tracking', 0, NOW()),
('sk_customer_support', 'Customer Support', 0, NOW()),
('sk_email_grammar', 'Conversational Email / Grammar', 0, NOW()),
('sk_sales', 'Sales', 0, NOW()),
('sk_retail', 'Retail', 0, NOW()),
('sk_supervisor', 'Supervisor', 0, NOW()),
('sk_mortgage', 'Mortgage Banking', 0, NOW()),
('sk_vip_service', 'VIP / White Glove Service', 0, NOW()),
('sk_team_lead', 'Team Lead', 0, NOW()),
('sk_wfm', 'Workforce Management', 0, NOW()),
('sk_analytics', 'Analytics', 0, NOW()),
('sk_collections_high', 'High End Collections', 0, NOW()),
('sk_complaint_res', 'Customer Complaint Resolution', 0, NOW()),
('sk_medical_coding', 'Medical Coding', 0, NOW()),
('sk_insurance_claims', 'Insurance Claims Adjustor', 0, NOW()),
('sk_collections', 'Collections', 0, NOW()),
('sk_insurance', 'Insurance', 0, NOW()),
('sk_billing', 'Billing', 0, NOW()),
('sk_tech_support', 'Technical Support', 0, NOW()),
('sk_data_entry', 'Data Entry', 0, NOW()),
('sk_scheduling', 'Scheduling', 0, NOW()),
('sk_healthcare', 'Healthcare', 0, NOW()),
('sk_telemarketing', 'Telemarketing', 0, NOW()),
('sk_quality_assurance', 'Quality Assurance', 0, NOW()),
('sk_training', 'Training', 0, NOW()),
('sk_dispute_resolution', 'Dispute Resolution', 0, NOW()),
('sk_account_management', 'Account Management', 0, NOW());

-- Seed: Test user (password: Test1234)
-- bcrypt hash of "Test1234" with 12 rounds
INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt) VALUES
('usr_test_pro', 'pro@remagent.com', '$2b$12$INjCGv91EwjjC54Okp6.8OpXDs5E0UMULLlcka4BtTYWI/awuFAf6', 'Sarah', 'Johnson', 'PROFESSIONAL', NOW(), NOW()),
('usr_test_biz', 'biz@remagent.com', '$2b$12$INjCGv91EwjjC54Okp6.8OpXDs5E0UMULLlcka4BtTYWI/awuFAf6', 'Mike', 'Thompson', 'BUSINESS', NOW(), NOW());

-- Create professional profile for test pro user
INSERT INTO professional_profiles (id, userId, onboardingStep) VALUES
('pp_test_pro', 'usr_test_pro', 1);

-- Create business profile for test biz user
INSERT INTO business_profiles (id, userId, businessName) VALUES
('bp_test_biz', 'usr_test_biz', 'Acme Corp');
