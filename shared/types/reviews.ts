export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

export interface ReviewListQuery {
  bookingId?: string;
  customerId?: string;
  providerId?: string;
  page?: number;
  limit?: number;
}

export interface ProviderRatingSummary {
  providerId: string;
  averageRating: number;
  reviewCount: number;
}

export interface ReviewMutationResult {
  review: Review;
  rating: ProviderRatingSummary;
}
