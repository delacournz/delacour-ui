/**
 * Render tests only: `*.render.test.tsx`, run by Jest through jest-expo.
 * Every other suite is pure logic and runs under `bun test`, which skips these.
 *
 * @type {import("jest").Config}
 */
export default {
	preset: "jest-expo",
	testMatch: ["<rootDir>/src/**/*.render.test.tsx"],
	resolver: "react-native-reanimated/jest/resolver",
	setupFiles: ["<rootDir>/src/test/setup.ts"],
	transformIgnorePatterns: [
		"node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@delacour/.*|d3-.*|internmap|uniwind|@legendapp/.*|@maplibre/.*|@central-icons-react-native/.*)",
	],
};
