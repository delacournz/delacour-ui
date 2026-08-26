import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Preview } from "@/components/preview";
import { PreviewGrid } from "@/components/preview-grid";

/**
 * `defaultMdxComponents` already carries `Callout`, `Card` and `Cards`. The rest
 * are opt-in — an MDX file naming one that is not registered here fails the
 * render with "Expected component X to be defined" rather than degrading.
 */
export function getMDXComponents(components?: MDXComponents) {
	return {
		...defaultMdxComponents,
		Accordion,
		Accordions,
		File,
		Files,
		Folder,
		Preview,
		PreviewGrid,
		Step,
		Steps,
		Tab,
		Tabs,
		TypeTable,
		...components,
	} satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
	type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
