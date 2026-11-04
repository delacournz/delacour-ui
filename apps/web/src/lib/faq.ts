import { COMPONENTS } from "./components";
import type { JsonLd } from "./structured-data";

export type FaqEntry = { readonly question: string; readonly answer: string };

/**
 * The landing page's FAQ, and the `FAQPage` JSON-LD built from it. One list for
 * both, because Google only honours FAQ markup that matches what a reader can
 * see — so the markup cannot say anything the page does not.
 *
 * Plain text only: an answer is quoted verbatim in a search result or by an AI
 * system, which renders no Markdown. `faq.test.ts` holds that, and holds the
 * questions to the queries the page is meant to answer.
 */
export const FAQ: readonly FaqEntry[] = [
	{
		question: "Is Delacour UI shadcn/ui for React Native?",
		answer: `Yes, in the way that matters: a CLI copies each component's source into your app, styled with Tailwind classes and painted from the same CSS variables shadcn/ui uses on the web. It is not a port of shadcn/ui's code; the ${COMPONENTS.length} components are written for iOS and Android.`,
	},
	{
		question: "Does it work with Expo and with bare React Native?",
		answer:
			"Both. Expo apps install the native peers with expo install; a React Native CLI app installs the same packages with its package manager. The installation guide has a page for each.",
	},
	{
		question: "Can I use it with NativeWind?",
		answer:
			"No. Delacour UI styles with Tailwind CSS v4 through Uniwind, and NativeWind and Uniwind cannot share one app because both compile className in Metro. Uniwind's migration guide moves an app across in a few minutes.",
	},
	{
		question: "Do I have to copy the source, or can I install a package?",
		answer:
			"Either. Install @delacour/react-native-ui and import each component from its own subpath, or run npx delacour@latest add button to own the file. delacour update later merges upstream fixes into a file you have edited.",
	},
	{
		question: "Can I reuse my shadcn web app's theme?",
		answer:
			"Yes. The token names are shadcn's, name for name. Point delacour theme at your globals.css, by path or URL, and the native app is painted from the same palette.",
	},
	{
		question: "Can coding agents like Claude Code or Cursor use it?",
		answer:
			"Yes. npx delacour@latest mcp runs an MCP server that lists and adds the real components, npx delacour@latest skills installs an agent skill, and every docs page is Markdown at its URL plus .md, indexed at /llms.txt.",
	},
	{
		question: "Is it free?",
		answer: "Yes. Every package and the CLI are MIT licensed, with no paid tier and no account.",
	},
];

export function faqJsonLd(): JsonLd {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: FAQ.map((entry) => ({
			"@type": "Question",
			name: entry.question,
			acceptedAnswer: { "@type": "Answer", text: entry.answer },
		})),
	};
}
