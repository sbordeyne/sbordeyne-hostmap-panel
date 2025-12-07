import { PanelData } from "@grafana/data";
import { NodeGroups, Rect } from "types";

/**
 * Compute the bounding box of a hex group laid out with alternating row lengths:
 *   even rows: hostsPerRow (short, shifted by +0.5)
 *   odd  rows: hostsPerRow+1 (long)
 *
 * Centers:
 *   cx = originX + dx*(columnIndex + 0.5*((rowIndex+1)%2))
 *   cy = originY + dy*rowIndex
 *
 * Returned bbox includes hex radius and hexSpacing on all sides.
 */
export function getRectBbox(
  totalHostCount: number,
  hostsPerRow: number,
  radius: number,
  hexSpacing: number,
  originX: number,
  originY: number
): Rect {
  const N = hostsPerRow;
  const H = totalHostCount;

  if (H <= 0 || N <= 0) {
    return { x: originX, y: originY, width: 0, height: 0 };
  }

  const evenLen = N;
  const oddLen = N + 1;
  const pairLen = evenLen + oddLen; // 2N+1

  const dxBase = Math.sqrt(3) * radius;
  const dyBase = 1.5 * radius;

  const dx = dxBase + hexSpacing;
  const dy = dyBase + hexSpacing;

  // ---- Row count + presence of long rows ----
  const fullPairs = Math.floor(H / pairLen);
  const remaining = H - fullPairs * pairLen;

  let rows = 2 * fullPairs;
  let hasLongRow = fullPairs > 0;

  if (remaining > 0) {
    if (remaining <= evenLen) {
      rows += 1;
    } else {
      rows += 2;
      hasLongRow = true;
    }
  }

  // Vertical bounds (row 0 .. row rows-1)
  const minCy = originY;
  const maxCy = originY + dy * (rows - 1);

  // ---- Horizontal bounds ----
  let minCx: number;
  let maxCx: number;

  if (hasLongRow) {
    // long rows exist: [x .. x + dx*N]
    minCx = originX;
    maxCx = originX + dx * N;
  } else {
    // only short rows exist (remaining hosts all in row 0)
    const L = remaining; // 1..N
    // cx ranges from x + 0.5dx .. x + dx*(L - 0.5)
    minCx = originX + 0.5 * dx;
    maxCx = originX + dx * (L - 0.5);
  }

  // Inflate by hex radius + spacing
  const pad = radius + hexSpacing;

  const x = minCx - pad;
  const y = minCy - pad;
  const width = maxCx - minCx + 2 * pad;
  const height = maxCy - minCy + 2 * pad;

  return { x, y, width, height };
}

export function indexToRowCol(index: number, baseCols: number): { rowIndex: number; columnIndex: number } {
  const evenRowLen = baseCols; // N
  const oddRowLen = baseCols + 1; // N + 1
  const pairLen = evenRowLen + oddRowLen; // 2N + 1

  // How many complete (N, N+1) row pairs before this index?
  const pairIndex = Math.floor(index / pairLen); // 0,1,2,...

  // Position inside the current pair
  const indexInPair = index % pairLen;

  if (indexInPair < evenRowLen) {
    // We are in the even row of this pair
    const rowIndex = pairIndex * 2; // 0,2,4,...
    const columnIndex = indexInPair; // 0..N-1
    return { rowIndex, columnIndex };
  } else {
    // We are in the odd row of this pair
    const rowIndex = pairIndex * 2 + 1; // 1,3,5,...
    const columnIndex = indexInPair - evenRowLen; // 0..N
    return { rowIndex, columnIndex };
  }
}

export function getKeyForLabels(labels: Record<string, string>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}=${value}`)
    .reduce((prev, curr) => `${prev};${curr}`, '');
}

export function groupBy(data: PanelData, groupLabel: string, nodeIdLabel: string): NodeGroups {
  const groups: NodeGroups = {};
  data.series.forEach((frame) => {
    const field = frame.fields.find((f) => f.name === 'Value');
    if (!field) {
      return;
    }
    const groupLabelValue = (field.labels ?? {})[groupLabel] || 'all';
    let nodeIdLabelValue: string;
    if (nodeIdLabel === '') {
      nodeIdLabelValue = getKeyForLabels(field.labels ?? {});
    } else {
      nodeIdLabelValue = (field.labels ?? {})[nodeIdLabel];
    }
    if (Object.keys(groups).includes(groupLabelValue)) {
      if (Object.keys(groups[groupLabelValue]).includes(nodeIdLabelValue)) {
        groups[groupLabelValue][nodeIdLabelValue].push(frame);
      }
      else {
        groups[groupLabelValue][nodeIdLabelValue] = [frame];
      }
    } else {
      groups[groupLabelValue] = {
        [nodeIdLabelValue]: [frame],
      };
    }
  });
  return groups;
}
