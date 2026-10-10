import { openBrowserAsync } from "expo-web-browser";
import { Alert, Linking } from "react-native";
import { createWebPageOpener } from "@/lib/web-page";

const open = createWebPageOpener({
	inApp: (url) => openBrowserAsync(url),
	external: (url) => Linking.openURL(url),
});

/**
 * Opens a web page without leaving the app — the one way any link here reaches
 * the web. The order of attempts and the double-tap guard are `web-page.ts`'s;
 * this file is the native half `bun test` cannot import.
 *
 * When neither browser takes the URL the alert carries it, so it can still be
 * read off the screen: a silent no-op on a control whose whole job is to open a
 * page is indistinguishable from a broken link.
 */
export async function openWebPage(url: string): Promise<void> {
	const outcome = await open(url);

	if (outcome.kind === "failed") Alert.alert("Could not open a browser", outcome.url);
}
