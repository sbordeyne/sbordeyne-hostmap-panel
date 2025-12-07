import { getActiveThreshold } from '@grafana/data';
import React from 'react';
import { HostDisplay } from './HostDisplay';
import { useTheme2 } from '@grafana/ui';
import { getRectBbox, indexToRowCol } from 'utils';
import { HostDetails, NodeInfos } from 'types';

interface Props extends React.SVGAttributes<SVGGElement> {
  hostsPerRow: number;
  nodes: NodeInfos;
  x: number;
  y: number;
  radius: number;
  name: string;
  hexSpacing: number;
  hoveredId?: string;
  onHostHover: (id: string | undefined) => void;
  onHostHoverEnd: () => void;
  selectedHost?: HostDetails;
  onHostClick?: (s: HostDetails | undefined) => void;
}

export const HostGroup: React.FC<Props> = (props: Props) => {
  const { hostsPerRow, nodes, radius, x, y, hexSpacing, name, hoveredId, onHostHover, onHostHoverEnd } = props;
  const theme = useTheme2();
  const hostDisplays: React.ReactNode[] = [];
  const totalNodeCount = Object.keys(nodes).length;

  Object.entries(nodes).forEach(([key, frames], frameIndex) => {
    const field = frames[0]?.fields.find((f) => f.name === 'Value');
    if (!field) {
      return;
    }

    const { rowIndex, columnIndex } = indexToRowCol(frameIndex, hostsPerRow);
    const dx = Math.sqrt(3) * radius + hexSpacing;
    const dy = 1.5 * radius + hexSpacing;

    const cx = x + dx * (columnIndex + 0.5 * ((rowIndex + 1) % 2));
    const cy = y + dy * rowIndex;
    const isHovered = hoveredId === key;

    const threshold = getActiveThreshold(field.values[field.values.length - 1], field.config.thresholds?.steps);

    const handleClick = () =>
      props.onHostClick &&
      props.onHostClick({
        id: key,
        x: cx,
        y: cy,
        frames,
      });

    hostDisplays.push(
      <HostDisplay
        key={key}
        cx={cx}
        cy={cy}
        radius={radius}
        style={{ fill: threshold.color, border: theme.colors.primary.border }}
        isHovered={isHovered}
        onMouseEnter={() => onHostHover(key)}
        onMouseLeave={onHostHoverEnd}
        onClick={handleClick}
      />
    );
  });
  const rectBbox = getRectBbox(totalNodeCount, hostsPerRow, radius, hexSpacing, x, y);

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
