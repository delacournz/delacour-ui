import type { ExpoConfig } from "expo/config";

const expoConfig: ExpoConfig = {
	name: "Delacour UI",
	slug: "delacour-ui-playground",
	scheme: "dlc-ui-playground",
	version: "0.0.0",
	orientation: "portrait",
	userInterfaceStyle: "automatic",
	platforms: ["ios", "android"],
	ios: {
		supportsTablet: false,
		infoPlist: {
			ITSAppUsesNonExemptEncryption: false,
		},
		bundleIdentifier: "nz.co.delacour.ui.playground",
	},
	android: {
		package: "nz.co.delacour.ui.playground",
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
