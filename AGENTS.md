<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Scope discipline: build only what is specified

Do NOT add anything the user did not explicitly ask for. In particular:

- No extra hover effects, transitions, or animations that were not requested.
- No extra UI elements, sections, copy/text, icons, badges, tooltips, or "nice to have" additions.
- Implement exactly what is specified — nothing more. If something seems missing or ambiguous, ask rather than inventing it.

# Figma images: use the exact canvas crop/aspect — never guess

- NEVER guess or approximate an image's aspect ratio. Always use the exact dimensions/aspect ratio shown on the Figma canvas.
- Get the node's true size from `get_metadata` or `get_screenshot` (`original_width`/`original_height`) and size the container to that exact aspect ratio.
- The designer sometimes crops a photo in Figma to a different crop/aspect. Use the CROPPED version exactly as it appears on the canvas.
- Prefer Figma's canvas render (`get_screenshot`) as the asset, since it reflects the crop. The raw `mcp/asset` fill-export URL can stretch/squish or ignore the crop — do not trust it over the canvas render.
