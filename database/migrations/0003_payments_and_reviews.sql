-- Payment flow and review rules are owned by Namra.
-- 0003: payments + reviews

-- ---------------------------------------------------------------------------
-- payments: mock payments for the internship version.
-- Status values match PaymentStatus in shared types.
-- A booking can have more than one payment row (e.g. a failed attempt, then a
-- successful one, then a refund record).
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid           NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  amount          numeric(10, 2) NOT NULL CHECK (amount >= 0),
  currency        text           NOT NULL DEFAULT 'PKR',
  status          text           NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  method          text           NOT NULL DEFAULT 'mock_card',
  transaction_ref text           UNIQUE,
  failure_reason  text,
  paid_at         timestamptz,
  refunded_at     timestamptz,
  created_at      timestamptz    NOT NULL DEFAULT now(),
  updated_at      timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX payments_booking_idx ON payments (booking_id);
CREATE INDEX payments_status_idx  ON payments (status);

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- reviews: one review per completed booking.
-- Provider ratings are calculated from this table (average of rating where
-- is_hidden = false), so there is no denormalised rating column to keep in sync.
-- is_hidden lets an admin moderate a review without deleting it.
-- "Completed booking only" is enforced by the review API, not by the schema.
-- ---------------------------------------------------------------------------
CREATE TABLE reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid        NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
  customer_id uuid        NOT NULL REFERENCES customers (user_id) ON DELETE CASCADE,
  provider_id uuid        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
  service_id  uuid        REFERENCES services (id) ON DELETE SET NULL,
  rating      smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  is_hidden   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reviews_provider_idx ON reviews (provider_id, created_at DESC) WHERE NOT is_hidden;
CREATE INDEX reviews_customer_idx ON reviews (customer_id);

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
