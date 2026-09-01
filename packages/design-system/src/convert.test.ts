import { describe, expect, test } from "bun:test";
import { convertTheme, parseTheme } from "./convert";

const SHADCN = `
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
}

@theme inline {
  --color-background: var(--background);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-lg: var(--radius);
}
`;

describe("parseTheme", () => {
	test("reads :root as light and .dark as dark", () => {
		const source = parseTheme(SHADCN);

		expect(source.light["--background"]).toBe("oklch(1 0 0)");
		expect(source.dark["--background"]).toBe("oklch(0.145 0 0)");
	});

	test("ignores the @theme inline aliases, which say nothing a theme did not", () => {
		expect(parseTheme(SHADCN).light["--color-background"]).toBeUndefined();
	});

	// Running the command twice must not mangle its own output.
	test("reads a file already in this package's shape", () => {
		const source = parseTheme(`
			@layer theme {
				:root {
					@variant light { --background: oklch(1 0 0); }
					@variant dark { --background: oklch(0.145 0 0); }
				}
			}
		`);

		expect(source.light["--background"]).toBe("oklch(1 0 0)");
		expect(source.dark["--background"]).toBe("oklch(0.145 0 0)");
	});

	test("reads a shadcn registry item's cssVars", () => {
		const source = parseTheme(
			JSON.stringify({
				name: "t",
				cssVars: { light: { background: "oklch(1 0 0)" }, dark: { background: "oklch(0 0 0)" } },
			})
		);

		expect(source.light["--background"]).toBe("oklch(1 0 0)");
		expect(source.dark["--background"]).toBe("oklch(0 0 0)");
	});

	test("survives comments and nested blocks", () => {
		const source = parseTheme(`
			/* --background: NOT-THIS; */
			:root { --background: oklch(1 0 0); }
			.dark { --background: oklch(0 0 0); }
		`);

		expect(source.light["--background"]).toBe("oklch(1 0 0)");
	});

	test("throws when it finds no palette at all", () => {
		expect(() => parseTheme("body { color: red; }")).toThrow();
	});
});

describe("convertTheme", () => {
	const result = convertTheme(parseTheme(SHADCN));

	test("wraps the palette in the variants Uniwind actually reads", () => {
		expect(result.css).toContain("@variant light {");
		expect(result.css).toContain("@variant dark {");
		expect(result.css).not.toContain(".dark {");
	});

	test("carries the source's own values through untouched", () => {
		expect(result.css).toContain("--destructive: oklch(0.577 0.245 27.325);");
		expect(result.css).toContain("--destructive: oklch(0.704 0.191 22.216);");
		expect(result.carried).toContain("--destructive");
	});

	test("aliases every colour so a utility exists for it", () => {
		expect(result.css).toContain("--color-destructive: var(--destructive);");
		expect(result.css).toContain("--color-background: var(--background);");
	});

	// `--radius` is a length, not a colour: aliasing it into the colour
	// namespace would mint a `bg-radius` and no `rounded-*` at all.
	test("leaves a scalar out of the colour namespace", () => {
		expect(result.css).not.toContain("--color-radius:");
		expect(result.css).toContain("--radius: 0.625rem;");
	});

	test("fills in the tokens this package needs and shadcn does not name", () => {
		for (const token of ["--elevated", "--tertiary", "--overlay", "--success", "--destructive-soft"]) {
			expect(result.derived).toContain(token);
			expect(result.css).toContain(`${token}:`);
		}
	});

	test("derives a soft tint from the source's own colour, not from a default", () => {
		expect(result.css).toContain("--destructive-soft: color-mix(in oklch, var(--destructive) 8%, var(--background));");
	});

	// Uniwind refuses to build a theme declaring a variable the other one does
	// not — and a shadcn theme routinely omits from `.dark` what it set in `:root`.
	test("declares the same names in both variants", () => {
		const block = (variant: string) => {
			const start = result.css.indexOf(`@variant ${variant} {`);
			return result.css.slice(start, result.css.indexOf("\n\t\t}", start));
		};
		const light = block("light");
		const dark = block("dark");
		const names = (block: string) => [...block.matchAll(/^\s*(--[\w-]+):/gm)].map(([, name]) => name).sort();

		expect(names(light)).toEqual(names(dark));
	});

	test("takes the first family out of a font stack, and says so", () => {
		expect(result.css).toContain('--font-sans: "Inter";');
		expect(result.warnings.join(" ")).toContain("--font-sans");
	});

	test("splits the platform defaults when a stack names no real family", () => {
		const generic = convertTheme(
			parseTheme(
				":root { --background: oklch(1 0 0); --font-mono: ui-monospace, monospace; }\n.dark { --background: oklch(0 0 0); }"
			)
		);

		expect(generic.css).toContain('--font-mono: "Menlo";');
		expect(generic.css).toContain('--font-mono: "monospace";');
	});

	// The corner scale here is derived from `--radius` alone; carrying a
	// source's own steps would fight `tokens.css` and pin them at one size.
	test("drops a source's derived radius steps and keeps --radius", () => {
		expect(result.css).not.toContain("--radius-sm:");
		expect(result.css).not.toContain("--radius-lg:");
		expect(result.warnings.join(" ")).toContain("--radius-sm");
	});

	test("carries a shadow through for a consumer's own use", () => {
		expect(result.css).toContain("--shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10);");
		expect(result.css).toContain("--shadow-sm: var(--shadow-sm);");
	});

	test("is idempotent — converting its own output changes nothing", () => {
		expect(convertTheme(parseTheme(result.css)).css).toBe(result.css);
	});
});

describe("a source missing something the palette needs", () => {
	// A derived token is an expression over the source's own colours. Pointed at
	// a name the source never declared it resolves to nothing, and the component
	// painting with it draws nothing — in one theme, silently.
	test("says which names nothing declares", () => {
		const result = convertTheme(
			parseTheme(":root { --background: oklch(1 0 0); }\n.dark { --background: oklch(0 0 0); }")
		);

		const warning = result.warnings.join(" ");
		expect(warning).toContain("--destructive");
		expect(warning).toContain("--muted-foreground");
	});

	test("says nothing when the source is complete", () => {
		const complete = convertTheme(parseTheme(SHADCN));
		expect(complete.warnings.join(" ")).not.toContain("nothing declares");
	});
});
