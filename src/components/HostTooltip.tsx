import React from 'react';
import { useTheme2 } from '@grafana/ui';
import { DataFrame, getValueFormat, formattedValueToString } from '@grafana/data';

interface Props {
  x: number;
  y: number;
  frames: DataFrame[];
  onClose?: () => void;
}

export const HostTooltip: React.FC<Props> = ({ x, y, frames, onClose }) => {
  const theme = useTheme2();
  const PADDING = 6;
  const LINE_HEIGHT = 14;
  const CHARACTER_WIDTH = 7;
  const title = 'Host Details';
  const allLabels = frames.map(
    (frame) => frame.fields.map(
      (field) => (field.labels ?? {})
    ).reduce((acc, val) => ({ ...acc, ...val }), {})
  ).reduce((acc, val) => ({ ...acc, ...val }), {});
  const allValues = frames.map(
    (frame) => frame.fields.filter((field) => field.name !== 'Time').map(
      (field) => {
        const fieldName = field.config.displayName || frame.refId || 'Unknown';
        const fieldValue = formattedValueToString(
          getValueFormat(field.config.unit)(field.values[field.values.length - 1], field.config.decimals)
        );
        return { name: fieldName, value: fieldValue };
      }
    )
  ).reduce((acc, val) => acc.concat(val), []);
  const lines: string[] = [
    ...allValues.map(v => `${v.name}: ${v.value}`),
    ...Object.entries(allLabels).map(([key, value]) => `${key}: ${value}`),
  ]
  const titleHeight = title ? LINE_HEIGHT : 0;
  const width = Math.max(...lines.map((l) => l.length * CHARACTER_WIDTH));
  const height = titleHeight + lines.length * LINE_HEIGHT + PADDING * 2;

  // Position the tooltip to the right and slightly above the host center
  const tx = x + 12;
  const ty = y - height - 12;

  return (
    <g onClick={(e) => e.stopPropagation()}>
      <rect
        x={tx}
        y={ty}
        width={width}
        height={height}
        rx={6}
        ry={6}
        fill={theme.colors.background.secondary}
        stroke={theme.colors.border.medium}
      />
      {/* close button */}
      <g
        transform={`translate(${tx + width - 18}, ${ty + 6})`}
        onClick={(e) => {
          e.stopPropagation();
          onClose && onClose();
        }}
        style={{ cursor: 'pointer' }}
      >
        <rect x={0} y={0} width={12} height={12} rx={2} ry={2} fill={theme.colors.background.primary} stroke={theme.colors.border.medium} />
        <text x={6} y={9} textAnchor="middle" fill={theme.colors.text.primary} fontSize={10} fontWeight={700} dominantBaseline="middle">
          x
        </text>
      </g>
      <text
        x={tx + PADDING}
        y={ty + PADDING + LINE_HEIGHT / 2}
        fill={theme.colors.text.primary}
        fontSize={12}
        fontFamily={theme.typography.fontFamily}
        fontWeight={600}
      >
        {title}
      </text>
      {lines.map((l, i) => (
        <text
          key={i}
          x={tx + PADDING}
          y={ty + 2*PADDING + titleHeight + LINE_HEIGHT / 2 + i * LINE_HEIGHT}
          fill={theme.colors.text.secondary}
          fontSize={12}
          fontFamily={theme.typography.fontFamily}
        >
          {l}
        </text>
      ))}
    </g>
  );
};
