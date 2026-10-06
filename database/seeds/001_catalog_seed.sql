-- Owner: Khadija
-- Development seed data: categories, providers, services, working hours,
-- a few customers and completed bookings with reviews (so ratings show up).

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Home Cleaning',      'home-cleaning',     'Deep cleaning, sofa and carpet care, kitchen cleaning.',          '🧹', 1),
  ('Plumbing',           'plumbing',          'Leak repair, fittings, drains and water tanks.',                  '🔧', 2),
  ('Electrical',         'electrical',        'Wiring, installations, UPS and inverter setup.',                  '💡', 3),
  ('Beauty & Salon',     'beauty-salon',      'Haircuts, grooming, facials and bridal makeup.',                  '💇', 4),
  ('Tutoring',           'tutoring',          'One-to-one lessons in school and technical subjects.',            '📚', 5),
  ('Fitness & Wellness', 'fitness-wellness',  'Personal training, yoga and diet consultations.',                 '🏋️', 6),
  ('Car Care',           'car-care',          'Washing, detailing and basic car maintenance.',                   '🚗', 7),
  ('IT & Tech Support',  'it-tech-support',   'Laptop repair, network setup and remote troubleshooting.',        '💻', 8)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Users: 11 providers, 4 customers, 1 admin
-- ---------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, full_name, phone, role, email_verified_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'sparkle@example.com',  'SEED_ACCOUNT_NO_LOGIN', 'Sana Malik',      '+92 300 1000001', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000002', 'cleannest@example.com','SEED_ACCOUNT_NO_LOGIN', 'Imran Qureshi',   '+92 300 1000002', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000003', 'pipefix@example.com',  'SEED_ACCOUNT_NO_LOGIN', 'Bilal Ahmed',     '+92 300 1000003', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000004', 'aquacare@example.com', 'SEED_ACCOUNT_NO_LOGIN', 'Tariq Mehmood',   '+92 300 1000004', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000005', 'voltpro@example.com',  'SEED_ACCOUNT_NO_LOGIN', 'Hamza Sheikh',    '+92 300 1000005', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000006', 'glow@example.com',     'SEED_ACCOUNT_NO_LOGIN', 'Ayesha Khan',     '+92 300 1000006', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000007', 'styleco@example.com',  'SEED_ACCOUNT_NO_LOGIN', 'Usman Raza',      '+92 300 1000007', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000008', 'brightminds@example.com','SEED_ACCOUNT_NO_LOGIN','Farah Siddiqui', '+92 300 1000008', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000009', 'fitlife@example.com',  'SEED_ACCOUNT_NO_LOGIN', 'Zain Abbas',      '+92 300 1000009', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000010', 'autoshine@example.com','SEED_ACCOUNT_NO_LOGIN', 'Kamran Butt',     '+92 300 1000010', 'provider', now()),
  ('a0000000-0000-0000-0000-000000000011', 'fixit@example.com',    'SEED_ACCOUNT_NO_LOGIN', 'Noman Javed',     '+92 300 1000011', 'provider', now()),
  ('c0000000-0000-0000-0000-000000000001', 'maryam.c@example.com', 'SEED_ACCOUNT_NO_LOGIN', 'Maryam Chaudhry', '+92 301 2000001', 'customer', now()),
  ('c0000000-0000-0000-0000-000000000002', 'ali.r@example.com',    'SEED_ACCOUNT_NO_LOGIN', 'Ali Raza',        '+92 301 2000002', 'customer', now()),
  ('c0000000-0000-0000-0000-000000000003', 'hina.s@example.com',   'SEED_ACCOUNT_NO_LOGIN', 'Hina Saeed',      '+92 301 2000003', 'customer', now()),
  ('c0000000-0000-0000-0000-000000000004', 'omar.f@example.com',   'SEED_ACCOUNT_NO_LOGIN', 'Omar Farooq',     '+92 301 2000004', 'customer', now()),
  ('d0000000-0000-0000-0000-000000000001', 'admin@example.com',    'SEED_ACCOUNT_NO_LOGIN', 'Platform Admin',  NULL,              'admin',    now())
ON CONFLICT DO NOTHING;

INSERT INTO customers (user_id, city)
SELECT id, CASE email
             WHEN 'maryam.c@example.com' THEN 'Islamabad'
             WHEN 'ali.r@example.com'    THEN 'Lahore'
             WHEN 'hina.s@example.com'   THEN 'Karachi'
             ELSE 'Rawalpindi'
           END
FROM users WHERE role = 'customer'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Providers
-- ---------------------------------------------------------------------------
INSERT INTO providers
  (id, user_id, business_name, slug, headline, bio, city, address_line, latitude, longitude, years_experience, is_verified)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sparkle Home Cleaners', 'sparkle-home-cleaners',
   'Spotless homes, every time', 'Trained, background-checked cleaners using safe, eco-friendly products. We handle everything from quick refreshes to full deep cleans.',
   'Islamabad', 'F-10 Markaz', 33.6938, 73.0123, 8, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'CleanNest Services', 'cleannest-services',
   'Reliable cleaning for busy families', 'Affordable regular and move-out cleaning with flexible scheduling across Lahore.',
   'Lahore', 'Gulberg III', 31.5204, 74.3587, 5, false),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'PipeFix Plumbers', 'pipefix-plumbers',
   'Fast fixes for leaks and fittings', 'Licensed plumbers with quick response times. Upfront pricing, no surprises.',
   'Islamabad', 'G-11 Markaz', 33.6685, 72.9985, 12, true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'AquaCare Plumbing', 'aquacare-plumbing',
   'Drains, geysers and more', 'Family-run plumbing service covering Rawalpindi and nearby areas.',
   'Rawalpindi', 'Saddar', 33.5973, 73.0479, 9, false),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'VoltPro Electricians', 'voltpro-electricians',
   'Safe, certified electrical work', 'Certified electricians for home wiring, installations and backup power setups.',
   'Karachi', 'Gulshan-e-Iqbal', 24.9215, 67.0924, 10, true),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'Glow Beauty Studio', 'glow-beauty-studio',
   'Look and feel your best', 'Full-service beauty studio specialising in hair, skin and bridal makeup.',
   'Lahore', 'DHA Phase 5', 31.4697, 74.4080, 7, true),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'Style & Co Salon', 'style-and-co-salon',
   'Sharp cuts, clean grooming', 'Neighbourhood barber and grooming salon with walk-in and booked appointments.',
   'Islamabad', 'F-7 Markaz', 33.7215, 73.0553, 6, false),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'BrightMinds Tutors', 'brightminds-tutors',
   'Learn with confidence', 'Experienced tutors for O/A-level and university subjects, taught online.',
   'Karachi', 'Clifton', 24.8138, 67.0300, 11, true),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009', 'FitLife Coaching', 'fitlife-coaching',
   'Training that fits your life', 'Certified trainer offering personal sessions, online yoga and nutrition advice.',
   'Islamabad', 'E-11', 33.7000, 72.9800, 6, false),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'AutoShine Car Care', 'autoshine-car-care',
   'Showroom shine at your doorstep', 'Mobile car washing and in-workshop interior detailing.',
   'Rawalpindi', 'Bahria Town Phase 4', 33.5290, 73.1100, 4, false),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'FixIt IT Support', 'fixit-it-support',
   'Tech problems, solved', 'Laptop repair, network setup and remote help for homes and small offices.',
   'Lahore', 'Johar Town', 31.4697, 74.2728, 9, true)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Services (provider slug, category slug, name, description, type, price, minutes)
-- ---------------------------------------------------------------------------
INSERT INTO services (provider_id, category_id, name, description, service_type, price, duration_minutes)
SELECT p.id, c.id, v.name, v.description, v.service_type, v.price, v.duration_minutes
FROM (VALUES
  ('sparkle-home-cleaners', 'home-cleaning', 'Deep House Cleaning',     'Top-to-bottom clean of all rooms, including windows and bathrooms.', 'home_visit', 6500, 180),
  ('sparkle-home-cleaners', 'home-cleaning', 'Sofa & Carpet Cleaning',  'Steam cleaning for sofas and carpets.',                              'home_visit', 4000, 120),
  ('sparkle-home-cleaners', 'home-cleaning', 'Kitchen Cleaning',        'Degreasing of surfaces, appliances, hob and sink.',                  'home_visit', 2500,  90),
  ('cleannest-services',    'home-cleaning', 'Regular Home Cleaning',   'Routine cleaning for apartments and houses.',                        'home_visit', 3500, 120),
  ('cleannest-services',    'home-cleaning', 'Move-out Cleaning',       'Full clean before handing over a property.',                         'home_visit', 8000, 240),
  ('pipefix-plumbers',      'plumbing',      'Leak Repair',             'Find and fix leaking pipes, taps and joints.',                       'home_visit', 1500,  60),
  ('pipefix-plumbers',      'plumbing',      'Bathroom Fitting',        'Installation of taps, showers, commodes and basins.',                'home_visit', 5000, 180),
  ('pipefix-plumbers',      'plumbing',      'Water Tank Cleaning',     'Cleaning and disinfection of overhead and underground tanks.',       'home_visit', 3500, 120),
  ('aquacare-plumbing',     'plumbing',      'Drain Unblocking',        'Clear blocked kitchen and bathroom drains.',                         'home_visit', 2000,  60),
  ('aquacare-plumbing',     'plumbing',      'Geyser Installation',     'Supply-and-fit or fit-only installation of gas and electric geysers.', 'home_visit', 3000, 120),
  ('voltpro-electricians',  'electrical',    'Wiring Inspection',       'Safety inspection of home wiring and distribution board.',           'home_visit', 2000,  60),
  ('voltpro-electricians',  'electrical',    'Fan & Light Installation','Install ceiling fans, light fittings and switches.',                 'home_visit', 1200,  45),
  ('voltpro-electricians',  'electrical',    'UPS & Inverter Setup',    'Install and configure UPS or solar inverter systems.',               'home_visit', 4500, 120),
  ('glow-beauty-studio',    'beauty-salon',  'Haircut & Styling',       'Wash, cut and blow-dry with a senior stylist.',                      'in_store',   1800,  60),
  ('glow-beauty-studio',    'beauty-salon',  'Signature Facial',        'Deep-cleansing facial with relaxing massage.',                       'in_store',   3500,  75),
  ('glow-beauty-studio',    'beauty-salon',  'Bridal Makeup',           'Complete bridal makeup and hair, trial included.',                   'home_visit', 25000, 180),
  ('style-and-co-salon',    'beauty-salon',  'Men''s Haircut',          'Classic and modern cuts with wash.',                                 'in_store',    800,  30),
  ('style-and-co-salon',    'beauty-salon',  'Beard Grooming',          'Beard trim, shape and hot-towel finish.',                            'in_store',    600,  30),
  ('brightminds-tutors',    'tutoring',      'Math Tutoring',           'One-to-one online maths lessons for O/A-level and university.',      'online',     2000,  60),
  ('brightminds-tutors',    'tutoring',      'Physics Tutoring',        'Concept-focused online physics lessons with past-paper practice.',   'online',     2200,  60),
  ('brightminds-tutors',    'tutoring',      'Programming Basics',      'Learn Python or Java fundamentals from scratch.',                    'online',     2500,  60),
  ('fitlife-coaching',      'fitness-wellness','Personal Training Session','Customised one-to-one workout at the studio.',                  'in_store',   3000,  60),
  ('fitlife-coaching',      'fitness-wellness','Online Yoga Class',     'Guided yoga session you can join from home.',                        'online',     1200,  45),
  ('fitlife-coaching',      'fitness-wellness','Diet Consultation',     'Personalised meal guidance and follow-up plan.',                     'online',     2500,  45),
  ('autoshine-car-care',    'car-care',      'Full Car Wash',           'Exterior wash, wax and tyre shine at your location.',                'home_visit', 1500,  60),
  ('autoshine-car-care',    'car-care',      'Interior Detailing',      'Deep clean of seats, carpets and dashboard.',                        'in_store',   4000, 120),
  ('fixit-it-support',      'it-tech-support','Laptop Repair',          'Diagnosis and repair of hardware and software faults.',              'in_store',   2500,  90),
  ('fixit-it-support',      'it-tech-support','Wi-Fi Setup',            'Router configuration and coverage optimisation.',                    'home_visit', 1800,  60),
  ('fixit-it-support',      'it-tech-support','Remote Troubleshooting', 'Fix common PC and software problems over a remote session.',        'online',     1000,  30)
) AS v(provider_slug, category_slug, name, description, service_type, price, duration_minutes)
JOIN providers  p ON p.slug = v.provider_slug
JOIN categories c ON c.slug = v.category_slug
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Working hours: Monday-Saturday 09:00-17:00, 60-minute slots, 13:00-14:00 break.
-- Two providers also work Sundays; one is closed Wednesdays.
-- ---------------------------------------------------------------------------
INSERT INTO availability (provider_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT p.id, d, '09:00', '17:00', 60
FROM providers p, generate_series(1, 6) AS d
ON CONFLICT DO NOTHING;

INSERT INTO availability (provider_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT p.id, 0, '10:00', '15:00', 60
FROM providers p
WHERE p.slug IN ('glow-beauty-studio', 'autoshine-car-care')
ON CONFLICT DO NOTHING;

DELETE FROM availability a
USING providers p
WHERE a.provider_id = p.id AND p.slug = 'style-and-co-salon' AND a.day_of_week = 3;

INSERT INTO availability_breaks (provider_id, day_of_week, start_time, end_time, label)
SELECT a.provider_id, a.day_of_week, '13:00', '14:00', 'Lunch break'
FROM availability a
WHERE a.start_time = '09:00'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Completed bookings + reviews so ratings are visible in search and profiles.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE seed_reviews (
  n             integer,
  customer      text,
  provider_slug text,
  service_name  text,
  day           date,
  rating        smallint,
  comment       text
);

INSERT INTO seed_reviews VALUES
  ( 1, 'maryam.c@example.com', 'sparkle-home-cleaners', 'Deep House Cleaning',      '2026-08-12', 5, 'The team was punctual and the house looked brand new. Highly recommended.'),
  ( 2, 'ali.r@example.com',    'sparkle-home-cleaners', 'Kitchen Cleaning',         '2026-08-20', 5, 'Great attention to detail, especially around the hob.'),
  ( 3, 'hina.s@example.com',   'sparkle-home-cleaners', 'Sofa & Carpet Cleaning',   '2026-09-02', 4, 'Very good result, arrived a little late.'),
  ( 4, 'omar.f@example.com',   'cleannest-services',    'Regular Home Cleaning',    '2026-08-15', 4, 'Good value and friendly staff.'),
  ( 5, 'maryam.c@example.com', 'pipefix-plumbers',      'Leak Repair',              '2026-08-18', 5, 'Fixed the leak in under an hour. Clear pricing.'),
  ( 6, 'hina.s@example.com',   'pipefix-plumbers',      'Bathroom Fitting',         '2026-09-05', 5, 'Neat work and cleaned up afterwards.'),
  ( 7, 'ali.r@example.com',    'aquacare-plumbing',     'Drain Unblocking',         '2026-08-25', 3, 'Job done but took longer than quoted.'),
  ( 8, 'omar.f@example.com',   'voltpro-electricians',  'Wiring Inspection',        '2026-08-30', 5, 'Thorough inspection with a clear written summary.'),
  ( 9, 'hina.s@example.com',   'voltpro-electricians',  'UPS & Inverter Setup',     '2026-09-10', 4, 'Professional installation.'),
  (10, 'maryam.c@example.com', 'glow-beauty-studio',    'Haircut & Styling',        '2026-09-01', 5, 'Loved the haircut, lovely atmosphere.'),
  (11, 'ali.r@example.com',    'glow-beauty-studio',    'Signature Facial',         '2026-09-08', 5, 'Relaxing and my skin looked great.'),
  (12, 'hina.s@example.com',   'glow-beauty-studio',    'Bridal Makeup',            '2026-09-15', 4, 'Beautiful result. Trial session was helpful.'),
  (13, 'omar.f@example.com',   'style-and-co-salon',    'Men''s Haircut',           '2026-08-22', 4, 'Quick and clean cut.'),
  (14, 'ali.r@example.com',    'brightminds-tutors',    'Math Tutoring',            '2026-09-03', 5, 'Explains concepts so clearly. My grades improved.'),
  (15, 'maryam.c@example.com', 'brightminds-tutors',    'Programming Basics',       '2026-09-12', 5, 'Patient and well prepared.'),
  (16, 'omar.f@example.com',   'brightminds-tutors',    'Physics Tutoring',         '2026-09-18', 4, 'Good sessions with plenty of practice questions.'),
  (17, 'hina.s@example.com',   'fitlife-coaching',      'Personal Training Session','2026-09-04', 4, 'Motivating and knowledgeable trainer.'),
  (18, 'maryam.c@example.com', 'fitlife-coaching',      'Online Yoga Class',        '2026-09-09', 3, 'Nice class, audio quality could be better.'),
  (19, 'ali.r@example.com',    'autoshine-car-care',    'Full Car Wash',            '2026-08-28', 4, 'Car looked great and they came right on time.'),
  (20, 'omar.f@example.com',   'fixit-it-support',      'Laptop Repair',            '2026-09-06', 5, 'Fixed my laptop the same day.'),
  (21, 'maryam.c@example.com', 'fixit-it-support',      'Wi-Fi Setup',              '2026-09-14', 4, 'Signal is much better across the house.');

INSERT INTO bookings
  (id, customer_id, provider_id, service_id, booking_date, start_time, end_time, price, currency, status)
SELECT ('e0000000-0000-0000-0000-' || lpad(r.n::text, 12, '0'))::uuid,
       u.id, p.id, s.id, r.day, '10:00'::time,
       '10:00'::time + (s.duration_minutes || ' minutes')::interval,
       s.price, s.currency, 'completed'
FROM seed_reviews r
JOIN users     u ON u.email = r.customer
JOIN providers p ON p.slug  = r.provider_slug
JOIN services  s ON s.provider_id = p.id AND s.name = r.service_name
ON CONFLICT (id) DO NOTHING;

INSERT INTO reviews (booking_id, customer_id, provider_id, service_id, rating, comment, created_at)
SELECT ('e0000000-0000-0000-0000-' || lpad(r.n::text, 12, '0'))::uuid,
       u.id, p.id, s.id, r.rating, r.comment, (r.day + 1)::timestamptz
FROM seed_reviews r
JOIN users     u ON u.email = r.customer
JOIN providers p ON p.slug  = r.provider_slug
JOIN services  s ON s.provider_id = p.id AND s.name = r.service_name
ON CONFLICT (booking_id) DO NOTHING;

DROP TABLE seed_reviews;
