export enum ComplaintCategory {
  ProviderNoShow = "provider_no_show",
  PoorQuality = "poor_quality",
  Overcharged = "overcharged",
  UnprofessionalBehavior = "unprofessional_behavior",
  CancellationDispute = "cancellation_dispute",
  Other = "other",
}

export enum ComplaintStatus {
  Open = "open",
  UnderReview = "under_review",
  Resolved = "resolved",
  Rejected = "rejected",
}

export interface Complaint {
  id: string;
  _id?: string;
  complaintId: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  category: ComplaintCategory;
  description: string;
  evidenceUrls?: string[];
  status: ComplaintStatus;
  resolutionNotes?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintInput {
  bookingId: string;
  category: ComplaintCategory;
  description: string;
  evidenceUrls?: string[];
}

export interface ResolveComplaintInput {
  status: ComplaintStatus;
  resolutionNotes?: string;
}
