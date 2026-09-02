const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Workspace packages are consumed as source, so Metro has to watch and resolve
// outside this app's directory.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

// One instance of each native module for the whole bundle. Bun materialises a
// second copy of these under this app, and two registrations of a native module
// break at runtime.
config.resolver.extraNodeModules = {
	react: path.resolve(workspaceRoot, "node_modules/react"),
	"react-native": path.resolve(workspaceRoot, "node_modules/react-native"),
	"react-native-gesture-handler": path.resolve(workspaceRoot, "node_modules/react-native-gesture-handler"),
	"react-native-keyboard-controller": path.resolve(workspaceRoot, "node_modules/react-native-keyboard-controller"),
	culori: path.resolve(workspaceRoot, "node_modules/culori"),
	"react-native-mmkv": path.resolve(workspaceRoot, "node_modules/react-native-mmkv"),
	"react-native-nitro-modules": path.resolve(workspaceRoot, "node_modules/react-native-nitro-modules"),
	"react-native-pager-view": path.resolve(workspaceRoot, "node_modules/react-native-pager-view"),
	"react-native-reanimated": path.resolve(workspaceRoot, "node_modules/react-native-reanimated"),
	"react-native-safe-area-context": path.resolve(workspaceRoot, "node_modules/react-native-safe-area-context"),
	"react-native-svg": path.resolve(workspaceRoot, "node_modules/react-native-svg"),
	"react-native-worklets": path.resolve(workspaceRoot, "node_modules/react-native-worklets"),
};

// withUniwindConfig must stay the outermost wrapper.
module.exports = withUniwindConfig(config, {
	cssEntryFile: "./src/styles/global.css",
	dtsFile: "./src/uniwind-types.d.ts",
});
