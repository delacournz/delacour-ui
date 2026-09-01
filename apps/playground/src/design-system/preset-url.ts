import type { DesignSystemConfig } from "@delacour/design-system/config";
import { encodePreset } from "@delacour/design-system/preset";

/**
 * Where a theme composed here goes to become a file.
 *
 * The documentation site decodes the code, resolves the same tokens this app is
 * painting with, and renders a `globals.css` with a copy button — which is the
 * one thing a phone cannot usefully do.
 *
 * The production origin is restated rather than imported: it lives in
 * `apps/web/src/lib/shared.ts`, and this app cannot reach into a web workspace.
 * `preset-url.test.ts` reads that file as text and fails if the two drift, which
 * is the house move for a constant with two owners — the alternative is a host
 * rename that leaves every phone opening a dead link, and the only place that
 * shows is on a device.
 *
 * Nothing here imports React Native, so `bun test` can reach all of it. The one
 * piece that needs the runtime — asking Expo where Metro is being served from —
 * lives in `docs-origin.ts` and calls {@link devOriginFrom}, which is the actual
 * logic and is tested below.
 */

export const DEFAULT_DOCS_SITE_URL = "https://ui.delacour.co.nz";

export const THEME_PRESET_PATH = "/theme";

/** `apps/web`'s Vite dev server — `server.port` in its `vite.config.ts`. */
export const WEB_DEV_PORT = 3000;

/**
 * The local documentation site, derived from wherever Metro is being served.
 *
 * **Not `localhost`.** `bun ios` runs `expo run:ios --device`, and a phone
 * cannot reach the laptop's loopback — nor can an Android emulator, for which
 * `localhost` is the emulator itself. What both *can* reach is the host Metro
 * already reached them on, which Expo publishes as `hostUri`: `localhost:8088`
 * on a simulator, `192.168.x.x:8088` on a device over Wi-Fi, `10.0.2.2:8088` on
 * an Android emulator. Keep the host, swap the port, and the link works from
 * every one of them without anything being configured.
 *
 * Returns `null` when there is nothing to derive from — a release build, or a
 * runtime that publishes no host — so the caller falls back to production.
 */
export function devOriginFrom(hostUri: string | null | undefined, port: number = WEB_DEV_PORT): string | null {
	if (!hostUri) return null;

	// `hostUri` is bare `host:port`, but a manifest URL can arrive with a scheme
	// and a path on it — `exp://192.168.1.5:8088/--/foo`. Take the authority.
	const authority = hostUri.replace(/^[a-z][\w+.-]*:\/\//i, "").split("/")[0] ?? "";
	const host = authority.replace(/:\d+$/, "");
	if (!host) return null;

	// Parsed rather than trusted. Whatever the runtime publishes ends up in a
	// URL a browser has to open, and a host that survives the trimming above
	// without being one — a bare `::`, an empty authority — would otherwise reach
	// `Linking.openURL` as a string that cannot be parsed at all.
	try {
		return new URL(`http://${host}:${port}`).origin;
	} catch {
		return null;
	}
}

/**
 * The link that turns this configuration into a CSS file.
 *
 * The code is passed through `encodeURIComponent` even though the codec's
 * alphabet makes that a no-op — and the test pins that it *is* a no-op, so a
 * codec that starts emitting `+` or `/` fails here rather than silently
 * truncating a parameter on someone else's phone.
 */
export function presetUrl(config: DesignSystemConfig, origin: string = DEFAULT_DOCS_SITE_URL): string {
	const base = origin.replace(/\/+$/, "");

	return `${base}${THEME_PRESET_PATH}?preset=${encodeURIComponent(encodePreset(config))}`;
}
