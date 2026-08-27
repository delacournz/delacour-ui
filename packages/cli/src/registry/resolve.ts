/**
 * Expands the items a user asked for into everything that has to be copied
 * with them, dependencies first.
 *
 * `add button` is really "copy button, and the icon, pressable and spinner it
 * renders, and the `tv` those need, and the tokens `tv` reads". Nothing here
 * installs anything — these are files to copy, which is the distinction the
 * registry keeps between `registryDependencies` and the two npm lists.
 */

export type ResolvableItem = {
	registryDependencies: string[];
};

export type ItemLookup = (name: string) => ResolvableItem | undefined;

export class UnknownItemError extends Error {
	constructor(
		readonly item: string,
		readonly requiredBy?: string
	) {
		super(
			requiredBy
				? `"${item}" is not in the registry, and is required by "${requiredBy}". The registry may be newer than this CLI — try \`--ref main\`.`
				: `"${item}" is not in the registry. Run \`delacour list\` to see what is available.`
		);
		this.name = "UnknownItemError";
	}
}

/**
 * Depth-first post-order, so a dependency is always written before the file
 * that imports it.
 *
 * `visiting` guards a cycle. The registry should not contain one —
 * `native-ui`'s own rules forbid the import shape that would create it — but a
 * third-party registry can, and recursing forever is a worse failure than
 * emitting the item once and moving on.
 */
export function resolveItemGraph(names: readonly string[], lookup: ItemLookup): string[] {
	const order: string[] = [];
	const done = new Set<string>();
	const visiting = new Set<string>();

	const visit = (name: string, requiredBy?: string): void => {
		if (done.has(name) || visiting.has(name)) return;

		const item = lookup(name);
		if (!item) throw new UnknownItemError(name, requiredBy);

		visiting.add(name);
		for (const dependency of item.registryDependencies) visit(dependency, name);
		visiting.delete(name);

		done.add(name);
		order.push(name);
	};

	for (const name of names) visit(name);

	return order;
}
