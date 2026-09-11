import "../styles/global.css";
import { NavigationTheme } from "delacour-react-native-ui/expo/navigation-theme";
import { useThemeColor } from "delacour-react-native-ui/hooks/use-theme-color";
import { DelacourProvider } from "delacour-react-native-ui/provider";
import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { ThemeTrigger } from "@/components/theme/theme-trigger";
import { restoreDesignSystem } from "@/design-system/store";

/**
 * The stored design system, applied before anything renders.
 *
 * At module scope, not in an effect: MMKV reads synchronously, so the restored
 * palette, geometry and typeface are already in Uniwind's variable store for
 * the first paint. In an effect this would render one frame of the library's
 * own look and then repaint, on every cold start. It runs after the global.css
 * import above, which is what registers the themes it writes into.
 */
restoreDesignSystem();

/**
 * Paints the native root view — the layer beneath the whole React tree.
 *
 * `app.config.ts` can only carry one static `backgroundColor`, so it cannot
 * follow a theme the user changes at runtime. This does, keyed on the same
 * token every screen paints itself with.
 *
 * It is a belt to `NavigationTheme`'s braces: that fixes the layer between
 * cards, this fixes anything further back — a bounce past the end of a modal,
 * or the moment before the first screen mounts.
 */
function SystemBackground(): null {
	const background = useThemeColor("background");

	useEffect(() => {
		if (!background) return;
		void SystemUI.setBackgroundColorAsync(background);
	}, [background]);

	return null;
}

/**
 * DIRECTION CONTRACT — DLC-BRAND-01, seed 4a705b78 (pinned by the user to delacour.co.nz).
 *
 * A native app has no HTML body to carry this in, so the root layout's doc
 * comment is the artifact the build re-opens. It is the same contract
 * `apps/web/src/routes/__root.tsx` carries as an HTML comment.
 *
 * THESIS: Delacour UI is the studio's own site continued into its component
 * library: one black ground, one amber, one reading column. It refuses the
 * wide grey docs hero with a glow behind it.
 *
 * OWN-WORLD: black page, zinc-900 surfaces, zinc-800 hairlines, #fafafa text,
 * amber #fbbf24 for every interactive and every marker; Outfit 600 tight
 * headings over Inter body, Geist Mono code; 8px corners, 1.8x cards, fully
 * round pills; a faint particle-dot field under everything.
 *
 * STORY: a React Native developer recognises the studio, reads one column top
 * to bottom, sees real phone captures, copies one command, and tries it on
 * their phone.
 *
 * FIRST VIEWPORT: floating pill nav; a single 36rem column; the mark, then the
 * headline (copy unchanged) in Outfit at 48/56, the lede in zinc-400, one
 * amber pill CTA and one ghost CTA, the install tabs as the single calm card;
 * the phone capture sits to the right only above 1024px.
 *
 * FORM: pinned by the user to the studio site; seed 4a705b78 spent; code-led.
 *
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 * finish review, the verdict, DESIGN.md, and every shipping raster carrying
 * its provenance.
 *
 * ON THE PHONE the contract is read through the platform: the house reaches
 * this app as `HOUSE_CONFIG` — zinc, the `delacour` amber, Inter under Outfit,
 * a small corner — applied through the design system's own axes and nothing
 * else. Structure, navigation and controls stay native (HIG on iOS, Material
 * on Android): the library's own `Screen.Navbar`, 44pt targets, the edge-swipe
 * back, crossfades that are opacity only so Reduce Motion has nothing to
 * object to. No particle field, no floating pill, nothing web-shaped.
 */

/**
 * The global.css import must stay the first statement, and must live here
 * rather than in the registered root entry — importing it from index.ts breaks
 * Uniwind's hot reload and forces a full reload on every edit.
 *
 * DelacourProvider is delacour-react-native-ui's whole root stack: the gesture root
 * every Pressable needs above it, the safe-area provider seeded with
 * initialWindowMetrics so the first frame is not blank, the keyboard provider
 * Screen reads to move its footer, and the KeyboardStateSync that repairs the
 * one pair of animation values that provider shares with the whole app.
 *
 * NavigationTheme hands the navigator the same tokens, which is what keeps the
 * container behind a screen transition from being React Navigation's own pale
 * default.
 *
 * `ThemeTrigger` floats over the `Stack`, and is mounted here rather than per
 * screen so that every route has it without each one remembering to. It gates
 * itself off `/preview` and `/theme` by pathname, which is only possible from
 * up here — see `theme-trigger.tsx` for both reasons.
 *
 * Deliberately mounted with no props: the defaults are what a consuming app
 * gets, so a regression in one of them shows up here first.
 */
export default function RootLayout() {
	return (
		<DelacourProvider>
			<SystemBackground />
			<NavigationTheme>
				<Stack screenOptions={{ headerShown: false }} />
				<ThemeTrigger />
			</NavigationTheme>
		</DelacourProvider>
	);
}
