import type { WardenConfig, WardenE2eSpec } from "@delacour/warden/config";

/** The playground's bundle id, on both platforms. */
const BUNDLE_ID = "nz.co.delacour.ui.playground";

/**
 * Switches off everything expo-dev-menu would otherwise draw over a capture:
 * the menu opening itself at launch, the first-run onboarding sheet, and the
 * floating "Tools" button — a round gear over the top-right of every screen,
 * `/preview` included, which a `device` frame keeps and publishes.
 */
const DEV_MENU_OFF = [
	"-EXDevMenuShowsAtLaunch",
	"NO",
	"-EXDevMenuIsOnboardingFinished",
	"YES",
	"-EXDevMenuShowFloatingActionButton",
	"NO",
];

/**
 * The preview capture: a component spec walks every captured demo through the
 * chrome-free preview route in both themes, so one test is minutes, not
 * seconds, and a flow that typed relaunches the app on the way.
 */
const PREVIEWS_SPEC = {
	actionTimeout: "30s",
	assertionTimeout: "8s",
	bundleId: BUNDLE_ID,
	timeout: "15m",
} satisfies WardenE2eSpec;

/**
 * warden for the playground: the dev client `warden dev ios` installs, and the
 * `previews` suite `bun run previews` drives — one spec per component under
 * `e2e/previews/`, on the dev client against a Metro warden starts for the
 * run, N leased simulators sharing it (`--count N`).
 *
 * The suite selects by `--flows <components>`, never by the git diff: which
 * demos need recapturing is a question of source hashes that
 * `scripts/capture-previews.ts` answers before it calls `warden e2e`.
 */
export default {
	projects: [
		{
			name: "playground",
			bundleId: { android: BUNDLE_ID, ios: BUNDLE_ID },
			build: {
				ios: "bun run ensure-prebuild && bunx expo run:ios --no-install --no-bundler",
				android: "bun run ensure-prebuild && bunx expo run:android --no-install --no-bundler",
			},
			fingerprint: { include: "native" },
		},
	],
	e2e: {
		performance: {
			project: "playground",
			flowsDir: "e2e/performance",
			platform: "ios",
			profile: "iphone-17-pro",
			app: true,
			metro: { launchArgs: DEV_MENU_OFF, prewarm: true, readyTimeout: "5m" },
			isolate: "device",
			shutdown: "idle",
			jobTimeoutMs: 15 * 60_000,
			spec: { ...PREVIEWS_SPEC, timeout: "6m", actionTimeout: "40s" },
		},
		previews: {
			project: "playground",
			flowsDir: "e2e/previews",
			platform: "ios",
			profile: "iphone-17-pro",
			app: true,
			metro: { launchArgs: DEV_MENU_OFF, prewarm: true, readyTimeout: "5m" },
			isolate: "device",
			shutdown: "idle",
			// Per flow; a component spec with six animated demos runs for several minutes.
			jobTimeoutMs: 30 * 60_000,
			spec: PREVIEWS_SPEC,
			// Selection is always explicit (`--flows`), so nothing here maps changes to flows.
			unmatched: "skip",
			unmapped: "run",
		},
	},
} satisfies WardenConfig;
