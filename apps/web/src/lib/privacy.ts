import { gitConfig } from "./shared";

/**
 * The privacy policy, as data.
 *
 * Every claim here is about code somewhere else in the repository — a package
 * the app installs, a host the site loads from, a URL the CLI fetches — so it
 * lives apart from the page that renders it, for the same reason
 * `comparison.ts` does: `privacy.test.ts` can read it. That test holds each
 * disclosure that names a package to the package being installed, and each
 * installed package known to phone home to a disclosure naming it.
 *
 * Inline code and links use the landing copy's two marks, `` `code` `` and
 * `[text](url)`, which `rich-text.tsx` renders.
 *
 * Change `updated` with anything a reader would care about. The file's history
 * is public and the page links to it, which is the changelog.
 */

/** An app in this repository whose `package.json` a disclosure can name. */
export type SourceApp = "playground" | "web";

/** One thing that leaves a device, or stays on it. */
export type Disclosure = {
	/** What is sent or stored, in the reader's words. */
	what: string;
	/** Who receives it — a company, our own server, or the reader's own device. */
	to: string;
	/** Why, and for how long where that is known. */
	why: string;
	/** The dependency that sends it, when one does. `privacy.test.ts` holds it to `package.json`. */
	source?: { app: SourceApp; package: string };
};

export type PrivacySection = {
	/** The anchor, so a link or a screenshot can land on one section. */
	id: string;
	title: string;
	/** Prose before the table. */
	body: readonly string[];
	disclosures?: readonly Disclosure[];
	/** Prose after the table. */
	after?: readonly string[];
};

const CONTACT = "chris@delacour.co.nz";
const MAIL = `[${CONTACT}](mailto:${CONTACT})`;
const HISTORY = `https://github.com/${gitConfig.user}/${gitConfig.repo}/commits/${gitConfig.branch}/apps/web/src/lib/privacy.ts`;

export const PRIVACY = {
	updated: "2026-09-22",
	controller: "Delacour Limited",
	contact: CONTACT,
	eyebrow: "Privacy",
	title: "Privacy policy",
	description:
		"What the Delacour UI website, app and CLI send, where it goes and why. No accounts, no adverts, no tracking across other apps or sites.",
	lede: "Delacour UI is a component library, the site that documents it, an app for trying the components on a phone, and a command-line tool that copies them into your project. None of them has accounts, adverts or tracking across other companies' apps and sites. This page lists everything that leaves your device, where it goes and why.",
	glance: [
		"No accounts, sign-in or profiles. Nothing we receive has your name or email address on it.",
		"No adverts, no tracking across other companies' apps or websites, and nothing is sold.",
		"The app tells Expo each time it starts, and asks Expo whether there is an update.",
		"The website loads its fonts from Google, and sets no cookies.",
		"Your settings — the site's light or dark choice, the app's theme — stay on your device.",
	],
} as const;

export const PRIVACY_SECTIONS: readonly PrivacySection[] = [
	{
		id: "who-we-are",
		title: "Who we are",
		body: [
			`${PRIVACY.controller}, a company registered in New Zealand, runs \`ui.delacour.co.nz\`, the Delacour UI app and the \`delacour\` command-line tool, and is responsible for the personal information they handle. Write to ${MAIL} about anything on this page.`,
			"This page covers Delacour UI only. The studio site, `delacour.co.nz`, has [its own policy](https://delacour.co.nz/privacy).",
		],
	},
	{
		id: "the-website",
		title: "The website",
		body: [
			"`ui.delacour.co.nz` has no analytics, no tracking scripts and no cookies. Loading a page still involves two parties besides you.",
		],
		disclosures: [
			{
				what: "Each request: your IP address, your browser's user agent, the address of the page — including any `?preset=` theme code in it — and the time",
				to: "Railway, which hosts the site",
				why: "To serve the page and keep the site running. Railway keeps these request logs for a limited period set by its plan.",
			},
			{
				what: "Font requests: your IP address, your browser's user agent and the page they came from",
				to: "Google Fonts — `fonts.googleapis.com` and `fonts.gstatic.com`",
				why: "To draw the site's typefaces. The theme builder at `/theme` loads more families when you try its Font axis.",
			},
			{
				what: "What you type into search",
				to: "Our own server",
				why: "Answered from an index held in memory. We do not store or log it.",
			},
			{
				what: "Your light or dark choice, and scroll positions",
				to: "Your browser's local and session storage",
				why: "So the site remembers them. They are never sent to us.",
			},
		],
		after: [
			"A documentation page's Open menu can send that page to ChatGPT, Claude, Cursor or Scira. Nothing is sent unless you choose one, and then that service's own policy applies.",
		],
	},
	{
		id: "the-app",
		title: "The app",
		body: [
			"The Delacour UI app has no account and asks for no permissions — no camera, photos, contacts, location or notifications. Each time it starts, it makes two requests to Expo, the company whose tools it is built with.",
		],
		disclosures: [
			{
				what: "A launch ping: a random install ID, the app version, the platform (iOS or Android) and the operating system version",
				to: "Expo — EAS Insights, `i.expo.dev`",
				why: "To count how many installs open the app, and on which versions.",
				source: { app: "playground", package: "expo-insights" },
			},
			{
				what: "An update check: the same install ID, the platform and the app's build and release identifiers. If the app crashed the last time it ran, the crash's error message goes with it",
				to: "Expo — EAS Update, `u.expo.dev`",
				why: "To deliver fixes without a new store release, and to roll back an update that crashes.",
				source: { app: "playground", package: "expo-updates" },
			},
			{
				what: "The theme you build in the customiser, and your light or dark choice",
				to: "Your device only",
				why: "So the app opens the way you left it. Deleting the app deletes them.",
			},
		],
		after: [
			"The install ID is a random number the app makes the first time it runs. It is not your name, your email address or your device's advertising identifier, and it is not linked to any of them. Deleting the app discards it, and reinstalling makes a new one.",
			"The app cannot ask before sending the launch ping: it goes out as the app starts, before anything is on screen. There is no setting that turns it off. If you would rather it were not sent, the way to stop it is to delete the app.",
			"Two buttons open the website in your browser — Generate CSS, which puts your theme into the page address as a short code, and Privacy policy, which opens this page. The website section above then applies.",
			"If you have chosen to share analytics with app developers in your device's settings, Apple or Google may also show us summary statistics about the app, such as crash counts. Their policies cover that sharing, and you can turn it off there.",
		],
	},
	{
		id: "the-cli",
		title: "The command-line tool",
		body: ["The `delacour` CLI collects no telemetry. It only makes the requests its commands need."],
		disclosures: [
			{
				what: "Requests for component source: your IP address and the files requested",
				to: "GitHub — `raw.githubusercontent.com` — or a registry you configure",
				why: "To download the components you asked it to add.",
			},
			{
				what: "Package installs",
				to: "npm, or whichever registry your package manager uses",
				why: "The CLI runs your own package manager, which makes these requests under its own policy.",
			},
			{
				what: "Downloaded component source",
				to: "A cache in your home folder, `~/.cache/delacour`",
				why: "So a second run does not download the same files again. Delete the folder at any time.",
			},
		],
	},
	{
		id: "who-else",
		title: "Who else handles it",
		body: [
			"The companies above process this information for us under their own terms. They are based in the United States, so it is processed there:",
			"[Expo](https://expo.dev/privacy) for the app's launch pings and updates, [Railway](https://railway.com/legal/privacy) for hosting the website, [Google](https://policies.google.com/privacy) for its fonts, and [GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement) for the CLI's downloads.",
			"We do not sell or rent anything to anyone, and we do not share it with anyone else unless the law requires us to.",
		],
	},
	{
		id: "why",
		title: "Why we use it",
		body: [
			"Only to run the website, the app and the CLI, to count how many people use them and on which versions, and to fix what breaks. We do not combine it with anything else, and we do not use it to identify, profile or advertise to anyone.",
			"If UK or EU data protection law applies to you, our lawful basis is our legitimate interest in running and improving these services, which we have weighed against your interests given how little is collected.",
		],
	},
	{
		id: "how-long",
		title: "How long it is kept",
		body: [
			"What stays on your device is there until you clear it or delete the app. Railway, Expo and Google keep what they receive for the periods their own policies set, linked above. We keep no copies of our own.",
		],
	},
	{
		id: "your-rights",
		title: "Your rights",
		body: [
			`Under New Zealand's Privacy Act 2020 you can ask to see personal information we hold about you and to have it corrected. If you are in the UK or the EU you can also ask us to delete it, to restrict or object to how it is used, or to give you a copy. Write to ${MAIL}.`,
			"Nothing we receive has your name on it, so we may not be able to find information about you in particular. Deleting the app is the surest way to stop it sending anything.",
			"If you are unhappy with how we have handled a request, you can complain to New Zealand's [Office of the Privacy Commissioner](https://www.privacy.org.nz), the UK's [Information Commissioner's Office](https://ico.org.uk/make-a-complaint/) or the data protection authority where you live.",
		],
	},
	{
		id: "children",
		title: "Children",
		body: [
			"Delacour UI is a tool for software developers and is not directed at children. We do not knowingly collect information from anyone under 16.",
		],
	},
	{
		id: "changes",
		title: "Changes to this page",
		body: [
			`When this page changes, the date at the top changes with it. Every earlier version is public in [the repository's history](${HISTORY}).`,
		],
	},
];
