const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Expo's monorepo defaults already watch the workspace root and resolve from
// both node_modules directories; overriding them fails expo-doctor.

// One instance of each native module for the whole bundle. Bun materialises a
// second copy of these under this app, and two registrations of a native module
// break at runtime. extraNodeModules cannot do this: Metro consults it only when
// every node_modules lookup has failed, so each request is resolved as if it
// came from the workspace root instead.
const pinned = new Set([
	"react",
	"react-native-skia",
	"react-native",
	"react-native-gesture-handler",
	"react-native-keyboard-controller",
	"culori",
	"react-native-mmkv",
	"react-native-nitro-modules",
	"react-native-pager-view",
	"react-native-reanimated",
	"react-native-safe-area-context",
	"react-native-svg",
	"react-native-teleport",
	"react-native-worklets",
]);
const workspaceOrigin = path.join(workspaceRoot, "package.json");

/** The package a bare specifier names: `@scope/name` or `name`, without a subpath. */
const packageName = (moduleName) => {
	const parts = moduleName.split("/");
	return moduleName.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
};

config.resolver.resolveRequest = (context, moduleName, platform) =>
	pinned.has(packageName(moduleName))
		? context.resolveRequest({ ...context, originModulePath: workspaceOrigin }, moduleName, platform)
		: context.resolveRequest(context, moduleName, platform);

// withUniwindConfig must stay the outermost wrapper.
module.exports = withUniwindConfig(config, {
	cssEntryFile: "./src/styles/global.css",
	dtsFile: "./src/uniwind-types.d.ts",
});
