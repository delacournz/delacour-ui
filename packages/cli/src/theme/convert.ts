/**
 * Turns a web app's theme into one React Native can read.
 *
 * The palette this library paints from is shadcn's, name for name, so almost
 * everything in a `globals.css` or a tweakcn export carries across untouched.
 * Three things do not, and they are the whole job:
 *
 * 1. **The wrapper.** Uniwind reads a theme only from `@variant light` /
 *    `@variant dark`. A literal `.dark { … }` is registered as a *utility class
 *    named `dark`* and contributes nothing — no error, no warning, just a dark
 *    theme that never arrives.
 * 2. **The gaps.** shadcn has no `elevated`, `tertiary`, `-soft` pair or
 *    `overlay`, and this package's components paint with all of them. Each is
 *    filled in as an expression over a token the source *did* define, so the
 *    result follows the pasted palette instead of the package's defaults.
 * 3. **The font stacks.** React Native's `fontFamily` takes one family name
 *    with no fallback list, so a whole stack resolves to nothing and quietly
 *    falls back to the system sans.
 *
 * Pure — a string in, a string out — so the whole matrix is reachable from
 * `bun test` and the command around it is only I/O.
 */

/** A palette, as declared by whatever the source happened to be. */
export type ThemeSource = {
	light: Record<string, string>;
	dark: Record<string, string>;
	/**
	 * The families each platform declares, when the source was already in this
	 * package's shape. Without this a second run would read the split block as
	 * nothing at all and quietly reset both platforms to their defaults.
	 */
	platformFonts?: { android: Record<string, string>; ios: Record<string, string> };
};

export type ConversionResult = {
	css: string;
	/** Names taken from the source. */
	carried: string[];
	/** Names this package needs that the source did not define. */
	derived: string[];
	/** Anything that could not be used as written. */
	warnings: string[];
};

/** Steps of the corner scale `tokens.css` derives from `--radius` on its own. */
const DERIVED_RADIUS = /^--radius-(xs|sm|md|lg|xl|2xl|3xl|4xl)$/;

const FONTS = ["--font-sans", "--font-serif", "--font-mono"] as const;
type Font = (typeof FONTS)[number];

/**
 * The family each platform reads when a source names no real one.
 *
 * No single name works on both: iOS has Menlo and Georgia and not `monospace`,
 * Android the reverse. Everything here ships with the OS, so a consuming app
 * needs no `expo-font` call and no config plugin.
 */
const PLATFORM_FONTS: Record<Font, { android: string; ios: string }> = {
	"--font-sans": { ios: "System", android: "sans-serif" },
	"--font-serif": { ios: "Georgia", android: "serif" },
	"--font-mono": { ios: "Menlo", android: "monospace" },
};

/** CSS generic families — a name, but never one a font file is loaded for. */
const GENERIC_FAMILIES = new Set([
	"cursive",
	"fantasy",
	"monospace",
	"sans-serif",
	"serif",
	"system-ui",
	"ui-monospace",
	"ui-rounded",
	"ui-sans-serif",
	"ui-serif",
]);

/**
 * The tokens this package adds, and how each is reached from shadcn's set.
 *
 * A function per variant rather than one expression: `elevated` has to lift
 * toward the page in light and toward the text in dark, and a single formula
 * that did both would read as raised in one theme and sunken in the other —
 * which is the exact failure the token exists to prevent.
 */
const EXTENSIONS: Record<string, { dark: string; light: string }> = {
	"--elevated": {
		light: "var(--background)",
		dark: "color-mix(in oklch, var(--muted) 88%, var(--foreground))",
	},
	"--elevated-foreground": { light: "var(--foreground)", dark: "var(--foreground)" },
	"--tertiary": {
		light: "color-mix(in oklch, var(--secondary) 50%, var(--background))",
		dark: "color-mix(in oklch, var(--secondary) 50%, var(--background))",
	},
	"--tertiary-foreground": {
		light: "color-mix(in oklch, var(--foreground) 50%, var(--muted-foreground))",
		dark: "color-mix(in oklch, var(--foreground) 50%, var(--muted-foreground))",
	},
	// No shadcn counterpart to derive from, so these stay literal.
	"--success": { light: "oklch(0.696 0.17 162.48)", dark: "oklch(0.696 0.17 162.48)" },
	"--success-foreground": { light: "oklch(0.985 0 0)", dark: "oklch(0.205 0 0)" },
	"--warning": { light: "oklch(0.769 0.188 70.08)", dark: "oklch(0.769 0.188 70.08)" },
	"--warning-foreground": { light: "oklch(0.216 0.006 56.043)", dark: "oklch(0.216 0.006 56.043)" },
	"--info": { light: "oklch(0.623 0.188 259.81)", dark: "oklch(0.623 0.188 259.81)" },
	"--info-foreground": { light: "oklch(0.985 0 0)", dark: "oklch(0.985 0 0)" },
	// A scrim is black in both themes; deriving it from `--foreground` would
	// paint a white one over a dark app.
	"--overlay": { light: "oklch(0 0 0 / 45%)", dark: "oklch(0 0 0 / 65%)" },
};

/** `destructive`, `success`, `warning`, `info` each carry a tinted pair. */
const SOFT_BASES = ["destructive", "success", "warning", "info"] as const;

function softExtensions(): Record<string, { dark: string; light: string }> {
	const soft: Record<string, { dark: string; light: string }> = {};

	for (const base of SOFT_BASES) {
		soft[`--${base}-soft`] = {
			light: `color-mix(in oklch, var(--${base}) 8%, var(--background))`,
			dark: `color-mix(in oklch, var(--${base}) 14%, var(--background))`,
		};
		soft[`--${base}-soft-foreground`] = {
			// Over a dark tint the state colour already reads; mixing it toward a
			// near-white foreground would only wash it out.
			light: `color-mix(in oklch, var(--${base}) 70%, var(--foreground))`,
			dark: `var(--${base})`,
		};
	}

	return soft;
}

const ALL_EXTENSIONS = { ...EXTENSIONS, ...softExtensions() };

/** Everything shadcn's own `-foreground` pairing needs, in the order it reads best. */
const PREFERRED_ORDER = [
	"--background",
	"--foreground",
	"--card",
	"--card-foreground",
	"--popover",
	"--popover-foreground",
	"--primary",
	"--primary-foreground",
	"--secondary",
	"--secondary-foreground",
	"--muted",
	"--muted-foreground",
	"--accent",
	"--accent-foreground",
	"--destructive",
	"--destructive-foreground",
	"--border",
	"--input",
	"--ring",
];

/** Reads a palette out of CSS, or out of a shadcn registry item's JSON. */
export function parseTheme(source: string): ThemeSource {
	const fromJson = parseRegistryItem(source);
	if (fromJson) return fromJson;

	const css = stripComments(source);

	// `@theme` is where a generator puts what is not a colour — `--radius`, the
	// shadow scale. Read as a default under both themes; a `:root` or `.dark`
	// that also names one wins.
	const base = clean({ ...blockDeclarations(css, "@theme"), ...blockDeclarations(css, "@theme inline") });

	const light = clean({ ...base, ...blockDeclarations(css, ":root"), ...blockDeclarations(css, "@variant light") });
	const dark = clean({ ...base, ...blockDeclarations(css, ".dark"), ...blockDeclarations(css, "@variant dark") });

	const ios = blockDeclarations(css, "@variant ios");
	const android = blockDeclarations(css, "@variant android");

	if (Object.keys(light).length === 0 && Object.keys(dark).length === 0) {
		throw new Error(
			"Found no palette here. Expected a `:root { … }` block, a `.dark { … }` block, or a shadcn theme's JSON."
		);
	}

	const platformFonts = Object.keys(ios).length > 0 || Object.keys(android).length > 0 ? { ios, android } : undefined;

	return { light, dark, platformFonts };
}

/**
 * Drops what an alias block says, which is nothing a theme did not already say.
 *
 * Both forms matter. `--color-primary: var(--primary)` is the mapping this
 * command writes itself, and re-reading it would mint a `--color-primary` token
 * that then gets its own `--color--color-primary` alias. A self-alias like
 * `--shadow-sm: var(--shadow-sm)` is worse: carried through it becomes a
 * variable defined as itself, which resolves to nothing at all.
 */
function clean(declarations: Record<string, string>): Record<string, string> {
	const kept: Record<string, string> = {};

	for (const [name, value] of Object.entries(declarations)) {
		if (name.startsWith("--color-")) continue;
		if (value.replace(/\s/g, "") === `var(${name})`) continue;

		kept[name] = value;
	}

	return kept;
}

/** Turns a parsed palette into a `theme.css` this package can read. */
export function convertTheme(source: ThemeSource): ConversionResult {
	const warnings: string[] = [];
	const carried: string[] = [];
	const derived: string[] = [];

	const fonts = takeFonts(source, warnings);
	const names = new Set([...Object.keys(source.light), ...Object.keys(source.dark)]);

	const light: Record<string, string> = {};
	const dark: Record<string, string> = {};
	const droppedRadius: string[] = [];

	for (const name of names) {
		if (DERIVED_RADIUS.test(name)) {
			droppedRadius.push(name);
			continue;
		}

		// A token declared in one variant only would fail Uniwind's build
		// outright: "All themes must have the same variables".
		const inLight = source.light[name];
		const inDark = source.dark[name];
		const value = inLight ?? inDark;
		if (value === undefined) continue;

		light[name] = inLight ?? value;
		dark[name] = inDark ?? value;
		carried.push(name);
	}

	if (droppedRadius.length > 0) {
		warnings.push(
			`${droppedRadius.sort().join(", ")} dropped — every corner here is a multiple of --radius, so setting that alone retunes them all.`
		);
	}

	for (const [name, expression] of Object.entries(ALL_EXTENSIONS)) {
		if (light[name] !== undefined) continue;

		light[name] = expression.light;
		dark[name] = expression.dark;
		derived.push(name);
	}

	const dangling = undeclared(light);
	if (dangling.length > 0) {
		warnings.push(
			`${dangling.join(", ")} referenced but not declared — the tokens built on them resolve to nothing. Add them to the source theme.`
		);
	}

	return {
		css: render({ light, dark, fonts }),
		carried: carried.sort(),
		derived: derived.sort(),
		warnings,
	};
}

/**
 * Names the palette leans on but never declares.
 *
 * A derived token is an expression over the source's own colours, so a theme
 * that omits `--muted` leaves `--elevated` pointing at nothing. Nothing
 * complains at build time; the component painting with it just draws nothing,
 * and only in the theme that was short.
 */
function undeclared(values: Record<string, string>): string[] {
	const referenced = new Set<string>();

	for (const value of Object.values(values)) {
		for (const [, name] of value.matchAll(/var\((--[\w-]+)\)/g)) referenced.add(name);
	}

	return [...referenced].filter((name) => values[name] === undefined).sort();
}

/** Pulls the font families out of the palette, one family name per platform. */
function takeFonts(source: ThemeSource, warnings: string[]): Record<Font, { android: string; ios: string }> {
	const fonts: Record<string, { android: string; ios: string }> = { ...PLATFORM_FONTS };

	for (const name of FONTS) {
		const stack = source.light[name] ?? source.dark[name];
		delete source.light[name];
		delete source.dark[name];

		// Already split by platform — this is our own output being read back.
		const split = source.platformFonts;
		if (split) {
			const ios = split.ios[name]?.replace(/^["']|["']$/g, "");
			const android = split.android[name]?.replace(/^["']|["']$/g, "");
			if (ios && android) {
				fonts[name] = { ios, android };
				continue;
			}
		}

		if (stack === undefined) continue;

		const first = stack
			.split(",")[0]
			?.trim()
			.replace(/^["']|["']$/g, "");
		if (!first) continue;

		if (GENERIC_FAMILIES.has(first.toLowerCase())) {
			warnings.push(
				`${name} names only generic families, so each platform keeps its own default (${PLATFORM_FONTS[name].ios} / ${PLATFORM_FONTS[name].android}).`
			);
			continue;
		}

		fonts[name] = { ios: first, android: first };
		warnings.push(
			`${name} kept only "${first}" — React Native takes one family name, never a stack. Load it with expo-font or it falls back to the system default.`
		);
	}

	return fonts as Record<Font, { android: string; ios: string }>;
}

/** True when a value is a colour, and so belongs in Tailwind's colour namespace. */
function isColor(value: string): boolean {
	return /^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color-mix|color\()/i.test(value.trim()) || value.trim() === "transparent";
}

function render(theme: {
	dark: Record<string, string>;
	fonts: Record<Font, { android: string; ios: string }>;
	light: Record<string, string>;
}): string {
	const names = orderNames(Object.keys(theme.light));
	const declarations = (values: Record<string, string>, indent: string) =>
		names.map((name) => `${indent}${name}: ${values[name]};`).join("\n");

	const aliases = names
		.map((name) => {
			// A colour is reachable as `bg-*`/`text-*` through the colour
			// namespace; a shadow through its own. A scalar like `--radius` is
			// neither — aliasing it would mint a `bg-radius` and no corner at all.
			if (/^--shadow-(2xs|xs|sm|md|lg|xl|2xl)$/.test(name)) return `\t${name}: var(${name});`;
			if (!isColor(theme.light[name] ?? "") && !(theme.light[name] ?? "").startsWith("var(")) return null;

			return `\t--color-${name.slice(2)}: var(${name});`;
		})
		.filter((line): line is string => line !== null);

	const fontBlock = (platform: "android" | "ios") =>
		FONTS.map((name) => `\t\t\t${name}: "${theme.fonts[name][platform]}";`).join("\n");

	return `/*
 * Written by \`delacour theme\`.
 *
 * Two layers, which is shadcn's own shape: the raw semantic names below, once
 * per theme, and the \`@theme inline\` block at the bottom that maps each onto
 * the \`--color-*\` Tailwind mints \`bg-*\` and \`text-*\` from.
 *
 * The wrapper is \`@variant light\` / \`@variant dark\` rather than \`:root\` and
 * \`.dark\` because that is the only form Uniwind reads as a theme. Both blocks
 * must declare the same names or the build fails outright.
 */
@layer theme {
	:root {
		@variant light {
${declarations(theme.light, "\t\t\t")}
		}

		@variant dark {
${declarations(theme.dark, "\t\t\t")}
		}
	}
}

@layer theme {
	:root {
		/*
		 * Split by platform rather than by theme. React Native's \`fontFamily\`
		 * takes a single family name with no fallback list, and no one name works
		 * on both platforms: iOS has Menlo and Georgia and not \`monospace\`,
		 * Android the reverse.
		 */
		@variant ios {
${fontBlock("ios")}
		}

		@variant android {
${fontBlock("android")}
		}
	}
}

@theme inline {
${aliases.join("\n")}
}
`;
}

/** shadcn's own reading order first, then whatever else the source brought. */
function orderNames(names: string[]): string[] {
	const rest = names.filter((name) => !PREFERRED_ORDER.includes(name)).sort();

	return [...PREFERRED_ORDER.filter((name) => names.includes(name)), ...rest];
}

/** A shadcn registry item — `{ cssVars: { light, dark } }`, keys without the `--`. */
function parseRegistryItem(source: string): ThemeSource | null {
	if (!source.trimStart().startsWith("{")) return null;

	let parsed: unknown;
	try {
		parsed = JSON.parse(source);
	} catch {
		return null;
	}

	if (typeof parsed !== "object" || parsed === null || !("cssVars" in parsed)) return null;
	const cssVars = (parsed as { cssVars: unknown }).cssVars;
	if (typeof cssVars !== "object" || cssVars === null) return null;

	const read = (key: string): Record<string, string> => {
		const block = (cssVars as Record<string, unknown>)[key];
		if (typeof block !== "object" || block === null) return {};

		return Object.fromEntries(
			Object.entries(block as Record<string, string>).map(([name, value]) => [
				name.startsWith("--") ? name : `--${name}`,
				value,
			])
		);
	};

	const theme = read("theme");

	return { light: { ...theme, ...read("light") }, dark: { ...theme, ...read("dark") } };
}

function stripComments(css: string): string {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * The declarations directly inside a block, ignoring anything nested in it.
 *
 * Brace-matched rather than split on the first `}`: a block holds comments,
 * functional values and — in this package's own output — further blocks, and a
 * split would silently truncate the palette to whatever came first.
 */
function blockDeclarations(css: string, selector: string): Record<string, string> {
	const declarations: Record<string, string> = {};
	const marker = new RegExp(`${escapeRegExp(selector)}\\s*\\{`, "g");

	for (const match of css.matchAll(marker)) {
		const body = blockBody(css, (match.index ?? 0) + match[0].length);
		Object.assign(declarations, topLevelDeclarations(body));
	}

	return declarations;
}

/** Everything from `start` up to the brace that closes the block it opened. */
function blockBody(css: string, start: number): string {
	let depth = 1;
	let index = start;

	while (index < css.length && depth > 0) {
		if (css[index] === "{") depth += 1;
		if (css[index] === "}") depth -= 1;
		index += 1;
	}

	return css.slice(start, index - 1);
}

/** `--name: value;` pairs at the body's own level, skipping any nested block. */
function topLevelDeclarations(body: string): Record<string, string> {
	const declarations: Record<string, string> = {};
	let depth = 0;
	let buffer = "";

	for (const character of body) {
		if (character === "{") depth += 1;
		else if (character === "}") depth = Math.max(0, depth - 1);
		else if (character === ";" && depth === 0) collect(buffer, declarations);
		else {
			buffer += character;
			continue;
		}

		buffer = "";
	}

	collect(buffer, declarations);

	return declarations;
}

function collect(buffer: string, into: Record<string, string>): void {
	const declaration = buffer.trim();
	if (!declaration.startsWith("--")) return;

	const separator = declaration.indexOf(":");
	if (separator === -1) return;

	into[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim();
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
