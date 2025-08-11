import React from 'react';
import { BarChart } from 'react-native-gifted-charts';
import { View } from 'react-native';
import { palette } from '../../constants/Design';

export type BarDatum = { label: string; value: number };

export default function GiftedBarChart({ data, color = palette.primary }: { data: BarDatum[]; color?: string }) {
  const bars = data.map(d => ({ value: d.value, label: d.label }));
  return (
    <View style={{ paddingVertical: 8 }}>
      <BarChart
        data={bars}
        frontColor={color}
        barWidth={22}
        spacing={18}
        yAxisThickness={0}
        xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 10 }}
  xAxisTextNumberOfLines={2}
        noOfSections={3}
        isAnimated
        animationDuration={600}
        hideRules
        initialSpacing={10}
        renderTooltip={(item: any) => (
          <View style={{ backgroundColor: '#111827', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
            <View style={{ height: 2 }} />
          </View>
        )}
      />
    </View>
  );
}
