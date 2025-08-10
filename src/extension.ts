import * as vscode from 'vscode';
import { QuickAccessPanel } from './panel/QuickAccessPanel';
import { TileResolver } from './tiles/TileResolver';
import { TileManager } from './tiles/TileManager';

export function activate(context: vscode.ExtensionContext) {
  const resolver = new TileResolver(context);
  const manager = new TileManager(resolver);
  manager.refresh();

  context.subscriptions.push(
    vscode.commands.registerCommand('quickAccessTiles.openPanel', () => {
      QuickAccessPanel.createOrShow(context, manager, resolver);
    }),
    vscode.commands.registerCommand('quickAccessTiles.refresh', () => manager.refresh())
  );

  // Status bar button per setting
  let statusItem: vscode.StatusBarItem | undefined;
  const syncStatusBar = () => {
    const cfg = vscode.workspace.getConfiguration('quickAccessTiles');
    const show = cfg.get<boolean>('ui.showStatusBarButton', false);
    if (show && !statusItem) {
      statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
      statusItem.text = '$(layout-grid) Tiles';
      statusItem.tooltip = 'Open Quick Access Tiles';
      statusItem.command = 'quickAccessTiles.openPanel';
      statusItem.show();
      context.subscriptions.push(statusItem);
    } else if (!show && statusItem) {
      statusItem.dispose();
      statusItem = undefined;
    }
  };
  syncStatusBar();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('quickAccessTiles.ui.showStatusBarButton')) {
        syncStatusBar();
      }
      if (e.affectsConfiguration('quickAccessTiles')) {
        manager.refresh();
      }
    })
  );

  // Optionally open automatically on activation
  QuickAccessPanel.createOrShow(context, manager, resolver);
}

export function deactivate() {}
