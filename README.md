# Quick Access Tiles

A Visual Studio Code extension that shows a customizable panel of tiles for quickly opening files, URLs, or running commands. Tiles are organized into groups and configured via settings (User / Workspace / Folder). Settings are merged hierarchically with lower scopes overriding higher ones.

![Screenshot](https://github.com/dmitribatulin/quick-access-extension/blob/main/doc/Screenshot.png?raw=true)

## Highlights

- Editor Webview panel with grouped tiles
- Each tile can do multiple things at once: open file, open URL, and run a command
- Hierarchical configuration: Folder > Workspace > User
- Custom default tile options (colors, text color, icon size)
- Inject your own CSS and JS into the panel
- No external icon libraries; use file paths or URLs, or fallback to a glyph/initial

## Usage

- Command Palette: “Quick Access Tiles: Open Quick Access Tiles”
- Keyboard: Ctrl+Alt+Q (when editor has focus)
- Optional buttons (toggle in Settings):
  - Editor title bar button
  - Panel title bar buttons (Problems, Output, Terminal, Debug Console)
  - Status bar entry

## Configure tiles

Open Settings (JSON) and add groups and tiles. Example:

```jsonc
{
  "quickAccessTiles.tileGroups": [
    {
      "groupName": "Home",
      "tiles": [
        {
          "name": "Readme",
          "description": "Open project README",
          "file": "README.md",
          "icon": "media/icon.svg"
        },
        {
          "name": "Website",
          "url": "https://example.com",
          "icon": "https://example.com/logo.png"
        },
        {
          "name": "Build",
          "command": "npm run build",
          "shouldOpenTerminal": true,
          "displaySquare": true,
          "icon": "⚡"
        }
      ]
    },
    {
      "groupName": "Docs",
      "tiles": [
        { "name": "API", "url": "https://your-docs/api" },
        { "name": "Guide", "file": "docs/guide.md" }
      ]
    }
  ]
}
```

### Tile properties

- **name** (required): Display name of the tile
- **description**: Optional description shown below the name (or in tooltip for square tiles)
- **icon**: Image/SVG file path, URL, or glyph/emoji
- **displaySquare**: `true` for compact square tiles (96x96) with tooltip, `false` for regular tiles with text
- **file**: Absolute or workspace-relative path to open
- **url**: HTTP(S) URL to open in browser
- **command**: Shell command to execute
- **shouldOpenTerminal**: `true` to run command in integrated terminal, `false` for headless execution
- **commandCwd**: Working directory for command execution
- **backgroundColor**: Custom background color for tile's icon area
- **borderColor**: Custom border color (hover uses theme accent)
- **textColor**: Custom text color for title/description
- **iconSize**: Icon size hint in pixels (max constrained by layout)

You can combine file + url + command; they will all execute on click.

## Display modes

### Regular tiles (default)

- Show icon, title, description, and action badges
- 288px wide, suitable for detailed information

### Square tiles (`displaySquare: true`)

- Compact 96x96px icon-only display
- Title and description shown in tooltip on hover
- Perfect for frequently-used actions with recognizable icons

## Icon system

- Provide an image/SVG via file path or URL in the tile's icon
- Monochrome SVGs are recolored to match text via currentColor for theme compatibility
- If no icon is provided or resolvable, the tile shows a glyph/emoji if present in the icon field, else the first letter of the tile name
- No external icon libraries (e.g., Font Awesome) are used

## Settings reference

### Global settings

- **quickAccessTiles.tileGroups**: Array of tile groups (main configuration)
- **quickAccessTiles.dashboardDisplayName**: Watermark text shown in bottom-right corner
- **quickAccessTiles.customCssFiles**: Array of CSS file paths/URLs to inject
- **quickAccessTiles.customJsFiles**: Array of JavaScript file paths/URLs to inject

### Default tile options

Applied to all tiles unless overridden per-tile:

- **quickAccessTiles.defaultTileOptions.backgroundColor**: Icon panel background color (`#2d2d2d`)
- **quickAccessTiles.defaultTileOptions.borderColor**: Default border color (`#444444`)
- **quickAccessTiles.defaultTileOptions.textColor**: Default text color (`#ffffff`)
- **quickAccessTiles.defaultTileOptions.iconSize**: Default icon size in pixels (`32`)
- **quickAccessTiles.defaultTileOptions.hoverOverlayColor**: Legacy hover overlay (`rgba(255,255,255,0.1)`)

### UI controls

- **quickAccessTiles.ui.showEditorTitleButton**: Show button in editor title bar (`true`)
- **quickAccessTiles.ui.showPanelTitleButton**: Show buttons in panel title areas (`false`)
- **quickAccessTiles.ui.showStatusBarButton**: Show status bar entry (`false`)

## Icons

- Provide an image/SVG via file path or URL in the tile’s icon
- Monochrome SVGs are recolored to match text via currentColor for theme compatibility
- If no icon is provided or resolvable, the tile shows a glyph/emoji if present in the icon field, else the first letter of the tile name
- No external icon libraries (e.g., Font Awesome) are used

## Configuration examples

You can set defaults for all tiles and override per tile:

```jsonc
{
  "quickAccessTiles.defaultTileOptions": {
    "backgroundColor": "#2d2d2d",
    "borderColor": "#444444", 
    "textColor": "#ffffff",
    "iconSize": 32
  },
  "quickAccessTiles.dashboardDisplayName": "My Dashboard"
}
```

## Custom CSS / JS

Provide arrays of paths/URLs to inject into the webview:

```jsonc
{
  "quickAccessTiles.customCssFiles": [".vscode/tiles.css"],
  "quickAccessTiles.customJsFiles": [".vscode/tiles.js"]
}
```

These arrays merge hierarchically (User < Workspace < Folder). CSS loads after the built‑in stylesheet; JS runs after the panel script.

## Scopes and merge behavior

- Arrays from settings are merged in order: User, then Workspace, then Folder
- Later scopes append to earlier ones; for tile groups, order is preserved as declared
- Per‑tile properties override defaults from quickAccessTiles.defaultTileOptions

## Commands

- quickAccessTiles.openPanel — Open Quick Access Tiles
- quickAccessTiles.refresh — Re-resolve configuration and re-render

## License

MIT
