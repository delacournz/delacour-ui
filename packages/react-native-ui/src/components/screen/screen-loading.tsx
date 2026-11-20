import type { ReactElement } from "react";
import { View } from "react-native";
import { useAnnouncement } from "../../hooks/use-announce";
import { Spinner } from "../spinner";
import { resolveScreenLoadingLabel, screenVariants } from "./screen.variants";
import { ScreenContent } from "./screen-content";
import { ScreenNavbar } from "./screen-navbar";
import { ScreenRoot } from "./screen-root";

export type ScreenLoadingProps = {
	/** Title for the navbar, if the screen shows one. */
	title?: string;
	/** Back handler. Omit it and the navbar renders without a back control. */
	onBack?: () => void;
	/** Show the navbar at all. On by default, so the frame does not shift when the content arrives. */
	showNavbar?: boolean;
	/** What the screen is loading, as a screen reader names and announces it. Defaults to "Loading". */
	label?: string;
	/** Speak the label when the screen appears. On by default; `false` leaves the busy spinner silent until focused. */
	announce?: boolean;
};

/**
 * A whole screen showing a spinner — the placeholder a route renders while its
 * data is in flight.
 *
 * Keeps the navbar by default so the frame does not jump when the real content
 * replaces it, and so the user can still go back out of a slow load.
 *
 * A screen reader hears the label once when it appears, through one route per platform. The spinner
 * is the screen's single named, busy stop, so the label is read once on focus and not twice.
 * Settling into content or `Screen.Error` unmounts this, which drops any speech still pending.
 *
 * @example
 * if (isPending) return <Screen.Loading onBack={() => router.back()} title="Settings" />;
 */
export function ScreenLoading({
	title,
	onBack,
	showNavbar = true,
	label,
	announce = true,
}: ScreenLoadingProps): ReactElement {
	const name = resolveScreenLoadingLabel(label);
	const { accessibilityLiveRegion } = useAnnouncement(name, {
		channel: "announcement",
		onMount: true,
		enabled: announce,
	});

	return (
		<ScreenRoot>
			{showNavbar ? (
				<ScreenNavbar>
					{onBack ? (
						<ScreenNavbar.BackButton onPress={onBack}>
							{title ? <ScreenNavbar.Title>{title}</ScreenNavbar.Title> : null}
						</ScreenNavbar.BackButton>
					) : title ? (
						<ScreenNavbar.Title>{title}</ScreenNavbar.Title>
					) : null}
				</ScreenNavbar>
			) : null}
			<ScreenContent>
				<View accessibilityLiveRegion={accessibilityLiveRegion} className={screenVariants().loading()}>
					<Spinner accessibilityLabel={name} size="xl" />
				</View>
			</ScreenContent>
		</ScreenRoot>
	);
}
ScreenLoading.displayName = "DelacourUI.Screen.Loading";
