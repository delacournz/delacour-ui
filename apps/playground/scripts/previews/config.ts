import { join } from "node:path";

export const PLAYGROUND = join(import.meta.dirname, "../..");
export const REPO = join(PLAYGROUND, "../..");
export const WEB = join(REPO, "apps/web");

export const DEMOS_DIR = join(PLAYGROUND, "src/demos");
export const MEDIA_DIR = join(WEB, "public/previews");
export const MANIFEST_PATH = join(WEB, "src/previews/manifest.ts");
/** One warden e2e spec per component; each captured demo is a `capture()` in its component's spec. */
export const SPECS_DIR = join(PLAYGROUND, "e2e/previews");

export const SCHEME = "dlc-ui-playground";
export const BUNDLE_ID = "nz.co.delacour.ui.playground";

/** Mirrors `DemoFrame` in `src/demos/types.ts`, which imports React and cannot be read by a script. */
export type DemoFrame = "stage" | "device";

/**
 * The capture device is pinned, as a warden profile.
 *
 * Output resolution follows the device's pixel size, so capturing half a run on
 * one model and half on another publishes media at two sizes for no reason
 * anyone could see from the diff. `warden e2e previews` claims this profile;
 * `--count N` claims N of it.
 */
export const DEVICE_PROFILE = "iphone-17-pro";

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Breathing room around the demo, in points, on every side of the crop.
 *
 * One number for every card, so a row of switches and a settings list are
 * framed alike rather than each being tuned by eye.
 */
export const PAD_POINTS = 24;

/** Long edge of a `stage` capture, in pixels. Roughly 2x its rendered width on the page. */
export const MAX_EDGE = 720;

/**
 * Long edge of a `device` capture, in pixels.
 *
 * The stage cap cannot cover both. A stage capture is one control drawn at
 * roughly 2x its rendered width, which 720 is sized for; a device capture is a
 * whole phone screen, and the landing hero draws that 300 CSS px wide — so 720
 * on the long edge left 332 across, and every retina display was upscaling it
 * two to three times. The docs page draws the same file at 240 wide, so this
 * is entirely about the hero.
 *
 * 1440 gives 662x1440 from the pinned device, a little over 2x the hero's box
 * on a 3x screen. Only three demos are device frames, so the whole cost is six
 * files.
 */
export const DEVICE_MAX_EDGE = 1440;

/**
 * Fails the run above this, naming the largest files.
 *
 * Media does not delta-compress, so every regeneration is permanent history. A
 * budget nobody enforces is a wish, and the moment to enforce it is before
 * there is enough media for anyone to be tempted to raise it.
 *
 * Raised from 40 MB to 120 MB deliberately: 38 components filled 32 MB at four
 * to six captured demos each, and the library roughly triples. The density per
 * component is unchanged; the cap moved with the component count, not with it.
 */
export const BUDGET_BYTES = 120 * 1024 * 1024;

/**
 * How long a spec waits for the preview route to announce a demo.
 *
 * The first deep link after a relaunch waits on a cold JS load — measured at
 * 15 s against a dev client, and twice that on a machine busy with other
 * simulators — so the sentinel gets far more than warden's default action
 * timeout.
 */
export const NAVIGATION_TIMEOUT_MS = 60_000;

/**
 * Where a demo's media lives, and the URLs the manifest points at.
 *
 * Keyed on the **full id**, not component + demo. A folder gallery nests
 * (`screen/navbar/default`), and two facets are free to name a demo the same
 * thing — `screen/navbar/default` and `screen/chat/default` would collide the
 * moment the path were flattened to component + name.
 */
export function mediaPaths(id: string, theme: Theme, hash: string) {
	const dir = join(MEDIA_DIR, id);
	return {
		dir,
		poster: join(dir, `${theme}.png`),
		posterUrl: `/previews/${id}/${theme}.png?v=${hash}`,
		video: join(dir, `${theme}.mp4`),
		videoUrl: `/previews/${id}/${theme}.mp4?v=${hash}`,
	};
}
