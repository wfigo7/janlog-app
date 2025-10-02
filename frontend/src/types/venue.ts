/**
 * 会場関連の型定義
 */

export interface Venue {
  venueId: string;
  venueName: string;
  usageCount: number;
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VenueListResponse {
  success: boolean;
  data: Venue[];
}