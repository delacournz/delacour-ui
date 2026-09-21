import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Where an app mounts everything else, and what to put there.
 *
 * Two of the three things `init` hands back are edits to this one file — the
 * CSS import and the provider — and both fail silently when they are missed.
 * Naming the file and printing it whole is the difference between an
 * instruction and a paste.
 *
 * Expo Router is worth detecting because its root layout is a *different file*
 * with a different shape: `app/_layout.tsx` rendering a `<Slot />`, not an
 * `App.tsx` rendering the app. Telling a Router app to edit `App.tsx` sends a
 * reader to a file that does not exist.
 */

export type RootLayout = {
	/** Relative to the app root — `src/app/_layout.tsx`. */
	path: string;
	/** Expo Router's root layout, rather than a plain entry component. */
	router: boolean;
};

/**
 * Router layouts first: an app holding both is an Expo Router app whose
 * `App.tsx` is left over, and the layout is the file that actually renders.
 */
const CANDIDATES: RootLayout[] = [
	{ path: "src/app/_layout.tsx", router: true },
	{ path: "app/_layout.tsx", router: true },
	{ path: "src/app/_layout.jsx", router: true },
	{ path: "app/_layout.jsx", router: true },
	{ path: "App.tsx", router: false },
	{ path: "src/App.tsx", router: false },
	{ path: "App.jsx", router: false },
	{ path: "index.tsx", router: false },
];

export function findRootLayout(appRoot: string): RootLayout | null {
	return CANDIDATES.find((candidate) => existsSync(join(appRoot, candidate.path))) ?? null;
}

export type LayoutSpecifiers = {
	/** How this layout imports the Tailwind entry. */
	css: string;
	/** How it imports the copied provider. */
	provider: string;
};

/**
 * The root layout, whole, ready to paste.
 *
 * The CSS import is the first line because that is the rule it exists to
 * teach — anywhere else and every component renders unstyled with nothing
 * logged.
 *
 * `<Slot />` is Expo Router's minimal root. A layout already rendering a
 * `<Stack>` keeps it; the provider goes around whatever is there, which is
 * what the line printed beside this says.
 */
export function renderRootLayout(layout: RootLayout, specifiers: LayoutSpecifiers): string {
	const { css, provider } = specifiers;

	if (!layout.router) {
		return [
			`import "${css}";`,
			`import { DelacourProvider } from "${provider}";`,
			"",
			"export default function App() {",
			"\treturn (",
			"\t\t<DelacourProvider>",
			"\t\t\t<YourApp />",
			"\t\t</DelacourProvider>",
			"\t);",
			"}",
		].join("\n");
	}

	return [
		`import "${css}";`,
		`import { DelacourProvider } from "${provider}";`,
		'import { Slot } from "expo-router";',
		"",
		"export default function RootLayout() {",
		"\treturn (",
		"\t\t<DelacourProvider>",
		"\t\t\t<Slot />",
		"\t\t</DelacourProvider>",
		"\t);",
		"}",
	].join("\n");
}
