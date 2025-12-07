import { DataFrame, FieldConfigSource, getActiveThreshold } from '@grafana/data';
import React from 'react';
import { HostDisplay } from './HostDisplay';
import { useTheme2 } from '@grafana/ui';
import { getKeyForLabels, getRectBbox, indexToRowCol } from 'utils';

interface Props extends React.SVGAttributes<SVGGElement> {
  hostsPerRow: number;
  group: DataFrame[];
  x: number;
  y: number;
  radius: number;
  name: string;
  hexSpacing: number;
  hoveredId?: string;
  onHostHover: (id: string | undefined) => void;
  onHostHoverEnd: () => void;
  fieldConfig: FieldConfigSource;
  selectedHost?: { id: string; x: number; y: number; title?: string; lines?: string[] };
  onHostClick?: (s: { id: string; x: number; y: number; title?: string; lines?: string[] } | undefined) => void;
}

export const HostGroup: React.FC<Props> = (props: Props) => {
  const { hostsPerRow, group, radius, x, y, hexSpacing, name, hoveredId, onHostHover, onHostHoverEnd } = props;
  const theme = useTheme2();
  const hostDisplays: React.ReactNode[] = [];

  group.forEach((frame, frameIndex) => {
    const field = frame?.fields.find((f) => f.name === 'Value');
    if (!field) {
      return;
    }

    const key = `${frame.refId}-${frameIndex}-${getKeyForLabels(field.labels ?? {})}`;
    const { rowIndex, columnIndex } = indexToRowCol(frameIndex, hostsPerRow);
    const dx = Math.sqrt(3) * radius + hexSpacing;
    const dy = 1.5 * radius + hexSpacing;

    const cx = x + dx * (columnIndex + 0.5 * ((rowIndex + 1) % 2));
    const cy = y + dy * rowIndex;
    const isHovered = hoveredId === key;

    const thresholdsConfig = props.fieldConfig.defaults.thresholds;
    const threshold = getActiveThreshold(field.values[field.values.length - 1], thresholdsConfig?.steps);

    const handleClick = () =>
      props.onHostClick &&
      props.onHostClick({
        id: key,
        x: cx,
        y: cy,
        title: frame.refId,
        lines: [String(field.values[field.values.length - 1])].concat(
          Object.entries(field.labels ?? {}).map(([k, v]) => `${k}: ${v}`)
        ),
      });

    hostDisplays.push(
      <HostDisplay
        key={key}
        cx={cx}
        cy={cy}
        radius={radius}
        style={{ fill: threshold.color, border: theme.colors.primary.border }}
        frame={frame}
        isHovered={isHovered}
        onMouseEnter={() => onHostHover(key)}
        onMouseLeave={onHostHoverEnd}
        onClick={handleClick}
      />
    );
  });
  const rectBbox = getRectBbox(group.length, hostsPerRow, radius, hexSpacing, x, y);

  // Header rules
  const showHeader = name !== 'all';
  const HEADER_PADDING = 6;

  const headerHeight = showHeader ? theme.typography.fontSize + HEADER_PADDING * 2 : 0;

  // The rect is shifted down to make room for the header *inside* it
  const rectX = rectBbox.x;
  const rectY = rectBbox.y - headerHeight;
  const rectWidth = rectBbox.width;
  const rectHeight = rectBbox.height + headerHeight;

  // If showing header, place it at the top of the rect, padded
  const headerX = rectX + rectWidth / 2;
  const headerY = rectBbox.y - HEADER_PADDING / 2;

  return (
    <g {...props}>
      <rect
        x={rectX}
        y={rectY}
        width={rectWidth}
        height={rectHeight}
        fill={theme.colors.background.secondary}
        stroke={theme.colors.border.medium}
        rx={8}
        ry={8}
      />
      {showHeader && (
        <text
          x={headerX}
          y={headerY}
          textAnchor="middle"
          dominantBaseline="central"
          fill={theme.colors.text.primary}
          fontFamily={theme.typography.fontFamily}
          fontSize={theme.typography.fontSize}
          fontWeight={theme.typography.fontWeightBold}
        >
          {name}
        </text>
      )}
      {hostDisplays}
    </g>
  );
};
