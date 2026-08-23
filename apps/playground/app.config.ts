import type { ExpoConfig } from "expo/config";

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
	version: "0.0.0",
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
};

export default expoConfig;
