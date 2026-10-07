-- Delivery logic is owned by Namra (notifications)
-- and Aiman (complaints handling).
-- 0004: notifications + complaints

-- ---------------------------------------------------------------------------
-- notifications: in-app notifications for any user.
-- type values match NotificationType in shared types.
-- data holds extra context (e.g. {"bookingId": "..."}) for deep links.
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       text        NOT NULL
             CHECK (type IN (
               'booking_confirmed', 'booking_cancelled', 'upcoming_appointment',
               'booking_rescheduled', 'new_review', 'provider_update'
             )),
  title      text        NOT NULL,
  body       text,
  data       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  is_read    boolean     NOT NULL DEFAULT false,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx   ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notifications (user_id) WHERE NOT is_read;

-- ---------------------------------------------------------------------------
-- complaints: raised by a user, optionally about a provider and/or a booking,
-- and resolved by an admin.
-- ---------------------------------------------------------------------------
CREATE TABLE complaints (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complainant_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  against_provider_id uuid        REFERENCES providers (id) ON DELETE SET NULL,
  booking_id          uuid        REFERENCES bookings (id) ON DELETE SET NULL,
  subject             text        NOT NULL,
  description         text        NOT NULL,
  status              text        NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
  admin_notes         text,
  resolved_by         uuid        REFERENCES users (id) ON DELETE SET NULL,
  resolved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX complaints_status_idx      ON complaints (status, created_at DESC);
CREATE INDEX complaints_complainant_idx ON complaints (complainant_id);
CREATE INDEX complaints_provider_idx    ON complaints (against_provider_id);

CREATE TRIGGER complaints_set_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
