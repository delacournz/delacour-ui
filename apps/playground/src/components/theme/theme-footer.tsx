import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowUpRight } from "@delacour/native-ui/icons/central";
import { Screen } from "@delacour/native-ui/screen";
import type { ReactElement } from "react";
import { Alert, Linking } from "react-native";
import { presetUrl } from "@/design-system/preset-url";
import { useDesignSystem } from "@/design-system/store";

/**
 * The way a theme leaves the phone.
 *
 * Eight axes prove the library survives someone else's brand, and until this
 * button existed that proof was a dead end — a palette you could build and then
 * only throw away. It encodes the configuration as a twelve-character code and
 * opens the documentation site, which renders the same tokens as a `globals.css`
 * with a copy button. That is the half of the job a phone cannot do.
 *
 * **It lives in `_layout.tsx`, so it sits under both tabs.** Not decoration:
 * `Screen.Footer` writes its measured height into the screen context and *both*
 * tabs' `Screen.ScrollArea`s read it, so one footer reserves its own room in
 * both with nothing said in either tab file. One per tab would be two writers on
 * one shared value, racing across a pager swipe.
 *
 * **It reads `useDesignSystem`, not `useAxisPreview`.** The link carries seven
 * axis names and no colours; the preview hook resolves every token in both modes
 * and re-runs on a theme flip, which would make this button do palette work for
 * a URL that contains no palette.
 *
 * **The reset button stays where it is**, at the end of the Design tab's scroll
 * content. It is the undo of one tab's decisions where this is the outcome of
 * the whole screen, and a destructive control that takes no confirmation should
 * not sit permanently under the thumb beside the one people came for — least of
 * all on the Preview tab, where it would act on eight decisions you cannot see.
 *
 * `placement` stays `overlay` so pages scroll under it, mirroring the tab bar
 * floating at the top. `sticky` stays off: the Preview tab has real `Input`s, so
 * a keyboard can open here, and a "Generate CSS" button riding a keyboard opened
 * by a demo field would be absurd — it should be covered, which is what off
 * means. `isFocused` is therefore not passed either, since it only gates the
 * sticky behaviour; anyone turning `sticky` on has to add it.
 */
export function ThemeFooter(): ReactElement {
	const config = useDesignSystem();

	// `openURL` rejects when nothing is registered for https — an emulator image
	// with no browser. The message body is the URL itself, so it can still be
	// read off the screen; a silent no-op on a button whose whole job is to leave
	// the app is indistinguishable from a broken encoder.
	const open = () => {
		const url = presetUrl(config);

		Linking.openURL(url).catch(() => {
			Alert.alert("Could not open a browser", url);
		});
	};

	return (
		<Screen.Footer>
			<Button haptic="medium" onPress={open} testID="theme-generate-css">
				<Button.Label>Generate CSS</Button.Label>
				<Icon icon={IconArrowUpRight} />
			</Button>
		</Screen.Footer>
	);
}
ThemeFooter.displayName = "Playground.ThemeFooter";
