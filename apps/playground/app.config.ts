import { FONTS } from "@delacour/design-system/fonts";
import type { ExpoConfig } from "expo/config";

/**
 * The typefaces the customizer offers, embedded natively.
 *
 * Runtime loading is not an option, and the reason is Android: `expo-font`'s
 * module calls `ReactFontManager.setTypeface(family, Typeface.NORMAL, face)`
 * with the style hardcoded, which writes the four-slot asset cache rather than
 * the numeric-weight one. A family registered that way renders 500 and 600 as
 * Regular and 700 as a synthetic system bold. The config plugin instead
 * generates a `res/font` XML carrying `app:fontWeight` per face — the only path
 * on which `fontWeight` resolves at all.
 *
 * The catalogue lives in `@delacour/design-system` so the picker and this
 * plugin cannot disagree about which families exist; a family shown in the
 * picker but missing here falls back to the system font with no error.
 */
const WEIGHT_DIRECTORIES: Record<number, string> = {
	400: "400Regular",
	500: "500Medium",
	600: "600SemiBold",
	700: "700Bold",
};

/**
 * Bun hoists workspace dependencies to the repository root, so the font files
 * are two levels up rather than under this app.
 */
function fontPath(pkg: string, file: string, weight: number): string {
	const directory = WEIGHT_DIRECTORIES[weight] as string;

	return `../../node_modules/@expo-google-fonts/${pkg}/${directory}/${file}_${directory}.ttf`;
}

/**
 * iOS takes a flat list and reads the family out of each file; Android needs
 * the faces grouped under an explicit family with a numeric weight each, which
 * is what becomes the `res/font` XML.
 */
const iosFonts = FONTS.flatMap((font) => font.weights.map((weight) => fontPath(font.name, font.file, weight)));

const androidFonts = FONTS.map((font) => ({
	fontFamily: font.family,
	fontDefinitions: font.weights.map((weight) => ({ path: fontPath(font.name, font.file, weight), weight })),
}));

/**
 * The marketing version stamped into a build. `release:prod.yml` and
 * `build:native:prod.yml` inject `APP_VERSION` only when a run supplies one
 * (`-F version=x.y.z`); a push to `release/playground` supplies nothing and
 * lands on this default. Every other build — dev client, simulator, a local
 * `expo run:*` — has no such env var and lands here too.
 *
 * The check is on the *shape*, not on presence: a run with no version passes
 * `APP_VERSION=""`, and `??` would let that empty string through as the version.
 *
 * `appVersionSource: "remote"` in `eas.json` means the build *number* is tracked
 * on EAS, so this literal only ever supplies the marketing version — repeated
 * pushes at 1.0.0 still get distinct, incrementing build numbers.
 */
const rawVersion = (process.env as Record<string, string | undefined>).APP_VERSION;
const APP_VERSION = rawVersion && /^\d+\.\d+\.\d+$/.test(rawVersion) ? rawVersion : "1.0.0";

/**
 * Icon art comes from `assets/icon-source.svg` via `bun run icons`. The PNGs
 * below are generated — edit the SVG, not them. `ios/` and `android/` are
 * gitignored, so a change here only reaches a device through `expo prebuild`
 * and a native rebuild.
 */
const expoConfig: ExpoConfig = {
	name: "Delacour UI",
	slug: "delacour-ui",
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
		// The docs site's playground links open here rather than in Safari. Apple
		// fetches `/.well-known/apple-app-site-association` from each domain
		// listed, through its own CDN, when the app is installed — so the file
		// has to be live before a build is installed, or the binary intercepts
		// nothing until it is reinstalled. `apps/web` serves it.
		associatedDomains: ["applinks:ui.delacour.co.nz", "applinks:ui.staging.delacour.co.nz"],
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
		// One filter per host rather than one filter naming both: Android
		// verifies a filter as a unit, so a staging domain that failed to serve
		// `/.well-known/assetlinks.json` would take production's verification
		// down with it.
		intentFilters: [
			{
				action: "VIEW",
				autoVerify: true,
				category: ["BROWSABLE", "DEFAULT"],
				data: [{ scheme: "https", host: "ui.delacour.co.nz", pathPrefix: "/playground/components" }],
			},
			{
				action: "VIEW",
				autoVerify: true,
				category: ["BROWSABLE", "DEFAULT"],
				data: [{ scheme: "https", host: "ui.staging.delacour.co.nz", pathPrefix: "/playground/components" }],
			},
		],
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
		[
			"expo-font",
			{
				ios: { fonts: iosFonts },
				android: { fonts: androidFonts },
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
		url: "https://u.expo.dev/ff1b084f-0d41-43bb-9ce3-0b8cfb7e6f7e",
	},
	// Written by hand because `eas init` cannot edit a dynamic config. It is the
	// only link between this app and the EAS project the workflows build on, so
	// losing it makes every `eas` command prompt to create a second project.
	extra: {
		eas: {
			projectId: "ff1b084f-0d41-43bb-9ce3-0b8cfb7e6f7e",
		},
	},
};

export default expoConfig;
