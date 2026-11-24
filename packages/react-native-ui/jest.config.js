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
	setupFiles: [
		"<rootDir>/src/test/setup.ts",
		"<rootDir>/src/test/mocks/blur.ts",
		"<rootDir>/src/test/mocks/linear-gradient.ts",
		"<rootDir>/src/test/mocks/maplibre.ts",
		"<rootDir>/src/test/mocks/pulsar.ts",
		"<rootDir>/src/test/mocks/skia.ts",
	],
	// Half the cores, not Jest's all-but-one: signoff runs this beside a build and three copied-test
	// apps, and a starved worker blows the 5 s test timeout on a render that takes 100 ms.
	maxWorkers: "50%",
	// d3-shape 3.2.1 ships only `.mjs`, which jest-expo's `\\.[jt]sx?$` Babel transform does not match.
	transform: { "^.+\\.mjs$": "babel-jest" },
	transformIgnorePatterns: [
		"node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@delacour/.*|d3-.*|internmap|uniwind|@legendapp/.*|@maplibre/.*|@central-icons-react-native/.*)",
	],
};
