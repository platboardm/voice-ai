-- Seed billing plans
-- Prices are in cents (e.g. 0 = free, 9900 = $99)

INSERT INTO public.billing_plans (id, name, slug, description, is_default, is_active, sort_order, price_monthly, price_yearly, currency, stripe_url, metadata, created_date)
VALUES
    (1000000000000001, 'Free', 'free', 'Get started with the basics', true, true, 1, 0, 0, 'usd', '', '{}', now()),
    (1000000000000002, 'Pro', 'pro', 'For growing teams that need more', false, true, 2, 9900, 99000, 'usd', '', '{}', now()),
    (1000000000000003, 'Enterprise', 'enterprise', 'Custom solutions for large organizations', false, true, 3, 0, 0, 'usd', '', '{"contactSales": true}', now());

-- Free plan quotas
INSERT INTO public.billing_plan_quotas (id, billing_plan_id, resource_type, quota_limit, created_date)
VALUES
    (2000000000000001, 1000000000000001, 'users', 1, now()),
    (2000000000000002, 1000000000000001, 'assistants', 1, now()),
    (2000000000000003, 1000000000000001, 'endpoints', 1, now()),
    (2000000000000004, 1000000000000001, 'knowledge_bases', 1, now()),
    (2000000000000005, 1000000000000001, 'log_retention_days', 30, now());

-- Pro plan quotas
INSERT INTO public.billing_plan_quotas (id, billing_plan_id, resource_type, quota_limit, created_date)
VALUES
    (2000000000000006, 1000000000000002, 'users', 5, now()),
    (2000000000000007, 1000000000000002, 'assistants', 5, now()),
    (2000000000000008, 1000000000000002, 'endpoints', 5, now()),
    (2000000000000009, 1000000000000002, 'knowledge_bases', 1, now()),
    (2000000000000010, 1000000000000002, 'log_retention_days', 30, now());

-- Enterprise plan quotas (-1 = unlimited)
INSERT INTO public.billing_plan_quotas (id, billing_plan_id, resource_type, quota_limit, created_date)
VALUES
    (2000000000000011, 1000000000000003, 'users', -1, now()),
    (2000000000000012, 1000000000000003, 'assistants', -1, now()),
    (2000000000000013, 1000000000000003, 'endpoints', -1, now()),
    (2000000000000014, 1000000000000003, 'knowledge_bases', -1, now()),
    (2000000000000015, 1000000000000003, 'log_retention_days', -1, now());
