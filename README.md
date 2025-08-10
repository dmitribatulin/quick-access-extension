# Quick Access Tiles

A Visual Studio Code extension that shows a customizable panel of tiles for quickly opening files, URLs, or running commands. Tiles are organized into groups and configured via settings (User / Workspace / Folder). Settings are merged hierarchically with lower scopes overriding higher ones.

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
          "shouldOpenTerminal": true
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

- file: Absolute or workspace-relative path
- url: Any http(s) URL
- command: Shell command. Use shouldOpenTerminal to run in an integrated terminal, otherwise it runs headless
- You can combine file + url + command; they will all run on click

## Icons

- Provide an image/SVG via file path or URL in the tile’s icon
- Monochrome SVGs are recolored to match text via currentColor for theme compatibility
- If no icon is provided or resolvable, the tile shows a glyph/emoji if present in the icon field, else the first letter of the tile name
- No external icon libraries (e.g., Font Awesome) are used

## Default options

You can set defaults for all tiles and override per tile:

```jsonc
{
  "quickAccessTiles.defaultTileOptions": {
    "backgroundColor": "#2d2d2d",
    "borderColor": "#444444",
    "textColor": "#ffffff",
    "iconSize": 32
  }
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

## Development

- npm install
- npm run watch
- Press F5 to launch the Extension Development Host

## Packaging

- Ensure publisher is set in package.json and you’re logged in with vsce
- Manual: npm run package
- Publish to Marketplace: npm run publish:vsce (requires VSCE_PAT if used in CI)
- Publish to Open VSX: npm run publish:ovsx (requires OVSX_PAT)

## CI publishing (GitHub Actions)

This repo includes .github/workflows/publish.yml. Tag a release like v0.1.0 to build and publish. Configure repository secrets:

- VSCE_PAT — Personal Access Token for Visual Studio Marketplace
- OVSX_PAT — Token for Open VSX (optional)

## License

MIT
