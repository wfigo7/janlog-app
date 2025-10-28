/**
 * 統計チャートコンポーネント
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { RankDistribution } from '../../types/stats';
import { GameMode } from '../../types/common';
import { getRankColorsForChart } from '../../constants/rankColors';

const screenWidth = Dimensions.get('window').width;

interface StatsChartProps {
  type: 'rank-distribution' | 'trend';
  data: any;
  gameMode?: GameMode;
}

export const StatsChart: React.FC<StatsChartProps> = ({ type, data, gameMode }) => {
  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
  };

  const renderRankDistributionChart = () => {
    if (!data || typeof data !== 'object') return null;

    const distribution = data as RankDistribution;
    const ranks = gameMode === 'three' ? [1, 2, 3] : [1, 2, 3, 4];
    const colors = getRankColorsForChart(gameMode || 'four');
    const labels = ['1位', '2位', '3位', '4位'];

    const chartData = ranks.map((rank, index) => {
      const counts = [distribution.first, distribution.second, distribution.third, distribution.fourth];
      return {
        name: labels[rank - 1],
        count: counts[rank - 1],
        color: colors[rank - 1],
        legendFontColor: '#333333',
        legendFontSize: 12,
      };
    }).filter(item => item.count > 0);

    if (chartData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>データがありません</Text>
        </View>
      );
    }

    return (
      <PieChart
        data={chartData}
        width={screenWidth - 104}
        height={200}
        chartConfig={chartConfig}
        accessor="count"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 0]}
        absolute
      />
    );
  };

  const renderTrendChart = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>データが不足しています</Text>
        </View>
      );
    }

    // 最近の対局の順位推移を表示
    const recentMatches = data.slice(-10); // 最新10局
    const labels = recentMatches.map((_match, index) => `${index + 1}`);
    const rankData = recentMatches.map(match => match.rank);

    // Y軸の範囲を設定（順位が上が上にくるように反転）
    const maxRank = gameMode === 'three' ? 3 : 4;
    const minRank = 0;

    // ダミーデータを追加してY軸の範囲を固定
    const paddedRankData = [minRank, ...rankData, maxRank];

    const chartData = {
      labels: ['', ...labels, ''],
      datasets: [
        {
          data: paddedRankData,
          color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={screenWidth - 104}
        height={200}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
          formatYLabel: (value) => {
            const numValue = parseFloat(value);
            // 整数のみ表示
            if (Number.isInteger(numValue) && numValue >= minRank && numValue <= maxRank) {
              return numValue.toString();
            }
            return '';
          },
        }}
        style={styles.chart}
        yAxisInterval={1}
        segments={maxRank - minRank}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
      />
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'rank-distribution':
        return renderRankDistributionChart();
      case 'trend':
        return renderTrendChart();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyChart: {
    width: screenWidth - 104,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
  },
});