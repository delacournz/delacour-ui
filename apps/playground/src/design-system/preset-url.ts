import type { DesignSystemConfig } from "@delacour/design-system/config";
import { encodePreset } from "@delacour/design-system/preset";

/**
 * Where a theme composed here goes to become a file.
 *
 * The documentation site decodes the code, resolves the same tokens this app is
 * painting with, and renders a `globals.css` with a copy button — which is the
 * one thing a phone cannot usefully do.
 *
 * The origin is restated rather than imported: it lives in
 * `apps/web/src/lib/shared.ts`, and this app cannot reach into a web workspace.
 * `preset-url.test.ts` reads that file as text and fails if the two drift, which
 * is the house move for a constant with two owners — the alternative is a host
 * rename that leaves every phone opening a dead link, and the only place that
 * shows is on a device.
 *
 * **Not `__DEV__` and not localhost.** `bun ios` runs against a real device,
 * which cannot reach the host's `localhost:3000`, so production is the default
 * that always works. `EXPO_PUBLIC_THEME_SITE_URL` is the opt-in for whoever is
 * actually running `bun dev` in `apps/web` beside a simulator.
 *
 * This file belongs in `design-system/` for the reason that folder exists:
 * nothing in it imports React Native, so `bun test` can load the whole thing.
 */

export const DEFAULT_DOCS_SITE_URL = "https://ui.delacour.co.nz";

export const THEME_PRESET_PATH = "/theme";

export const DOCS_SITE_URL = (process.env.EXPO_PUBLIC_THEME_SITE_URL || DEFAULT_DOCS_SITE_URL).replace(/\/+$/, "");

/**
 * The link that turns this configuration into a CSS file.
 *
 * The code is passed through `encodeURIComponent` even though the codec's
 * alphabet makes that a no-op — and the test pins that it *is* a no-op, so a
 * codec that starts emitting `+` or `/` fails here rather than silently
 * truncating a parameter on someone else's phone.
 */
export function presetUrl(config: DesignSystemConfig): string {
	return `${DOCS_SITE_URL}${THEME_PRESET_PATH}?preset=${encodeURIComponent(encodePreset(config))}`;
}
