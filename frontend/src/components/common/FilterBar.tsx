/**
 * コンパクトなフィルターバーコンポーネント
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { venueService } from '../../services/venueService';
import { rulesetService } from '../../services/rulesetService';
import { Venue, VenueListResponse } from '../../types/venue';
import { Ruleset, RulesetListResponse } from '../../types/ruleset';
import { GameMode } from '../../types/common';
import { MatchType } from '../../types/match';

export type MatchTypeFilterValue = 'free' | 'set' | 'competition';

export interface FilterOptions {
  dateRange?: DateRange;
  venueId?: string;
  rulesetId?: string;
  matchType?: MatchTypeFilterValue;
}

interface FilterBarProps {
  value: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  gameMode: GameMode;
  showVenueFilter?: boolean;
  showRulesetFilter?: boolean;
  showMatchTypeFilter?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  value,
  onChange,
  gameMode,
  showVenueFilter = true,
  showRulesetFilter = true,
  showMatchTypeFilter = true,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [filteredRulesets, setFilteredRulesets] = useState<Ruleset[]>([]);
  const [loading, setLoading] = useState(false);

  // フィルターが設定されているかチェック
  const hasActiveFilters = !!(
    value.dateRange?.from ||
    value.dateRange?.to ||
    value.venueId ||
    value.rulesetId ||
    value.matchType
  );

  // アクティブなフィルター数をカウント
  const activeFilterCount = [
    value.dateRange?.from || value.dateRange?.to,
    value.venueId,
    value.rulesetId,
    value.matchType,
  ].filter(Boolean).length;

  useEffect(() => {
    if (showModal) {
      loadFilterData();
    }
  }, [showModal]);

  // ゲームモードでルールセットをフィルタリング
  useEffect(() => {
    const filtered = rulesetService.filterRulesetsByGameMode(rulesets, gameMode);
    setFilteredRulesets(filtered);
  }, [rulesets, gameMode]);

  const loadFilterData = async () => {
    setLoading(true);
    try {
      const promises = [];

      if (showVenueFilter) {
        promises.push(venueService.getVenues());
      }

      if (showRulesetFilter) {
        promises.push(rulesetService.getRulesets());
      }

      const results = await Promise.all(promises);

      let resultIndex = 0;
      if (showVenueFilter) {
        const venueResponse = results[resultIndex++] as VenueListResponse;
        if (venueResponse.success) {
          setVenues(venueResponse.data);
        }
      }

      if (showRulesetFilter) {
        const rulesets = results[resultIndex++] as Ruleset[];
        // ルール名の昇順でソート
        const sortedRulesets = rulesets.sort((a, b) => a.ruleName.localeCompare(b.ruleName, 'ja'));
        setRulesets(sortedRulesets);
      }
    } catch (error) {
      console.error('フィルターデータ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dateRange: DateRange) => {
    onChange({
      ...value,
      dateRange,
    });
  };

  const handleVenueChange = (venueId: string | undefined) => {
    onChange({
      ...value,
      venueId,
    });
  };

  const handleRulesetChange = (rulesetId: string | undefined) => {
    onChange({
      ...value,
      rulesetId,
    });
  };

  const handleMatchTypeChange = (matchType: MatchTypeFilterValue | 'all') => {
    onChange({
      ...value,
      matchType: matchType === 'all' ? undefined : matchType,
    });
  };

  const clearAllFilters = () => {
    onChange({});
    setShowModal(false);
  };



  return (
    <>
      <TouchableOpacity
        style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons
          name="filter-outline"
          size={16}
          color={hasActiveFilters ? "#FFFFFF" : "#666666"}
        />
        <Text style={[
          styles.filterButtonText,
          hasActiveFilters && styles.filterButtonTextActive
        ]}>
          フィルター
        </Text>
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalCloseText}>完了</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>フィルター</Text>
            <TouchableOpacity
              style={styles.modalClearButton}
              onPress={clearAllFilters}
            >
              <Text style={styles.modalClearText}>クリア</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 期間フィルター */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>期間</Text>
              <DateRangePicker
                value={value.dateRange || {}}
                onChange={handleDateRangeChange}
                placeholder="全期間"
              />
            </View>

            {/* 会場フィルター */}
            {showVenueFilter && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>会場</Text>
                <View style={styles.optionsList}>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      !value.venueId && styles.optionItemSelected
                    ]}
                    onPress={() => handleVenueChange(undefined)}
                  >
                    <Text style={[
                      styles.optionText,
                      !value.venueId && styles.optionTextSelected
                    ]}>
                      すべての会場
                    </Text>
                    {!value.venueId && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  {venues.map((venue) => (
                    <TouchableOpacity
                      key={venue.venueId}
                      style={[
                        styles.optionItem,
                        value.venueId === venue.venueId && styles.optionItemSelected
                      ]}
                      onPress={() => handleVenueChange(venue.venueId)}
                    >
                      <Text style={[
                        styles.optionText,
                        value.venueId === venue.venueId && styles.optionTextSelected
                      ]}>
                        {venue.venueName}
                      </Text>
                      {value.venueId === venue.venueId && (
                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ルールフィルター */}
            {showRulesetFilter && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>ルール</Text>
                <View style={styles.optionsList}>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      !value.rulesetId && styles.optionItemSelected
                    ]}
                    onPress={() => handleRulesetChange(undefined)}
                  >
                    <Text style={[
                      styles.optionText,
                      !value.rulesetId && styles.optionTextSelected
                    ]}>
                      すべてのルール
                    </Text>
                    {!value.rulesetId && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  {filteredRulesets.map((ruleset) => (
                    <TouchableOpacity
                      key={ruleset.rulesetId}
                      style={[
                        styles.optionItem,
                        value.rulesetId === ruleset.rulesetId && styles.optionItemSelected
                      ]}
                      onPress={() => handleRulesetChange(ruleset.rulesetId)}
                    >
                      <Text style={[
                        styles.optionText,
                        value.rulesetId === ruleset.rulesetId && styles.optionTextSelected
                      ]}>
                        {ruleset.ruleName}
                      </Text>
                      {value.rulesetId === ruleset.rulesetId && (
                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 対局種別フィルター */}
            {showMatchTypeFilter && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>対局種別</Text>
                <View style={styles.optionsList}>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      !value.matchType && styles.optionItemSelected
                    ]}
                    onPress={() => handleMatchTypeChange('all')}
                  >
                    <Text style={[
                      styles.optionText,
                      !value.matchType && styles.optionTextSelected
                    ]}>
                      すべての対局種別
                    </Text>
                    {!value.matchType && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      value.matchType === 'free' && styles.optionItemSelected
                    ]}
                    onPress={() => handleMatchTypeChange('free')}
                  >
                    <Text style={[
                      styles.optionText,
                      value.matchType === 'free' && styles.optionTextSelected
                    ]}>
                      フリー
                    </Text>
                    {value.matchType === 'free' && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      value.matchType === 'set' && styles.optionItemSelected
                    ]}
                    onPress={() => handleMatchTypeChange('set')}
                  >
                    <Text style={[
                      styles.optionText,
                      value.matchType === 'set' && styles.optionTextSelected
                    ]}>
                      セット
                    </Text>
                    {value.matchType === 'set' && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      value.matchType === 'competition' && styles.optionItemSelected
                    ]}
                    onPress={() => handleMatchTypeChange('competition')}
                  >
                    <Text style={[
                      styles.optionText,
                      value.matchType === 'competition' && styles.optionTextSelected
                    ]}>
                      競技
                    </Text>
                    {value.matchType === 'competition' && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>

                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalCloseButton: {
    paddingVertical: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalClearButton: {
    paddingVertical: 4,
  },
  modalClearText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  selectedText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '500',
  },
  optionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  optionSubtext: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});