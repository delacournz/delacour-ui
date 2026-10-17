import type { ViewProps } from "react-native";

/** What every part of a split view accepts on top of its own props. */
export type SplitViewSlotProps = {
	/** Merged after the part's own classes, so it wins a conflict. */
	className?: string;
};

/** `SplitView.Top` and `SplitView.Bottom` — layout regions taking any content. */
export type SplitViewPaneProps = Omit<ViewProps, "style"> & SplitViewSlotProps;
