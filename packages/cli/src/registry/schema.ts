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
 * An item carries no file contents. `files[].path` names a sibling document in
 * the registry and the client fetches it, so a component's source lives in the
 * registry as the `.tsx` it actually is rather than as a four-thousand character
 * string inside a JSON blob nobody can review. shadcn inlines `content` here;
 * the cost of that is a megabyte of unreadable diff every time a component
 * changes, and the benefit — one request per item — is worth less than the diff.
 *
 * Written as schemas rather than types because the same documents arrive from
 * two directions: constructed by our builder, where they are already correct,
 * and fetched from a URL the user pointed at, where they are not to be trusted.
 * `add` turns `files[].path` into a document it fetches and `files[].target`
 * into a path it writes to, so the traversal checks below are guards rather
 * than formalities.
 */

/**
 * A path that cannot climb out of the directory it is resolved against.
 *
 * Split on both separators, not just `/`. On Windows `join()` treats `\` as a
 * separator too, so a `target` of `..\..\evil.ts` would survive a POSIX-only
 * check and then land outside its namespace. A drive letter is rejected for the
 * same reason `/` is: `C:\…` is absolute, and `join` honours it.
 */
function relativePathSchema(message: string) {
	return z
		.string()
		.min(1)
		.refine(
			(value) =>
				!value.startsWith("/") &&
				!value.startsWith("\\") &&
				!/^[a-zA-Z]:/.test(value) &&
				!value.split(/[\\/]/).includes(".."),
			{ message }
		);
}

const pathSchema = relativePathSchema("must be a relative path that stays inside the registry");
const targetSchema = relativePathSchema("must be a relative path that stays inside its namespace");

export const registryFileSchema = z
	.object({
		/** The file's location in the registry, e.g. `files/ui/button/button.tsx`. */
		path: pathSchema,
		/** Namespace-relative destination, e.g. `button/button.tsx`. */
		target: targetSchema,
		namespace: z.enum(NAMESPACES),
		/**
		 * Rejected, not ignored.
		 *
		 * A shadcn-shaped registry inlines the file here, and silently dropping it
		 * would leave `add` fetching a `path` that registry never meant to serve —
		 * a 404 halfway through a copy, blamed on the wrong thing. Failing at the
		 * schema says what is actually wrong.
		 *
		 * `never` rather than `undefined` because the generated JSON Schema has to
		 * say this too: it becomes `{"not": {}}`, where `undefined` has no JSON
		 * Schema at all and `z.toJSONSchema` refuses to emit the document.
		 */
		content: z.never({ error: "inline `content` is not supported; reference the file with `path` instead" }).optional(),
	})
	// Dropped from the parsed value so `content` means one thing everywhere: a
	// file that has been fetched. `LoadedFile` below is the type that has it.
	.transform(({ content: _content, ...file }) => file);

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

/** An item without its file list — enough for `list`, `search` and dependency resolution. */
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

/** A file with its document fetched. What `add` and `diff` actually write from. */
export type LoadedFile = RegistryFile & { content: string };

export type LoadedItem = Omit<RegistryItem, "files"> & { files: LoadedFile[] };

export function toIndexEntry(item: RegistryItem): RegistryIndexEntry {
	const { $schema: _schema, files, ...rest } = item;
	return { ...rest, files: files.map((file) => `${file.namespace}/${file.target}`) };
}
