import * as path from "path";
import { v4 as uuid } from "uuid";
import * as vscode from "vscode";
import { ExtensionConfig, ResolvedTile, TileConfig, TileGroupConfig } from "../types";

export class TileResolver {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public getMergedConfig(): ExtensionConfig {
    const defaultTileOptions =
      vscode.workspace.getConfiguration("quickAccessTiles").get<any>("defaultTileOptions") || {};

    const tileGroups = this.mergeArraySetting<TileGroupConfig>("tileGroups");
    const customCssFiles = this.mergeArraySetting<string>("customCssFiles");
    const customJsFiles = this.mergeArraySetting<string>("customJsFiles");
    const dashboardDisplayName =
      vscode.workspace.getConfiguration("quickAccessTiles").get<string>("dashboardDisplayName") || "";
    const displayTheme =
      vscode.workspace.getConfiguration("quickAccessTiles").get<"default" | "cyberpunk">("displayTheme") || "default";

    return {
      tileGroups: tileGroups || [],
      customCssFiles: customCssFiles || [],
      customJsFiles: customJsFiles || [],
      defaultTileOptions,
      dashboardDisplayName,
      displayTheme,
    };
  }

  private mergeArraySetting<T = any>(key: string): T[] {
    // VS Code API does not directly expose all scopes; we approximate by using inspect
    const inspect = vscode.workspace.getConfiguration("quickAccessTiles").inspect<T[]>(key);
    if (!inspect) return [];
    const result: T[] = [];
    const add = (arr?: T[]) => {
      if (Array.isArray(arr)) arr.forEach((v) => result.push(v));
    };
    add(inspect.globalValue);
    add(inspect.workspaceValue);
    if (Array.isArray(inspect.workspaceFolderValue)) add(inspect.workspaceFolderValue as T[]);
    // newest (folder) should override earlier? For arrays we just concatenate; duplicates can be filtered optionally.
    return result;
  }

  public resolveTiles(): ResolvedTile[] {
    const config = this.getMergedConfig();
    const tiles: ResolvedTile[] = [];
    for (const group of config.tileGroups) {
      for (const t of group.tiles) {
        tiles.push(this.applyDefaults(group.groupName, t, config));
      }
    }
    return tiles;
  }

  private applyDefaults(group: string, tile: TileConfig, config: ExtensionConfig): ResolvedTile {
    const merged: TileConfig = { ...config.defaultTileOptions, ...tile };
    return { ...merged, id: uuid(), group } as ResolvedTile;
  }

  public resolveResourceFile(p: string | undefined): string | undefined {
    if (!p) return undefined;
    if (path.isAbsolute(p)) return p;
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length) {
      return path.join(folders[0].uri.fsPath, p);
    }
    return p;
  }
}
