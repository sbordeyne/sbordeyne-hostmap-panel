import { DataFrame } from "@grafana/data";

export interface PanelOptions {
  hostsPerRow: number;
  groupByLabel: string;
  nodeIdLabel: string;
  hexSpacing: number;
  zoomMode: ZoomMode;
  layoutMode: LayoutMode;
  thresholds: Array<{
    value: number;
    color: string;
  }>;
}

export enum LayoutMode {
  Wide = 'wide',
  // Compact = 'compact',
  // High = 'high',
}

export enum ZoomMode {
  Cooperative = 'cooperative',
  Greedy = 'greedy',
}

export interface Bounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
  center: Point;
}

export type GroupEntry = {
  name: string;
  nodes: NodeInfos;
  boxWidth: number;
  boxHeight: number;
};


export type Rect = Point & Size;


export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Layout extends LayoutProperties {
  mode: LayoutMode;
  getGroupCoordinates(): GroupCoord[];
  getBounds(): Bounds;
}

export interface LayoutProperties {
  groupEntries: GroupEntry[];
  groupGap: Size;
  radius: number;
  hexSpacing: number;
  hostsPerRow: number;
}

export interface GroupCoord extends GroupEntry {
  origin: Point;
}

export interface HostDetails extends Point {
  id: string;
  frames: DataFrame[];
}

export type NodeGroups = Record<string, NodeInfos>;
export type NodeInfos = Record<string, DataFrame[]>;
