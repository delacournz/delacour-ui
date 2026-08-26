import { join } from "node:path";

export const PLAYGROUND = join(import.meta.dirname, "../..");
export const REPO = join(PLAYGROUND, "../..");
export const WEB = join(REPO, "apps/web");

export const DEMOS_DIR = join(PLAYGROUND, "src/demos");
export const MEDIA_DIR = join(WEB, "public/previews");
export const MANIFEST_PATH = join(WEB, "src/previews/manifest.ts");
export const FLOWS_DIR = join(REPO, ".argent/flows/previews");

export const SCHEME = "dlc-ui-playground";
export const BUNDLE_ID = "nz.co.delacour.ui.playground";

/**
 * The capture device is pinned.
 *
 * Output resolution follows the device's pixel size, so capturing half a run on
 * one model and half on another publishes media at two sizes for no reason
 * anyone could see from the diff.
 */
export const DEVICE_NAME = "iPhone 17 Pro";

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Breathing room around the demo, in points, on every side of the crop.
 *
 * One number for every card, so a row of switches and a settings list are
 * framed alike rather than each being tuned by eye.
 */
export const PAD_POINTS = 24;

/** Long edge of the published media, in pixels. Roughly 2x its rendered width on the page. */
export const MAX_EDGE = 720;

/**
 * Fails the run above this, naming the largest files.
 *
 * Media does not delta-compress, so every regeneration is permanent history. A
 * budget nobody enforces is a wish, and the moment to enforce it is before
 * there is enough media for anyone to be tempted to raise it.
 */
export const BUDGET_BYTES = 40 * 1024 * 1024;

/**
 * Auto-stop for a recording, in seconds.
 *
 * Generous relative to a clip — a preview interaction runs about ten seconds —
 * because the cap firing truncates the video, and a truncated clip is reported
 * as a warning the script turns into a failure rather than publishing.
 */
export const RECORDING_CAP_SECONDS = 45;
