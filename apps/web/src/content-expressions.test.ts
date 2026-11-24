import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Program } from "estree";
import type { Root } from "mdast";
import { remark } from "remark";
import remarkMdx from "remark-mdx";
import { visit } from "unist-util-visit";

/**
 * No page reads a name it never declared.
 *
 * MDX treats `{…}` in prose as a JavaScript expression, so `"Remove {label}"` compiles to a
 * reference to a `label` the page never defines. The server render survives it, the client
 * render throws `ReferenceError: label is not defined`, and the page in production shows
 * nothing but "Something went wrong!" — which is how Combobox shipped. Nothing else catches
 * it: `tsc` never sees MDX and the build succeeds.
 *
 * Every `{…}` expression outside a JSX attribute must use only names the page imports or
 * exports, or a known global. Write a placeholder in prose as inline code — `` `{label}` `` —
 * which MDX leaves as text.
 */

const CONTENT_DIR = join(import.meta.dirname, "..", "content");

const GLOBALS = new Set([
	"undefined",
	"NaN",
	"Infinity",
	"Math",
	"JSON",
	"Object",
	"Array",
	"String",
	"Number",
	"Date",
]);

type Page = { path: string; body: string };

function pagesIn(dir: string): Page[] {
	return readdirSync(dir, { recursive: true, encoding: "utf-8" })
		.filter((name) => name.endsWith(".mdx"))
		.sort()
		.map((name) => ({ path: relative(CONTENT_DIR, join(dir, name)), body: readFileSync(join(dir, name), "utf-8") }));
}

/** Names an `import` or `export` in the page binds. */
function declaredNames(esm: Program): string[] {
	return esm.body.flatMap((statement) => {
		if (statement.type === "ImportDeclaration") return statement.specifiers.map((s) => s.local.name);
		if (statement.type !== "ExportNamedDeclaration" || statement.declaration == null) return [];
		const declaration = statement.declaration;
		if (declaration.type === "VariableDeclaration") {
			return declaration.declarations.flatMap((d) => (d.id.type === "Identifier" ? [d.id.name] : []));
		}
		return declaration.id == null ? [] : [declaration.id.name];
	});
}

/** The identifier an expression statement starts from — `label` in `label` or `label.text`. */
function rootIdentifier(program: Program): string | null {
	const [statement] = program.body;
	if (statement?.type !== "ExpressionStatement") return null;
	let node = statement.expression;
	while (node.type === "MemberExpression" && node.object.type !== "Super") node = node.object;
	return node.type === "Identifier" ? node.name : null;
}

/** Every prose `{name}` whose name the page never declared, as `line: {source}`. */
function undeclared(body: string): string[] {
	const tree = remark().use(remarkMdx).parse(body) as Root;
	const declared = new Set<string>();
	visit(tree, "mdxjsEsm", (node) => {
		if (node.data?.estree) for (const name of declaredNames(node.data.estree)) declared.add(name);
	});
	const found: string[] = [];
	visit(tree, ["mdxTextExpression", "mdxFlowExpression"], (node) => {
		if (node.type !== "mdxTextExpression" && node.type !== "mdxFlowExpression") return;
		const estree = node.data?.estree;
		if (estree == null) return;
		const name = rootIdentifier(estree);
		if (name != null && !declared.has(name) && !GLOBALS.has(name)) {
			found.push(`${node.position?.start.line ?? "?"}: {${node.value}}`);
		}
	});
	return found;
}

const PAGES = pagesIn(CONTENT_DIR);

describe("MDX expressions", () => {
	test("the walker finds pages", () => {
		expect(PAGES.length).toBeGreaterThan(10);
	});

	test("flags a bare placeholder in prose", () => {
		expect(undeclared('The remove control is labelled "Remove {label}".')).toEqual(["1: {label}"]);
	});

	test("allows inline code, comments and declared names", () => {
		const body = 'import { Note } from "./note";\n\nLabelled "Remove `{label}`". {/* aside */} {Note}';
		expect(undeclared(body)).toEqual([]);
	});

	for (const page of PAGES) {
		test(page.path, () => {
			expect(undeclared(page.body)).toEqual([]);
		});
	}
});
