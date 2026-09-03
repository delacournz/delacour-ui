import { DEFAULT_CONFIG } from "@delacour/design-system/config";
import { Text } from "delacour-react-native-ui/text";
import { Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ReactElement, useCallback, useLayoutEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { Uniwind } from "uniwind";
import { DEMOS, type DemoId } from "@/demos/registry";
import { applyConfig } from "@/design-system/store";

type PreviewTheme = "light" | "dark";

type Bounds = { x: number; y: number; width: number; height: number };

/**
 * One demo, alone, with no chrome — the frame the capture script photographs.
 *
 * Reached only by deep link:
 * `dlc-ui-playground://preview?component=switch&demo=colours&theme=dark`
 *
 * **A flat route, not a catch-all.** Re-opening the same route with different
 * params makes React Navigation `navigate`, which merges them in place instead
 * of pushing. A capture run visits every demo in both themes; a catch-all would
 * leave a stack that deep and play a card transition on each one — a memory
 * problem, and something to wait out before every single capture. Flat plus
 * `animation: "none"` has neither. Three separate params rather than one
 * slash-bearing id, so nothing has to survive URL encoding through expo-linking.
 *
 * **A bare `View`, not a `Screen`.** `Screen` carries a measurement context its
 * parts publish into, and a preview has no parts. A plain view cannot
 * accidentally inherit safe-area arithmetic that would shift the crop.
 */
export default function Preview(): ReactElement {
	const { component, demo, theme } = useLocalSearchParams<{
		component?: string;
		demo?: string;
		theme?: string;
	}>();

	const id = `${component}/${demo}`;
	const entry = DEMOS[id as DemoId] as (typeof DEMOS)[DemoId] | undefined;
	const requested: PreviewTheme = theme === "dark" ? "dark" : "light";
	const applied = useAppliedTheme(requested);

	const [bounds, setBounds] = useState<Bounds | null>(null);
	const stage = useRef<View>(null);

	// measureInWindow rather than onLayout's own rect: the crop is taken from a
	// screenshot, so the script needs where the demo sits on the *screen*, not
	// where it sits inside its parent.
	const measure = useCallback(() => {
		stage.current?.measureInWindow((x, y, width, height) => {
			if (width > 0 && height > 0) setBounds({ height, width, x, y });
		});
	}, []);

	if (!entry || applied !== requested) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<Stack.Screen options={{ animation: "none" }} />
				<StatusBar hidden />
				{entry ? null : <Text.Caption testID="preview-missing">{`No demo at ${id}`}</Text.Caption>}
			</View>
		);
	}

	const { Demo, meta } = entry;
	// `capture.align` first, because for a captured demo it is the field that
	// describes this very stage. Falling through to `meta.align` is what keeps a
	// demo nobody captures usable when it is deep-linked by hand: without it a
	// container — a chart, a list group — shrink-wraps to its narrowest content,
	// and a chart collapses to about forty points wide.
	const stretch = (meta.capture?.align ?? meta.align) === "stretch";

	return (
		<View className="flex-1 items-center justify-center bg-background">
			<Stack.Screen options={{ animation: "none" }} />
			<StatusBar hidden />
			{bounds ? <Sentinel bounds={bounds} id={id} theme={applied} /> : null}
			<View
				className={stretch ? "w-full px-screen-gutter" : "px-screen-gutter"}
				key={`${id}:${applied}`}
				onLayout={measure}
				ref={stage}
			>
				<Demo />
			</View>
		</View>
	);
}

/**
 * Drives Uniwind's global theme from the route, and reports what actually took.
 *
 * **The default design system is forced here too.** A customized look survives
 * a restart, so without this a capture run would publish whichever palette,
 * geometry and typeface the last person happened to leave selected — the
 * documentation site quietly turning fuchsia and square because someone was
 * playing with the customizer on a simulator a week ago. `applyConfig` is
 * deliberately not `setAxis`: this repaints without touching what is stored, so
 * the app is still on the user's own configuration the next time it launches.
 *
 * A layout effect rather than a render-phase call: `Uniwind.setTheme` writes to
 * a store the whole tree subscribes to, so calling it while this component
 * renders updates other components mid-render — which React reports as
 * "cannot update a component while rendering a different component", and which
 * would put a LogBox banner along the bottom of every captured frame.
 *
 * A plain effect would be too late for the opposite reason: it runs after the
 * first paint, so the capture script could photograph a frame still in the
 * previous theme. A layout effect lands between the two.
 *
 * The theme is global rather than scoped because `SystemBackground`,
 * `NavigationTheme` and `useThemeColor` all read the global one — a
 * `ScopedTheme` here would leave the root view painted in the other palette.
 */
function useAppliedTheme(requested: PreviewTheme): PreviewTheme | null {
	const [applied, setApplied] = useState<PreviewTheme | null>(null);

	useLayoutEffect(() => {
		applyConfig(DEFAULT_CONFIG);
		Uniwind.setTheme(requested);
		setApplied(requested);
	}, [requested]);

	return applied;
}

/**
 * The capture script's gate, and its crop rect.
 *
 * A one-pixel view in the background colour, in the corner, outside anything
 * that gets cropped. Its accessibility label names the demo, the theme, where
 * the demo actually landed on screen, and the window it landed in.
 *
 * The identity half is what stops a deep link that silently failed to navigate
 * from photographing the previous demo under the next demo's filename — the
 * kind of mistake whose first symptom is wrong pictures in published
 * documentation.
 *
 * The geometry half is what removes per-demo crop tuning. The alternative was a
 * fixed aspect ratio per demo, guessed by hand and re-guessed every time a
 * demo's content changed height — and a guess that is slightly wrong does not
 * fail, it silently clips the top and bottom off the component.
 *
 * It renders only once the measurement exists, so the gate cannot open on a
 * frame whose bounds are unknown.
 */
function Sentinel({ bounds, id, theme }: { bounds: Bounds; id: string; theme: string }): ReactElement {
	const window = Dimensions.get("window");
	const round = (value: number): number => Math.round(value);
	const rect = [round(bounds.x), round(bounds.y), round(bounds.width), round(bounds.height)].join(",");
	const size = `${round(window.width)}x${round(window.height)}`;

	return (
		<View
			accessibilityLabel={`preview-ready:${id}:${theme}:${rect}:${size}`}
			accessible
			className="absolute left-0 top-0 h-px w-px bg-background"
		/>
	);
}
