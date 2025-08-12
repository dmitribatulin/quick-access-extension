import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { ExtensionConfig, ResolvedTile } from "../types";

export function getWebviewContent(opts: {
  webview: vscode.Webview;
  context: vscode.ExtensionContext;
  tiles: ResolvedTile[];
  config: ExtensionConfig;
}): string {
  const { webview, context, tiles, config } = opts;

  const mediaUri = (file: string) => webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "media", file));
  const cssUri = mediaUri("panel.css");
  const jsUri = mediaUri("panel.js");

  const grouped: Record<string, ResolvedTile[]> = {};
  for (const t of tiles) {
    grouped[t.group] = grouped[t.group] || [];
    grouped[t.group].push(t);
  }

  const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));

  const tileHtml = Object.entries(grouped)
    .map(([group, list]) => {
      const tilesHtml = list
        .map((tile) => {
          const { icon, ...dataForAttr } = tile as any;
          const iconRendered = renderIcon(tile);
          const iconBg = tile.backgroundColor || config.defaultTileOptions.backgroundColor || "#2d2d2d";
          const baseBorder = tile.borderColor || config.defaultTileOptions.borderColor || "transparent";
          const textColor = tile.textColor ? `color:${tile.textColor}` : "";
          const tileName = escapeHtml(tile.name || "Untitled");
          const tileDescription = tile.description
            ? `<p class="tile-desc" style="${textColor}">${escapeHtml(tile.description)}</p>`
            : "";
          const tileTypeBadge = ["file", "url", "command"]
            .filter((k) => (tile as any)[k])
            .map((k) => `<span>${k}</span>`)
            .join("");
          
          // Square mode: only icon with tooltip
          if (tile.displaySquare) {
            const tooltipText = tile.description ? `${tile.name} - ${tile.description}` : tile.name;
            return `
            <div class="tile square"
              tabindex="0"
              data-tile='${JSON.stringify(dataForAttr)}'
              style="--tile-icon-bg:${iconBg};--tile-base-border:${baseBorder};"
              title="${escapeHtml(tooltipText)}"
              >
                <div class="icon-box">${iconRendered}</div>
            </div>`;
          }
          
          // Regular mode: icon + text + badges
          return `
          <div class="tile"
            tabindex="0"
            data-tile='${JSON.stringify(dataForAttr)}'
            style="--tile-icon-bg:${iconBg};--tile-base-border:${baseBorder};"
            >
              <div class="icon-box">${iconRendered}</div>
              <div class="tile-content">
                <h3 class="tile-title" style="${textColor}">${tileName}</h3>
                  ${tileDescription}
                <div class="badge-actions">${tileTypeBadge} </div>
              </div>
          </div>`;
        })
        .join("\n");
      return `<section class="tile-group"><h2 class="tile-group-title">${escapeHtml(
        group
      )}</h2><div class="tile-grid">${tilesHtml}</div></section>`;
    })
    .join("\n");

  const customCssLinks = config.customCssFiles.map((f) => inlineFileTag(f, "css", webview)).join("\n");
  const customJsScripts = config.customJsFiles.map((f) => inlineFileTag(f, "js", webview)).join("\n");

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${
        webview.cspSource
      } file: data: https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; font-src ${
    webview.cspSource
  } data:;" />
      <meta name="viewport" content="width=device-width,initial-scale=1.0" />
      <link rel="stylesheet" href="${cssUri}" />
      ${customCssLinks}
      <title>Quick Access Tiles</title>
    </head>
    <body>
      <div class="page-wrapper">
        ${tiles.length ? tileHtml : getNoTilesMessage()}
      </div>
      ${
        config.dashboardDisplayName
          ? `<div class="dashboard-watermark">${escapeHtml(config.dashboardDisplayName)}</div>`
          : ""
      }
      <div class="custom-js-note">Custom JS injected via settings</div>
      <script src="${jsUri}"></script>
      ${customJsScripts}
    </body>
  </html>`;

  function getNoTilesMessage() {
    return `
      <div class="empty-wrapper">
        <div class="empty-message">
          No tiles configured.<br/>
          Add tileGroups in settings: <a href="command:workbench.action.openSettings?%22quickAccessTiles.tileGroups%22">Open Settings</a>
        </div>
      </div>`;
  }

  function renderIcon(tile: ResolvedTile): string {
    const resolved = resolveIcon(tile.icon);
    if (resolved) {
      if (resolved.inlineSvg) {
        return `<span class="qtiles-default-icon" aria-hidden="true">${resolved.inlineSvg}</span>`;
      }
      return `<img class="tile-icon tile-img-icon" src="${resolved.src}" alt="" />`;
    }
    // If icon specified but not resolved as path/url, treat as glyph literal
    if (tile.icon) {
      const trimmed = tile.icon.trim();
      if (trimmed.length === 1) {
        return `<span class="icon-glyph" aria-hidden="true">${escapeHtml(trimmed)}</span>`;
      }
      return `<span class="icon-glyph" aria-hidden="true" title="${escapeHtml(trimmed)}">${escapeHtml(trimmed)}</span>`;
    }
    // default: first letter of tile name
    const first = tile.name?.trim().charAt(0) || "?";
    return `<span class="icon-glyph" aria-hidden="true">${escapeHtml(first)}</span>`;
  }

  function resolveIcon(iconPath?: string): { src?: string; inlineSvg?: string } | undefined {
    if (!iconPath) return undefined;
    // Absolute URL
    if (/^https?:\/\//i.test(iconPath)) return { src: iconPath };
    // Absolute filesystem path
    if (path.isAbsolute(iconPath)) {
      if (/\.svg$/i.test(iconPath) && fs.existsSync(iconPath)) {
        try {
          const raw = fs.readFileSync(iconPath, "utf8");
          if (isMonochromeSvg(raw)) return { inlineSvg: ensureSvgUsesCurrentColor(raw) };
        } catch {}
      }
      return { src: webview.asWebviewUri(vscode.Uri.file(iconPath)).toString() };
    }
    // Workspace-relative
    const folders = vscode.workspace.workspaceFolders;
    if (folders?.length) {
      const wsResolved = path.join(folders[0].uri.fsPath, iconPath);
      if (fs.existsSync(wsResolved)) {
        if (/\.svg$/i.test(wsResolved)) {
          try {
            const raw = fs.readFileSync(wsResolved, "utf8");
            if (isMonochromeSvg(raw)) return { inlineSvg: ensureSvgUsesCurrentColor(raw) };
          } catch {}
        }
        return { src: webview.asWebviewUri(vscode.Uri.file(wsResolved)).toString() };
      }
    }
    // Extension media folder relative
    const extResolved = path.join(context.extensionUri.fsPath, "media", iconPath);
    if (fs.existsSync(extResolved)) {
      if (/\.svg$/i.test(extResolved)) {
        try {
          const raw = fs.readFileSync(extResolved, "utf8");
          if (isMonochromeSvg(raw)) return { inlineSvg: ensureSvgUsesCurrentColor(raw) };
        } catch {}
      }
      return { src: webview.asWebviewUri(vscode.Uri.file(extResolved)).toString() };
    }
    return undefined;
  }

  function isMonochromeSvg(svg: string): boolean {
    const fills = Array.from(svg.matchAll(/fill="(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)"/g)).map((m) => m[1].toLowerCase());
    const strokes = Array.from(svg.matchAll(/stroke="(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)"/g)).map((m) => m[1].toLowerCase());
    const colors = new Set([...fills, ...strokes].filter((c) => c !== "none"));
    return colors.size <= 1;
  }

  function ensureSvgUsesCurrentColor(svg: string): string {
    svg = svg.replace(/fill="(?!none)[^"]+"/g, 'fill="currentColor"');
    svg = svg.replace(/stroke="(?!none)[^"]+"/g, 'stroke="currentColor"');
    return svg;
  }

  function inlineFileTag(filePath: string, type: "css" | "js", webview: vscode.Webview): string {
    try {
      let resolved = filePath;
      if (!path.isAbsolute(filePath) && !/^https?:\/\//i.test(filePath)) {
        const folders = vscode.workspace.workspaceFolders;
        if (folders?.length) resolved = path.join(folders[0].uri.fsPath, filePath);
        else resolved = path.join(context.extensionUri.fsPath, filePath);
      }
      if (/^https?:\/\//i.test(filePath)) {
        if (type === "css") return `<link rel="stylesheet" href="${filePath}" />`;
        return `<script src="${filePath}"></script>`;
      }
      if (fs.existsSync(resolved)) {
        const uri = webview.asWebviewUri(vscode.Uri.file(resolved));
        if (type === "css") return `<link rel="stylesheet" href="${uri}" />`;
        return `<script src="${uri}"></script>`;
      }
    } catch {}
    return "";
  }
}
