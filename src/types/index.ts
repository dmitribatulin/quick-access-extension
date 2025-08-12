export interface TileConfig {
  name: string;
  description?: string;
  icon?: string;
  backgroundColor?: string;
  borderColor?: string;
  hoverOverlayColor?: string;
  textColor?: string;
  file?: string;
  url?: string;
  command?: string;
  shouldOpenTerminal?: boolean;
  commandCwd?: string;
  iconSize?: number;
  displaySquare?: boolean;
}

export interface TileGroupConfig {
  groupName: string;
  tiles: TileConfig[];
}

export interface ResolvedTile extends TileConfig {
  id: string;
  group: string;
}

export interface ExtensionConfig {
  tileGroups: TileGroupConfig[];
  customCssFiles: string[];
  customJsFiles: string[];
  defaultTileOptions: Partial<Omit<TileConfig, "name">>;
  dashboardDisplayName?: string;
  displayTheme?: "default" | "cyberpunk";
}
