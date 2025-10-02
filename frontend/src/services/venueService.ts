import { apiClient } from '../utils/apiClient';
import { Venue, VenueListResponse } from '../types/venue';

class VenueService {
    /**
     * ユーザーの会場一覧を取得
     */
    async getVenues(): Promise<VenueListResponse> {
        try {
            const response = await apiClient.get<VenueListResponse>('/venues');
            return response;
        } catch (error) {
            console.error('会場一覧取得エラー:', error);
            return {
                success: false,
                data: []
            };
        }
    }
}

export const venueService = new VenueService();