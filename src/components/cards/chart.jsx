import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatBytes, shortTime } from '../../js/utils.js';
import Graph from './graph.jsx';
import { useTheme } from '@mui/material/styles';

const isByteUnit = (unit) => unit === 'B' || unit === 'B/s';

const Chart = (props) => {
  const theme = useTheme();
  const detail = props.detail;
  // only plotted series (they have a colour)
  const seriesKeys = Object.keys(detail).filter(key => detail[key].color);
  const yUnit = seriesKeys.length ? detail[seriesKeys[0]].unit : '';
  const compact = props.compact;

  const bytesFormatter = (value, name, item) => {
    const unit = item.unit;
    if (isByteUnit(unit)) return formatBytes(value) + unit;
    if (Array.isArray(value) || value === null || value === undefined || isNaN(value)) return;
    return Number(value).toFixed(1) + ' ' + (unit || '');
  };

  const tickFormatter = (value) => {
    if (!value) return '0';
    if (isByteUnit(yUnit)) {
      return formatBytes(value).replace('.00', '').replace(/(\.\d)\d/, '$1') + (yUnit === 'B/s' ? '/s' : 'B');
    }
    return `${Math.round(value)}${yUnit === '%' ? '%' : ''}`;
  };

  // panel data is newest first; charts read left (old) to right (new)
  const reversedData = [...props.data]
    .filter(d => seriesKeys.some(k => d[k] !== undefined && d[k] !== null))
    .reverse();

  let domain;
  if (props.min !== undefined && props.max !== undefined) {
    domain = [props.min, props.max];
  } else if (props.min !== undefined) {
    domain = [props.min, (dataMax) => (dataMax > 0 ? Math.ceil(dataMax * 1.15) : 1)];
  } else {
    domain = [(dataMin) => Math.floor(dataMin - 3), (dataMax) => Math.ceil(dataMax + 3)];
  }

  const axisColor = theme.palette.text.secondary;
  return <Graph>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={reversedData} margin={{ top: 14, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: '1vh',
            border: 0,
          }}
          labelFormatter={(label) => label}
          formatter={bytesFormatter}
        />
        <XAxis
          dataKey="timestamp"
          hide={compact}
          tickFormatter={(t) => shortTime(t.replace(' ', 'T'))}
          tick={{ fontSize: 10, fill: axisColor }}
          stroke={theme.palette.divider}
          minTickGap={40}
        />
        <YAxis
          domain={domain}
          hide={compact}
          allowDecimals={false}
          tickFormatter={tickFormatter}
          tick={{ fontSize: 10, fill: axisColor }}
          stroke={theme.palette.divider}
          width={isByteUnit(yUnit) ? 62 : 38}
          tickCount={4}
        />
        {seriesKeys.map((key, index) => (
          <Line
            type="monotone"
            dataKey={key}
            key={index}
            stroke={detail[key].color}
            name={detail[key].title}
            unit={detail[key].unit}
            strokeWidth={2}
            isAnimationActive={false}
            connectNulls={true}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </Graph>;
};

export default Chart;
