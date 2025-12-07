// import React from 'react';
// import { LayoutProps } from 'types';
// import { HostGroup } from './HostGroup';

// export const HostmapCompactLayout: React.FC<LayoutProps> = (props: LayoutProps) => {
//   const { groupEntries, groupGap, hostsPerRow, radius, hexSpacing, nodeHover, setNodeHover, clearNodeHover } =
//     props;
//   const count = groupEntries.length;
//   const cols = Math.ceil(Math.sqrt(count));
//   const rows = Math.ceil(count / cols);

//   const colWidths = new Array(cols).fill(0);
//   const rowHeights = new Array(rows).fill(0);

//   // Row-major assignment: index -> (row, col)
//   groupEntries.forEach((g, index) => {
//     const row = Math.floor(index / cols);
//     const col = index % cols;
//     colWidths[col] = Math.max(colWidths[col], g.boxWidth);
//     rowHeights[row] = Math.max(rowHeights[row], g.boxHeight);
//   });

//   const totalWidth = colWidths.reduce((s, w) => s + w, 0) + groupGap.x * (cols - 1);
//   const totalHeight = rowHeights.reduce((s, h) => s + h, 0) + groupGap.y * (rows - 1);

//   const offsetX = 0;
//   const offsetY = 0;

//   const startX = -totalWidth / 2 + offsetX;
//   const startY = -totalHeight / 2 + offsetY;

//   const colOffsets = new Array(cols);
//   const rowOffsets = new Array(rows);

//   let xAcc = startX;
//   for (let c = 0; c < cols; c++) {
//     colOffsets[c] = xAcc;
//     xAcc += colWidths[c] + groupGap.x;
//   }

//   let yAcc = startY;
//   for (let r = 0; r < rows; r++) {
//     rowOffsets[r] = yAcc;
//     yAcc += rowHeights[r] + groupGap.y;
//   }

//   const hostGroups = groupEntries.map(({ name, frames }, index) => {
//     const row = Math.floor(index / cols);
//     const col = index % cols;
//     const rectX = colOffsets[col];
//     const rectY = rowOffsets[row];

//     return (
//       <HostGroup
//         key={name}
//         hostsPerRow={hostsPerRow}
//         group={frames}
//         x={rectX}
//         y={rectY}
//         radius={radius}
//         name={name}
//         hexSpacing={hexSpacing}
//         hoveredId={nodeHover}
//         onHostHover={setNodeHover}
//         onHostHoverEnd={clearNodeHover}
//         fieldConfig={props.fieldConfig}
//         selectedHost={props.selectedHost}
//         onHostClick={props.setSelectedHost}
//       />
//     );
//   });

//   return <g>{hostGroups}</g>;
// };
