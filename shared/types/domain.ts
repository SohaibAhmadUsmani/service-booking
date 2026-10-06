/** Shared domain enums — extend here when adding fields; coordinate in PRs. */

export enum UserRole {
  Customer = "customer",
  Provider = "provider",
  Admin = "admin",
}

/** Where a service is delivered. Stored in services.service_type. */
export enum ServiceType {
  HomeVisit = "home_visit",
  InStore = "in_store",
  Online = "online",
}

export enum BookingStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Completed = "completed",
  Cancelled = "cancelled",
  NoShow = "no_show",
}

export enum PaymentStatus {
  Pending = "pending",
  Paid = "paid",
  Failed = "failed",
  Refunded = "refunded",
}

export enum NotificationType {
  BookingConfirmed = "booking_confirmed",
  BookingCancelled = "booking_cancelled",
  UpcomingAppointment = "upcoming_appointment",
  BookingRescheduled = "booking_rescheduled",
  NewReview = "new_review",
  ProviderUpdate = "provider_update",
}
