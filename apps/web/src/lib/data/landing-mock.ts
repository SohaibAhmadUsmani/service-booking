/** Image paths → `public/landing/` (refresh assets: `apps/web/scripts/fetch-landing-images.ps1`). */
export const landingStats = [
  { label: "Verified providers", value: 2.4, suffix: "k+" },
  { label: "Bookings completed", value: 128, suffix: "k+" },
  { label: "Average rating", value: 4.9, suffix: "/5" },
  { label: "Cities covered", value: 42, suffix: "" },
];

export const popularServices = [
  {
    id: "1",
    name: "Deep home cleaning",
    category: "Home",
    price: 89,
    duration: "3h",
    rating: 4.9,
    image: "/landing/popular/cleaning.jpg",
  },
  {
    id: "2",
    name: "AC service & repair",
    category: "Appliances",
    price: 45,
    duration: "1.5h",
    rating: 4.8,
    image: "/landing/popular/ac.jpg",
  },
  {
    id: "3",
    name: "Bridal makeup",
    category: "Beauty",
    price: 120,
    duration: "2h",
    rating: 5,
    image: "/landing/popular/makeup.jpg",
  },
  {
    id: "4",
    name: "Plumbing fix",
    category: "Repairs",
    price: 35,
    duration: "1h",
    rating: 4.7,
    image: "/landing/popular/plumbing.jpg",
  },
];

export const featuredProviders = [
  {
    id: "p1",
    name: "Sparkle Home Co.",
    specialty: "Premium cleaning",
    city: "Karachi",
    rating: 4.9,
    reviews: 312,
    verified: true,
    image: "/landing/providers/sparkle-home-co.jpg",
  },
  {
    id: "p2",
    name: "CoolAir Experts",
    specialty: "HVAC & appliances",
    city: "Lahore",
    rating: 4.8,
    reviews: 189,
    verified: true,
    image: "/landing/providers/coolair-experts.jpg",
  },
  {
    id: "p3",
    name: "Glow Studio",
    specialty: "Beauty & wellness",
    city: "Islamabad",
    rating: 5,
    reviews: 97,
    verified: true,
    image: "/landing/providers/glow-studio.jpg",
  },
];

export const categories = [
  {
    name: "Home cleaning",
    count: 240,
    image: "/landing/categories/home-cleaning.jpg",
  },
  {
    name: "Beauty & spa",
    count: 128,
    image: "/landing/categories/beauty.jpg",
  },
  {
    name: "Repairs",
    count: 310,
    image: "/landing/categories/repairs.jpg",
  },
  {
    name: "Fitness",
    count: 86,
    image: "/landing/categories/fitness.jpg",
  },
  {
    name: "Events",
    count: 54,
    image: "/landing/categories/events.jpg",
  },
  {
    name: "Tutoring",
    count: 72,
    image: "/landing/categories/tutoring.jpg",
  },
];

export const howItWorks = [
  {
    step: "01",
    title: "Search & compare",
    description: "Filter by location, price, ratings, and availability — all without leaving the page.",
  },
  {
    step: "02",
    title: "Pick a time slot",
    description: "See real-time availability and choose a slot that fits your schedule.",
  },
  {
    step: "03",
    title: "Book with confidence",
    description: "Secure checkout, instant confirmation, and reminders before your appointment.",
  },
];

export const testimonials = [
  {
    id: "t1",
    quote:
      "Booked a deep clean in under two minutes. The provider showed up on time and the place looked brand new.",
    author: "Sara K.",
    role: "Customer · Karachi",
    rating: 5,
  },
  {
    id: "t2",
    quote:
      "As a provider, the dashboard and booking flow are straightforward. More qualified leads every week.",
    author: "Ahmed R.",
    role: "Provider · Lahore",
    rating: 5,
  },
  {
    id: "t3",
    quote:
      "Love the transparent pricing and verified badges. Finally a booking site that feels premium.",
    author: "Maya T.",
    role: "Customer · Islamabad",
    rating: 5,
  },
];

export const faqItems = [
  {
    question: "How do I book a service?",
    answer:
      "Use the search bar on the homepage or browse categories. Select a provider, pick an available slot, and confirm your booking. You'll receive email and in-app confirmation.",
  },
  {
    question: "Are providers verified?",
    answer:
      "Verified providers complete identity and portfolio checks. Look for the verified badge on listings and profiles.",
  },
  {
    question: "Can I reschedule or cancel?",
    answer:
      "Yes. From your bookings page you can reschedule or cancel according to each provider's policy. Notifications keep everyone in sync.",
  },
  {
    question: "How do payments work?",
    answer:
      "We use a secure mock payment flow during development. Production will support card and local payment methods with clear receipts.",
  },
  {
    question: "How can I join as a provider?",
    answer:
      "Scroll to Become a Provider or register with a provider account. Set up services, availability, and start receiving bookings.",
  },
];
