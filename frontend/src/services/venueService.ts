import { apiClient } from '../utils/apiClient';

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

class VenueService {
    /**
     * ユーザーの会場一覧を取得
     */
    async getVenues(): Promise<Venue[]> {
        try {
            const response = await apiClient.get<VenueListResponse>('/venues');

            if (response.success) {
                return response.data;
            } else {
                throw new Error('会場一覧の取得に失敗しました');
            }
        } catch (error) {
            console.error('会場一覧取得エラー:', error);
            throw error;
        }
    }
}

export const venueService = new VenueService();