import type { ExpoConfig } from "expo/config";

/**
 * The version EAS stamps into a production binary. `build:native:prod.yml` and
 * `release:prod.yml` parse it out of the `release/app/x.y.z` branch name and
 * export it as `APP_VERSION`; every other build — dev client, simulator,
 * a local `expo run:*` — has no such env var and falls back to `0.0.0`.
 * `appVersionSource: "remote"` in `eas.json` means the build *number* is
 * tracked on EAS, so this literal only ever supplies the marketing version.
 */
const APP_VERSION = (process.env as Record<string, string | undefined>).APP_VERSION ?? "0.0.0";

/**
 * Icon art comes from `assets/icon-source.svg` via `bun run icons`. The PNGs
 * below are generated — edit the SVG, not them. `ios/` and `android/` are
 * gitignored, so a change here only reaches a device through `expo prebuild`
 * and a native rebuild.
 */
const expoConfig: ExpoConfig = {
	name: "Delacour UI",
	slug: "delacour-ui-playground",
	scheme: "dlc-ui-playground",
	owner: "delacour",
	version: APP_VERSION,
	orientation: "portrait",
	userInterfaceStyle: "automatic",
	platforms: ["ios", "android"],
	icon: "./assets/icon.png",
	ios: {
		supportsTablet: false,
		infoPlist: {
			ITSAppUsesNonExemptEncryption: false,
		},
		bundleIdentifier: "nz.co.delacour.ui.playground",
		// The dark and tinted variants drop the card and let iOS supply the
		// backdrop and the hue. Without them iOS derives both by desaturating
		// the light icon, which reads as a grey square.
		icon: {
			light: "./assets/icon.png",
			dark: "./assets/icon-dark.png",
			tinted: "./assets/icon-tinted.png",
		},
	},
	android: {
		package: "nz.co.delacour.ui.playground",
		// The foreground is already inset into Android's 72/108 safe zone by the
		// generator, so the launcher mask cannot crop the mark.
		adaptiveIcon: {
			foregroundImage: "./assets/android-icon-foreground.png",
			monochromeImage: "./assets/android-icon-monochrome.png",
			backgroundColor: "#18181B",
		},
	},
	plugins: [
		"expo-router",
		"expo-status-bar",
		// Mirrors --background in packages/native-ui/src/styles/theme.css.
		// Restated rather than imported because prebuild runs in Node and cannot
		// read the CSS; every other consumer of the colour reads the token.
		//
		// Without the dark variant the generated storyboard hardcodes white and
		// declares appearance="light", so a dark-mode cold start flashes white
		// before React mounts.
		[
			"expo-splash-screen",
			{
				backgroundColor: "#ffffff",
				dark: { backgroundColor: "#0a0a0a" },
			},
		],
		// Required for the root view background to be settable at all on iOS,
		// and what SystemUI.setBackgroundColorAsync drives at runtime.
		"expo-system-ui",
		[
			"expo-dev-client",
			{
				launchMode: "most-recent",
			},
		],
	],
	experiments: {
		typedRoutes: true,
		tsconfigPaths: true,
		reactCompiler: true,
	},
	// The fingerprint policy is what makes `.eas/workflows` cheap: a runtime
	// version derived from the native dependency graph is the same hash the
	// `get-build` jobs match on, so a commit that changes no native code reuses
	// its existing binary and ships as an OTA update instead of rebuilding.
	// A hand-written version string would decouple the two and silently serve
	// updates to binaries that cannot run them.
	runtimeVersion: {
		policy: "fingerprint",
	},
	updates: {
		url: "https://u.expo.dev/790dfdc0-c0ea-47e4-9f28-b86a6f7ed535",
	},
	// Written by hand because `eas init` cannot edit a dynamic config. It is the
	// only link between this app and the EAS project the workflows build on, so
	// losing it makes every `eas` command prompt to create a second project.
	extra: {
		eas: {
			projectId: "790dfdc0-c0ea-47e4-9f28-b86a6f7ed535",
		},
	},
};

export default expoConfig;
