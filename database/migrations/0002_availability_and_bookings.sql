-- Owner:  Slot generation and booking rules are owned by Shanza
-- 0002: availability + bookings

-- ---------------------------------------------------------------------------
-- availability: a provider's weekly working hours.
-- day_of_week uses 0 = Sunday ... 6 = Saturday (same as EXTRACT(DOW ...)).
-- A day can have several rows (e.g. 09:00-13:00 and 15:00-19:00).
-- slot_duration_minutes is the length of one bookable slot.
-- ---------------------------------------------------------------------------
CREATE TABLE availability (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id           uuid        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
  day_of_week           smallint    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time            time        NOT NULL,
  end_time              time        NOT NULL,
  slot_duration_minutes integer     NOT NULL DEFAULT 60 CHECK (slot_duration_minutes > 0),
  is_active             boolean     NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE (provider_id, day_of_week, start_time)
);

CREATE INDEX availability_provider_day_idx ON availability (provider_id, day_of_week);

CREATE TRIGGER availability_set_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- availability_breaks: recurring weekly breaks (lunch etc.) inside working hours.
-- ---------------------------------------------------------------------------
CREATE TABLE availability_breaks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
  day_of_week smallint    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  time        NOT NULL,
  end_time    time        NOT NULL,
  label       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE (provider_id, day_of_week, start_time)
);

CREATE INDEX availability_breaks_provider_day_idx ON availability_breaks (provider_id, day_of_week);

CREATE TRIGGER availability_breaks_set_updated_at
  BEFORE UPDATE ON availability_breaks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- availability_exceptions: one-off changes for a specific date.
--   is_available = false -> provider is closed that whole day (holiday, leave)
--   is_available = true  -> special hours given by start_time / end_time
-- ---------------------------------------------------------------------------
CREATE TABLE availability_exceptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id    uuid        NOT NULL REFERENCES providers (id) ON DELETE CASCADE,
  exception_date date        NOT NULL,
  is_available   boolean     NOT NULL DEFAULT false,
  start_time     time,
  end_time       time,
  reason         text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (is_available = false)
    OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  UNIQUE (provider_id, exception_date)
);

CREATE TRIGGER availability_exceptions_set_updated_at
  BEFORE UPDATE ON availability_exceptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- bookings
-- booking_code is the human-friendly "Booking ID" (BK-000001) shown to users;
-- id is the internal UUID. price is a snapshot of the service price at booking
-- time so later price edits never change old bookings.
-- Status values match BookingStatus in shared types.
-- ---------------------------------------------------------------------------
CREATE SEQUENCE booking_code_seq START 1;

CREATE TABLE bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code        text          NOT NULL UNIQUE
                      DEFAULT ('BK-' || lpad(nextval('booking_code_seq')::text, 6, '0')),
  customer_id         uuid          NOT NULL REFERENCES customers (user_id) ON DELETE RESTRICT,
  provider_id         uuid          NOT NULL REFERENCES providers (id) ON DELETE RESTRICT,
  service_id          uuid          NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  booking_date        date          NOT NULL,
  start_time          time          NOT NULL,
  end_time            time          NOT NULL,
  price               numeric(10, 2) NOT NULL CHECK (price >= 0),
  currency            text          NOT NULL DEFAULT 'PKR',
  status              text          NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  customer_notes      text,
  contact_phone       text,
  rescheduled_count   smallint      NOT NULL DEFAULT 0,
  cancelled_by        uuid          REFERENCES users (id) ON DELETE SET NULL,
  cancellation_reason text,
  cancelled_at        timestamptz,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

-- A provider cannot have two active bookings starting at the same time.
-- (Overlap protection for different-length services is left to booking logic.)
CREATE UNIQUE INDEX bookings_provider_slot_active_key
  ON bookings (provider_id, booking_date, start_time)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX bookings_customer_idx      ON bookings (customer_id, booking_date DESC);
CREATE INDEX bookings_provider_date_idx ON bookings (provider_id, booking_date);
CREATE INDEX bookings_service_idx       ON bookings (service_id);
CREATE INDEX bookings_status_idx        ON bookings (status);

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
