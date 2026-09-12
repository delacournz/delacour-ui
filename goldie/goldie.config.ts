import type { GoldieConfig } from "/Users/chris/.npm/_npx/18a971dee120d222/node_modules/goldie/dist/index.d.ts";

/**
 * App Store assets for the playground, rendered by goldie
 * (https://github.com/kacperkapusciak/goldie). The flows it replays live in
 * `.argent/flows/store-*.yaml`; every path here resolves against this file and
 * the output lands in `goldie/out/`, which is gitignored.
 *
 * Run from the repo root with `GOLDIE_CONFIG=goldie/goldie.config.ts npx -y goldie@0 <cmd>`.
 */

const APP_ROOT = "/Users/chris/orca/workspaces/delacour-ui/bonito";

const config: GoldieConfig = {
	appRoot: APP_ROOT,
	appPath: `${process.env.HOME}/Library/Developer/Xcode/DerivedData/DelacourUI-bsctzhmnwureqbcxcuevgnqngkqr/Build/Products/Release-iphonesimulator/DelacourUI.app`,
	bundleId: "nz.co.delacour.ui.playground",

	devices: ["iphone-6.9"],
	locales: ["en-US"],
	appearance: "dark",

	frame: { variant: "17-pro-orange" },

	theme: {
		background: "linear-gradient(160deg, #18181B 0%, #09090B 60%, #000000 100%)",
		headlineColor: "#FAFAFA",
		subheadColor: "#A1A1AA",
		fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
		copyHeightRatio: 0.24,
		deviceWidthRatio: 0.84,
		template: "editorial",
		layout: "classic",
	},

	store: {
		name: "Delacour UI",
		subtitle: { "en-US": "React Native components" },
		developer: "Delacour",
		category: "Developer Tools",
		rating: 5.0,
		ratingCount: "12 Ratings",
		ageRating: "4+",
		price: "Free",
		description: {
			"en-US":
				"Every component in delacour-react-native-ui, running on your phone. Nineteen components, each with its own gallery of real demos: buttons, inputs, tabs, bottom sheets, charts drawn in Skia, and a full screen scaffold.\n\nOpen the customizer and restyle all of it at once. Eight axes — style, radius, base colour, accent, chart colours, fonts — repaint the same tokens, so what you see is exactly what the library ships. Generate the CSS and drop it into your app.\n\nScan the QR code on any documentation page to jump straight to that component.",
		},
	},

	scenes: [
		{
			kind: "screenshot",
			id: "showcase",
			flow: "store-01-showcase",
			headline: { "en-US": "Nineteen components, one screen" },
			subhead: { "en-US": "Navbar, tabs, charts, forms and footers that already fit together." },
		},
		{
			kind: "screenshot",
			id: "home",
			flow: "store-02-home",
			headline: { "en-US": "Every component, live" },
			subhead: { "en-US": "A gallery of real demos for each one, on a real device." },
		},
		{
			kind: "screenshot",
			id: "customize",
			flow: "store-03-customize",
			headline: { "en-US": "Make it your brand" },
			subhead: { "en-US": "Eight axes repaint every token. Generate the CSS when it looks right." },
		},
		{
			kind: "screenshot",
			id: "charts",
			flow: "store-04-charts",
			headline: { "en-US": "Charts drawn in Skia" },
			subhead: { "en-US": "Line, area, bar, scatter, candlestick and pie, on the same parts." },
		},
		{
			kind: "screenshot",
			id: "light",
			flow: "store-05-showcase-light",
			headline: { "en-US": "Light and dark, one token set" },
			subhead: { "en-US": "Both modes ship with every component. Nothing is restyled by hand." },
		},
		{
			kind: "preview",
			id: "preview",
			segments: [
				{ id: "open", flow: "store-preview-01-open" },
				{ id: "restyle", flow: "store-preview-02-restyle" },
				{ id: "charts", flow: "store-preview-03-charts" },
				{ id: "showcase", flow: "store-preview-04-showcase", holdSeconds: 1.5 },
			],
		},
	],
};

export default config;
