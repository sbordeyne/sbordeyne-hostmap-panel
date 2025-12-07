import { Bounds, GroupCoord, GroupEntry, Layout, LayoutMode, LayoutProperties } from '../types';

export class WideLayout implements Layout {
  mode = LayoutMode.Wide;
  groupEntries: GroupEntry[];
  groupGap = { width: 20, height: 20 };
  radius = 20;
  hexSpacing = 4;
  hostsPerRow: number;

  public constructor(props: LayoutProperties) {
    this.groupEntries = props.groupEntries;
    this.groupGap = props.groupGap;
    this.radius = props.radius;
    this.hexSpacing = props.hexSpacing;
    this.hostsPerRow = props.hostsPerRow;
  }

  public getGroupCoordinates(): GroupCoord[] {
    const totalWidth = this.groupEntries.reduce((sum, g) => sum + g.boxWidth, 0) + this.groupGap.width * (this.groupEntries.length - 1);

    const maxHeight = this.groupEntries.reduce((max, g) => Math.max(max, g.boxHeight), 0);

    // Analytical placement: compute prefix sums of widths so each group's X is
    // the left edge: centerOffset + sum(widths of previous groups) + gap*index
    const widths = this.groupEntries.map((g) => g.boxWidth);
    const prefixWidths: number[] = new Array(widths.length).fill(0);
    for (let i = 1; i < widths.length; i++) {
      prefixWidths[i] = prefixWidths[i - 1] + widths[i - 1];
    }

    const pad = this.radius + this.hexSpacing;

    return this.groupEntries.map((entry, index) => {
      // rectLeft / rectTop are the visual rect's top-left coordinates.
      const rectLeft = -totalWidth / 2 + prefixWidths[index] + this.groupGap.width * index;
      const rectTop = -maxHeight / 2;

      // HostGroup expects the origin (used by getRectBbox) not the rect's top-left.
      // getRectBbox computes rect.x = originX - pad, so to get rect.x === rectLeft
      // we must pass originX = rectLeft + pad. Same for originY.
      // Determine whether this group layout produces any "long rows" (rows with N+1 items).
      // Mirror `getRectBbox` logic exactly so origin computation matches the bbox math.
      const N = this.hostsPerRow;
      const H = entry.frames.length;

      const evenLen = N;
      const oddLen = N + 1;
      const pairLen = evenLen + oddLen; // 2N+1

      const fullPairs = Math.floor(H / pairLen);
      const remaining = H - fullPairs * pairLen;

      // replicate getRectBbox rows/hasLongRow computation
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

      // dx as used by getRectBbox
      const dxBase = Math.sqrt(3) * this.radius;
      const dx = dxBase + this.hexSpacing;

      // If there is a long row, minCx == originX and rect.x == originX - pad, so originX = rectLeft + pad.
      // If only short rows exist, minCx == originX + 0.5*dx and rect.x == originX + 0.5*dx - pad,
      // so originX = rectLeft - 0.5*dx + pad.
      const originX = hasLongRow ? rectLeft + pad : rectLeft - 0.5 * dx + pad;
      const originY = rectTop + pad;

      return {
        ...entry,
        origin: { x: originX, y: originY },
      }
    });
  }

  public getBounds(): Bounds {
    const groupCoords = this.getGroupCoordinates();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    groupCoords.forEach(({ boxWidth, boxHeight, origin }) => {
      const rectX = origin.x - (this.radius + this.hexSpacing);
      const rectY = origin.y - (this.radius + this.hexSpacing);
      const rectWidth = boxWidth;
      const rectHeight = boxHeight;

      minX = Math.min(minX, rectX);
      minY = Math.min(minY, rectY);
      maxX = Math.max(maxX, rectX + rectWidth);
      maxY = Math.max(maxY, rectY + rectHeight);
    });

    const bounds = {
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    };
    return bounds;
  }
}
