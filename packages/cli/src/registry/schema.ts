import { z } from "zod";
import { REGISTRY_TYPES } from "./classify";
import { NAMESPACES } from "./namespaces";

/**
 * The shape of the JSON the builder emits and the `add` command consumes.
 *
 * Split three ways on purpose. `dependencies` go through the project's package
 * manager, `expoDependencies` through `expo install` so the SDK picks the
 * version, and `registryDependencies` are other items to copy rather than
 * anything to install at all — the distinction shadcn's single `dependencies`
 * field cannot make, and the one that decides whether an Expo build compiles.
 *
 * Written as schemas rather than types because the same documents arrive from
 * two directions: constructed by our builder, where they are already correct,
 * and fetched from a URL the user pointed at, where they are not to be trusted.
 * `add` turns `files[].target` into a path it writes to, so the traversal check
 * below is a guard rather than a formality.
 */

const targetSchema = z
	.string()
	.min(1)
	.refine((value) => !value.startsWith("/") && !value.split("/").includes(".."), {
		message: "must be a relative path that stays inside its namespace",
	});

export const registryFileSchema = z.object({
	/** Where the file came from, relative to `packages/native-ui/src`. Kept for `diff`. */
	path: z.string(),
	/** Namespace-relative destination, e.g. `button/button.tsx`. */
	target: targetSchema,
	namespace: z.enum(NAMESPACES),
	content: z.string(),
});

export const registryItemSchema = z.object({
	$schema: z.string().optional(),
	name: z.string().min(1),
	type: z.enum(REGISTRY_TYPES),
	title: z.string(),
	description: z.string(),
	categories: z.array(z.string()).optional(),
	/** Other registry items to copy alongside this one. */
	registryDependencies: z.array(z.string()).default([]),
	/** npm packages, installed with the project's package manager. */
	dependencies: z.array(z.string()).default([]),
	/** Packages installed with `expo install`, so the SDK resolves the version. */
	expoDependencies: z.array(z.string()).default([]),
	devDependencies: z.array(z.string()).default([]),
	files: z.array(registryFileSchema),
});

/** An item without file contents — enough for `list`, `search` and dependency resolution. */
export const registryIndexEntrySchema = registryItemSchema
	.omit({ $schema: true, files: true })
	.extend({ files: z.array(z.string()).default([]) });

export const registryIndexSchema = z.object({
	$schema: z.string().optional(),
	name: z.string(),
	homepage: z.string(),
	items: z.array(registryIndexEntrySchema),
});

export type RegistryFile = z.infer<typeof registryFileSchema>;
export type RegistryItem = z.infer<typeof registryItemSchema>;
export type RegistryIndexEntry = z.infer<typeof registryIndexEntrySchema>;
export type RegistryIndex = z.infer<typeof registryIndexSchema>;

export function toIndexEntry(item: RegistryItem): RegistryIndexEntry {
	const { $schema: _schema, files, ...rest } = item;
	return { ...rest, files: files.map((file) => `${file.namespace}/${file.target}`) };
}
