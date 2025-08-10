import * as vscode from 'vscode';
import { TileManager } from '../tiles/TileManager';
import { getWebviewContent } from './getWebviewContent';
import { TileResolver } from '../tiles/TileResolver';
import * as path from 'path';

// Refactored: now manages a WebviewPanel in the editor area instead of a sidebar webview view.
export class QuickAccessPanel {
  public static readonly viewType = 'quickAccessTiles.panel';
  private static current?: QuickAccessPanel;

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly tileManager: TileManager,
    private readonly resolver: TileResolver,
    panel: vscode.WebviewPanel
  ) {
    this.panel = panel;
    this.configure();
  }

  static createOrShow(context: vscode.ExtensionContext, manager: TileManager, resolver: TileResolver) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (QuickAccessPanel.current) {
      QuickAccessPanel.current.panel.reveal(column, true);
      QuickAccessPanel.current.render();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      QuickAccessPanel.viewType,
      'Quick Tiles',
      { viewColumn: column, preserveFocus: false },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri]
      }
    );

    QuickAccessPanel.current = new QuickAccessPanel(context, manager, resolver, panel);
  }

  private configure() {
    this.panel.iconPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'icon.svg');

    this.tileManager.onDidChange(() => this.render());

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === 'tileClick') {
        await this.handleTileClick(msg.tile);
      }
    }, null, this.disposables);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.render();
  }

  private render() {
    const config = this.resolver.getMergedConfig();
    this.panel.webview.html = getWebviewContent({
      webview: this.panel.webview,
      context: this.context,
      tiles: this.tileManager.getTiles(),
      config
    });
  }

  private async handleTileClick(tile: any) {
    const actions: Thenable<any>[] = [];
    if (tile.file) {
      try {
        const uri = this.resolveFile(tile.file);
        actions.push(vscode.window.showTextDocument(uri, { preview: false }));
      } catch (e) {
        vscode.window.showErrorMessage(`Cannot open file: ${tile.file}`);
      }
    }
    if (tile.url) {
      try { actions.push(vscode.env.openExternal(vscode.Uri.parse(tile.url))); } catch {}
    }
    if (tile.command) {
      actions.push(this.runCommand(tile));
    }
    await Promise.all(actions as Promise<any>[]);
  }

  private resolveFile(p: string): vscode.Uri {
    // Absolute path directly
    if (path.isAbsolute(p)) return vscode.Uri.file(p);

    // Resolve relative to first workspace folder root
    const folders = vscode.workspace.workspaceFolders;
    if (folders?.length) {
      return vscode.Uri.file(path.join(folders[0].uri.fsPath, p));
    }
    // Fallback just treat as file relative to cwd
    return vscode.Uri.file(path.resolve(p));
  }

  private async runCommand(tile: any) {
    const cwd = tile.commandCwd || this.getFirstWorkspaceFolderFsPath();
    if (tile.shouldOpenTerminal) {
      const term = vscode.window.createTerminal({ cwd });
      term.show(true);
      term.sendText(tile.command, true);
    } else {
      const cp = require('child_process');
      try {
        const proc = cp.exec(tile.command, { cwd });
        proc.on('error', (err: any) => vscode.window.showErrorMessage(`Command failed: ${err.message}`));
      } catch (e: any) {
        vscode.window.showErrorMessage(`Cannot run command: ${e.message}`);
      }
    }
  }

  private getFirstWorkspaceFolderFsPath(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  public dispose() {
    QuickAccessPanel.current = undefined;
    while (this.disposables.length) {
      const d = this.disposables.pop();
      try { d?.dispose(); } catch {}
    }
  }
}
