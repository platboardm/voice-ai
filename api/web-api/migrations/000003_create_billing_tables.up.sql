--
-- Name: billing_plans; Type: TABLE;
--

CREATE TABLE public.billing_plans (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(50) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    price_monthly bigint DEFAULT 0 NOT NULL,
    price_yearly bigint DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'usd'::character varying NOT NULL,
    stripe_url text DEFAULT ''::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_date timestamp without time zone DEFAULT now() NOT NULL,
    updated_date timestamp without time zone
);

ALTER TABLE ONLY public.billing_plans
    ADD CONSTRAINT billing_plans_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.billing_plans
    ADD CONSTRAINT billing_plans_slug_key UNIQUE (slug);

CREATE INDEX idx_billing_plans_slug ON public.billing_plans USING btree (slug);
CREATE INDEX idx_billing_plans_is_active ON public.billing_plans USING btree (is_active);

--
-- Name: billing_plan_quotas; Type: TABLE;
--

CREATE TABLE public.billing_plan_quotas (
    id bigint NOT NULL,
    billing_plan_id bigint NOT NULL,
    resource_type character varying(100) NOT NULL,
    quota_limit bigint NOT NULL DEFAULT -1,
    created_date timestamp without time zone DEFAULT now() NOT NULL,
    updated_date timestamp without time zone
);

ALTER TABLE ONLY public.billing_plan_quotas
    ADD CONSTRAINT billing_plan_quotas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.billing_plan_quotas
    ADD CONSTRAINT billing_plan_quotas_plan_resource_key UNIQUE (billing_plan_id, resource_type);

ALTER TABLE ONLY public.billing_plan_quotas
    ADD CONSTRAINT billing_plan_quotas_billing_plan_id_fkey FOREIGN KEY (billing_plan_id) REFERENCES public.billing_plans(id) ON DELETE CASCADE;

CREATE INDEX idx_billing_plan_quotas_plan_id ON public.billing_plan_quotas USING btree (billing_plan_id);

--
-- Name: billing_subscriptions; Type: TABLE;
-- metadata jsonb stores plan change history, stripe IDs, etc.
--

CREATE TABLE public.billing_subscriptions (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    billing_plan_id bigint NOT NULL,
    billing_interval character varying(20) DEFAULT 'monthly'::character varying NOT NULL,
    status character varying(50) DEFAULT 'ACTIVE'::character varying NOT NULL,
    current_period_start timestamp without time zone DEFAULT now() NOT NULL,
    current_period_end timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by bigint NOT NULL,
    updated_by bigint,
    created_date timestamp without time zone DEFAULT now() NOT NULL,
    updated_date timestamp without time zone
);

ALTER TABLE ONLY public.billing_subscriptions
    ADD CONSTRAINT billing_subscriptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.billing_subscriptions
    ADD CONSTRAINT billing_subscriptions_organization_id_key UNIQUE (organization_id);

ALTER TABLE ONLY public.billing_subscriptions
    ADD CONSTRAINT billing_subscriptions_billing_plan_id_fkey FOREIGN KEY (billing_plan_id) REFERENCES public.billing_plans(id);

CREATE INDEX idx_billing_subscriptions_org_id ON public.billing_subscriptions USING btree (organization_id);
CREATE INDEX idx_billing_subscriptions_plan_id ON public.billing_subscriptions USING btree (billing_plan_id);
CREATE INDEX idx_billing_subscriptions_status ON public.billing_subscriptions USING btree (status);
