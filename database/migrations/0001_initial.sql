
-- 0001: core identity + catalog tables
-- Conventions
--   * UUID primary keys (gen_random_uuid() is built in since PostgreSQL 13).
--   * Enum-like columns are TEXT + CHECK so the allowed values can be changed
--     with a simple migration. Allowed values mirror shared/types/domain.ts.
--   * created_at / updated_at on every mutable table (updated_at via trigger).

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- users: one row per account (customer, provider or admin).
-- Auth logic (hashing, JWT, verification) belongs to the identity module;
-- this table only stores the data it needs.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL,
  password_hash     text        NOT NULL,
  full_name         text        NOT NULL,
  phone             text,
  role              text        NOT NULL DEFAULT 'customer'
                    CHECK (role IN ('customer', 'provider', 'admin')),
  avatar_url        text,
  is_active         boolean     NOT NULL DEFAULT true,
  email_verified_at timestamptz,
  last_login_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Emails are unique case-insensitively.
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));
CREATE INDEX users_role_idx ON users (role);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- customers: profile data for users with role = 'customer'.
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
  user_id      uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  address_line text,
  city         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- providers: business profile for users with role = 'provider'.
-- status controls public visibility. It defaults to 'approved' so new
-- providers show up straight away during development; the admin module can
-- move providers to 'suspended'.
-- ---------------------------------------------------------------------------
CREATE TABLE providers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  business_name     text        NOT NULL,
  slug              text        NOT NULL UNIQUE,
  headline          text,
  bio               text,
  city              text,
  address_line      text,
  latitude          numeric(9, 6) CHECK (latitude  BETWEEN  -90 AND  90),
  longitude         numeric(9, 6) CHECK (longitude BETWEEN -180 AND 180),
  profile_image_url text,
  cover_image_url   text,
  years_experience  smallint    CHECK (years_experience >= 0),
  is_verified       boolean     NOT NULL DEFAULT false,
  status            text        NOT NULL DEFAULT 'approved'
                    CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX providers_status_idx ON providers (status);
CREATE INDEX providers_city_idx   ON providers (lower(city));

CREATE TRIGGER providers_set_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- categories: managed by admins, browsed by customers.
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  slug        text        NOT NULL UNIQUE,
  description text,
  icon        text,
  image_url   text,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX categories_sort_idx ON categories (sort_order, name);

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- services: what a provider offers.
-- service_type: where it is delivered (matches ServiceType in shared types)
--   home_visit = provider travels to the customer
--   in_store   = customer goes to the provider
--   online     = delivered remotely
-- Services that already have bookings cannot be hard-deleted (FK from
-- bookings is RESTRICT); deactivate them with is_active = false instead.
-- ---------------------------------------------------------------------------
CREATE TABLE services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      uuid          NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
  category_id      uuid          NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  name             text          NOT NULL,
  description      text,
  service_type     text          NOT NULL DEFAULT 'in_store'
                   CHECK (service_type IN ('home_visit', 'in_store', 'online')),
  price            numeric(10, 2) NOT NULL CHECK (price >= 0),
  currency         text          NOT NULL DEFAULT 'PKR',
  duration_minutes integer       NOT NULL CHECK (duration_minutes > 0),
  is_active        boolean       NOT NULL DEFAULT true,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX services_provider_name_key ON services (provider_id, lower(name));
CREATE INDEX services_category_idx ON services (category_id);
CREATE INDEX services_price_idx    ON services (price);
CREATE INDEX services_active_idx   ON services (is_active) WHERE is_active;

CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
