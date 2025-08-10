import * as vscode from "vscode";
import { ResolvedTile } from "../types";
import { TileResolver } from "./TileResolver";

export class TileManager {
  private tiles: ResolvedTile[] = [];
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private readonly resolver: TileResolver) {}

  public refresh() {
    this.tiles = this.resolver.resolveTiles();
    this._onDidChange.fire();
  }

  public getTiles() {
    return this.tiles;
  }
}
