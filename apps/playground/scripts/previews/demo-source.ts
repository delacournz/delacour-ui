/**
 * Reads a demo file as text: its `meta`, and the snippet published beside its
 * media.
 *
 * Nothing here imports a demo. It cannot — a demo imports `react-native`, whose
 * Flow-typed source Bun's transpiler will not parse, which is the same reason
 * `bun test` in the library covers pure logic only. So `meta` is evaluated from
 * the AST rather than executed, and the constraint that makes that safe is that
 * `meta` may only hold literals.
 */

import ts from "typescript";

/** What a demo may reach for. Anything else and the published snippet would not compile. */
const ALLOWED_IMPORT_PREFIXES = [
	"@delacour/native-ui",
	"react",
	"react-native",
	"@gorhom/bottom-sheet",
	"@legendapp/list",
	"react-native-gesture-handler",
];

/** The one project-local import a demo may make, and the one the snippet drops. */
const TYPES_IMPORT = "@/demos/types";

export type DemoCaptureMeta = {
	frame?: "stage" | "device";
	align?: "center" | "stretch";
	flow?: string;
	leadMs?: number;
	tailMs?: number;
	hero?: boolean;
};

export type DemoFileMeta = {
	title: string;
	caption?: string;
	note?: string;
	capture?: DemoCaptureMeta;
	keyboardAware?: boolean;
};

export type DemoSource = {
	meta: DemoFileMeta;
	/** The file, minus its `meta` block and the types import. Published verbatim. */
	code: string;
};

type Literal = string | number | boolean | Literal[] | { [key: string]: Literal };

function parse(path: string, text: string): ts.SourceFile {
	return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

/**
 * Turns an object-literal AST node into the value it denotes.
 *
 * Deliberately refuses anything that is not a literal. A `meta` that called a
 * function or read a variable could not be evaluated without running the
 * module, and running the module is exactly what is impossible here — so the
 * restriction is not a shortcut, it is the contract.
 */
function evaluate(node: ts.Expression, path: string): Literal {
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
	if (ts.isNumericLiteral(node)) return Number(node.text);
	if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
	if (node.kind === ts.SyntaxKind.FalseKeyword) return false;

	if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
		const inner = evaluate(node.operand, path);
		if (typeof inner !== "number") throw new Error(`${path}: negated a non-number in meta`);
		return -inner;
	}

	if (ts.isArrayLiteralExpression(node)) {
		return node.elements.map((element) => evaluate(element, path));
	}

	if (ts.isObjectLiteralExpression(node)) {
		const value: { [key: string]: Literal } = {};
		for (const property of node.properties) {
			if (!ts.isPropertyAssignment(property) || !property.name) {
				throw new Error(`${path}: meta may only hold plain \`key: value\` pairs`);
			}
			const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : null;
			if (key === null) throw new Error(`${path}: meta has a computed key`);
			value[key] = evaluate(property.initializer, path);
		}
		return value;
	}

	if (ts.isAsExpression(node)) return evaluate(node.expression, path);

	throw new Error(
		`${path}: meta must be literals only — found ${ts.SyntaxKind[node.kind]}. ` +
			"Move anything computed into the Demo component."
	);
}

/** The `export const meta = { … }` statement, which the contract pins as the second thing in the file. */
function findMeta(source: ts.SourceFile, path: string): ts.VariableStatement {
	for (const statement of source.statements) {
		if (!ts.isVariableStatement(statement)) continue;
		const [declaration] = statement.declarationList.declarations;
		if (declaration && ts.isIdentifier(declaration.name) && declaration.name.text === "meta") return statement;
	}
	throw new Error(`${path}: no \`export const meta\` — every demo declares one`);
}

/**
 * Fails on an import the published snippet could not resolve.
 *
 * This is the rule that makes a snippet worth publishing. A demo reaching for
 * `@/components/section` still renders perfectly in the playground, so nothing
 * else would ever catch it — and the snippet would land in the documentation
 * as code that cannot compile in the reader's app.
 */
function checkImports(source: ts.SourceFile, path: string): void {
	for (const statement of source.statements) {
		if (!ts.isImportDeclaration(statement)) continue;
		if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;

		const specifier = statement.moduleSpecifier.text;
		if (specifier === TYPES_IMPORT) continue;
		if (ALLOWED_IMPORT_PREFIXES.some((prefix) => specifier === prefix || specifier.startsWith(`${prefix}/`))) {
			continue;
		}

		throw new Error(
			`${path}: imports "${specifier}", which the published snippet could not resolve. ` +
				`A demo may import only ${ALLOWED_IMPORT_PREFIXES.join(", ")} and ${TYPES_IMPORT}.`
		);
	}
}

/** Cuts the byte ranges out of `text`, last first so earlier offsets stay valid. */
function excise(text: string, ranges: readonly [number, number][]): string {
	return [...ranges]
		.sort((a, b) => b[0] - a[0])
		.reduce((acc, [start, end]) => acc.slice(0, start) + acc.slice(end), text);
}

export async function readDemoSource(path: string): Promise<DemoSource> {
	const text = await Bun.file(path).text();
	const source = parse(path, text);

	checkImports(source, path);

	const metaStatement = findMeta(source, path);
	const [declaration] = metaStatement.declarationList.declarations;
	if (!declaration?.initializer) throw new Error(`${path}: meta has no value`);

	const meta = evaluate(declaration.initializer, path) as unknown as DemoFileMeta;
	if (typeof meta.title !== "string" || meta.title.length === 0) {
		throw new Error(`${path}: meta.title is required`);
	}

	// Splice, never re-print. `ts.createPrinter` would reformat the whole file —
	// different indentation, different wrapping, different JSX line breaks — so
	// the published snippet would not match the file on disk that a reader is
	// told is its source. `getFullStart` takes the leading trivia with it, so a
	// doc comment on `meta` goes when `meta` does.
	const cuts: [number, number][] = [[metaStatement.getFullStart(), metaStatement.getEnd()]];

	for (const statement of source.statements) {
		if (!ts.isImportDeclaration(statement)) continue;
		if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
		if (statement.moduleSpecifier.text !== TYPES_IMPORT) continue;
		cuts.push([statement.getFullStart(), statement.getEnd()]);
	}

	const code = `${excise(text, cuts).replace(/\n{3,}/g, "\n\n").trim()}\n`;

	return { code, meta };
}

/**
 * The demo slugs a component's barrel lists, in the order it lists them.
 *
 * The barrel is the one editorial artefact in the pipeline — it is where
 * somebody decided the Switch gallery opens with the gesture — so the manifest
 * reads that order rather than inventing one. Read as text for the same reason
 * a demo is: importing the barrel would pull in every demo it names.
 */
export async function readGroupOrder(barrelPath: string): Promise<string[]> {
	const text = await Bun.file(barrelPath).text();
	const source = parse(barrelPath, text);
	const slugs: string[] = [];

	const visit = (node: ts.Node): void => {
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			node.expression.text === "defineDemoGroup"
		) {
			const [, modules] = node.arguments;
			if (modules && ts.isObjectLiteralExpression(modules)) {
				for (const property of modules.properties) {
					const name = property.name;
					if (!name) continue;
					if (ts.isIdentifier(name) || ts.isStringLiteral(name)) slugs.push(name.text);
				}
			}
		}
		ts.forEachChild(node, visit);
	};

	visit(source);
	return slugs;
}
