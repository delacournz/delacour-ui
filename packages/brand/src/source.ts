import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The committed master art, on disk.
 *
 * A separate entry point (`@delacour/brand/source`) because it reaches for
 * `node:fs`: the package's main entry is imported into app bundles and has to
 * stay free of Node built-ins. Generators run under Bun and can have both.
 */
export const ICON_SOURCE_PATH = join(import.meta.dirname, "..", "assets", "icon-source.svg");

/** @returns the master SVG's text, as authored. */
export function readIconSource(): string {
	return readFileSync(ICON_SOURCE_PATH, "utf-8");
}
