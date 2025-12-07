import React, { useCallback, useState } from 'react';

import { PanelProps } from '@grafana/data';
import { Bounds, GroupEntry, HostDetails, Layout, PanelOptions, ZoomMode } from 'types';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { getRectBbox, groupBy } from '../utils';
import { usePanning } from 'usePanning';
import { useZoom } from 'useZoom';
import { HostTooltip } from './HostTooltip';
import { WideLayout } from 'layout/wide';
import { HostGroup } from './HostGroup';

interface Props extends PanelProps<PanelOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
      position: relative;
    `,
    controls: css`
      position: absolute;
      right: 8px;
      top: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 10;
    `,
    controlButton: css`
      width: 32px;
      height: 32px;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      padding: 0;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
    indicator: css`
      display: inline-block;
      padding: 6px 8px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1;
    `,
  };
};

function usePanAndZoom(bounds: Bounds, focus?: { x: number; y: number }, zoomMode?: ZoomMode) {
  const { scale, onStepDown, onStepUp, ref: zoomRef, isMax, isMin, setScale } = useZoom({ zoomMode });
  const { state: panningState, ref: panRef } = usePanning<SVGSVGElement>({
    scale,
    bounds,
    focus,
  });
  const { position, isPanning } = panningState;
  return {
    zoomRef,
    panRef,
    position,
    isPanning,
    scale,
    onStepDown,
    onStepUp,
    isMaxZoom: isMax,
    isMinZoom: isMin,
    setScale,
  };
}

function useHover() {
  const [nodeHover, setNodeHover] = useState<string | undefined>(undefined);
  const clearNodeHover = useCallback(() => setNodeHover(undefined), [setNodeHover]);

  return { nodeHover, setNodeHover, clearNodeHover };
}

export const HostmapPanel: React.FC<Props> = ({ options, data, fieldConfig, id, width, height }) => {
  const styles = useStyles2(getStyles);
  const hostsPerRow = options.hostsPerRow || 5;
  const groupByLabel = options.groupByLabel || '';
  const nodeIdLabel = options.nodeIdLabel || '';
  const radius = 50;
  const layoutMode = options.layoutMode ?? 'wide'; // default if you like
  const hexSpacing = options.hexSpacing ?? 10;
  const groupGapX = hexSpacing * 2;
  const groupGapY = hexSpacing * 2;

  const { nodeHover, setNodeHover, clearNodeHover } = useHover();
  const [selectedHost, setSelectedHost] = useState<HostDetails | undefined>(undefined);
  const [focus, setFocus] = useState<{ x: number; y: number } | undefined>(undefined);

  if (data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField />;
  }

  const groups = groupBy(data, groupByLabel, nodeIdLabel);
  const groupEntries: GroupEntry[] = Object.entries(groups).map(([groupName, nodes]) => {
    const totalNodeCount = Object.keys(nodes).length;
    const baseBox = getRectBbox(totalNodeCount, hostsPerRow, radius, hexSpacing, 0, 0);
    return {
      name: groupName,
      nodes,
      boxWidth: baseBox.width,
      boxHeight: baseBox.height,
    };
  });
  const onFitToScreen = () => {
    // Compute aggregate content bbox (simple horizontal layout approximation)
    const padding = 40; // px
    const totalWidth =
      groupEntries.reduce((s, g) => s + g.boxWidth, 0) + Math.max(0, groupEntries.length - 1) * (hexSpacing * 2);
    const totalHeight = Math.max(...groupEntries.map((g) => g.boxHeight), 0);

    const targetScale = Math.min(width / (totalWidth + padding), height / (totalHeight + padding));

    // Center the view on origin
    setFocus({ x: 0, y: 0 });
    // Apply the computed scale (clamped by useZoom)
    setScale(targetScale);
  };
  let layout: Layout;

  const handleSetSelectedHost = (s: HostDetails | undefined) => {
    if (!s) {
      setSelectedHost(undefined);
      return;
    }
    setSelectedHost((prev) => (prev && prev.id === s.id ? undefined : s));
  };

  switch (layoutMode) {
    case 'wide':
      layout = new WideLayout({
        groupEntries,
        groupGap: { width: groupGapX, height: groupGapY },
        radius,
        hexSpacing,
        hostsPerRow,
      });
      break;
    default:
      throw new Error(`Unknown layout mode: ${layoutMode}`);
  }

  const hostGroups = layout.getGroupCoordinates().map(({ name, origin, nodes }) => {
    return (
      <HostGroup
        key={name}
        hostsPerRow={hostsPerRow}
        nodes={nodes}
        x={origin.x}
        y={origin.y}
        radius={radius}
        name={name}
        hexSpacing={hexSpacing}
        hoveredId={nodeHover}
        onHostHover={setNodeHover}
        onHostHoverEnd={clearNodeHover}
        selectedHost={selectedHost}
        onHostClick={handleSetSelectedHost}
      />
    );
  })

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { panRef, position, scale, zoomRef, onStepUp, onStepDown, isMaxZoom, isMinZoom, setScale } = usePanAndZoom(
    layout.getBounds(),
    focus,
    options.zoomMode
  );

  // This cannot be inline func, or it will create infinite render cycle.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const topLevelRef = useCallback(
    (r: HTMLDivElement) => {
      zoomRef.current = r;
    },
    [zoomRef]
  );

  return (
    <div ref={topLevelRef} className={styles.wrapper}>
      <div className={styles.controls}>
        <button className={styles.controlButton} onClick={onStepUp} aria-label="zoom in" disabled={isMaxZoom}>
          +
        </button>
        <button className={styles.controlButton} onClick={onStepDown} aria-label="zoom out" disabled={isMinZoom}>
          -
        </button>
        <button className={styles.controlButton} onClick={onFitToScreen} aria-label="fit to screen">
          ⤢
        </button>
        <div className={styles.indicator}>{Math.round(scale * 100)}%</div>
      </div>
      <svg
        ref={panRef}
        className={styles.svg}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`-${width / 2} -${height / 2} ${width} ${height}`}
        onClick={() => {
          // clicking empty SVG area should close any open tooltip
          setSelectedHost(undefined);
        }}
      >
        <g
          transform={`translate(${position.x}, ${position.y}) scale(${scale})`}
          onClick={() => {
            // clicking the void clears selection
            setSelectedHost(undefined);
          }}
        >
          {hostGroups}
          {selectedHost && (
            <HostTooltip
              x={selectedHost.x}
              y={selectedHost.y}
              frames={selectedHost.frames}
              onClose={() => setSelectedHost(undefined)}
            />
          )}
        </g>
      </svg>
    </div>
  );
};
