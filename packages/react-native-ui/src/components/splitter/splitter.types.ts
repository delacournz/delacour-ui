/** What every part of a splitter accepts on top of its own props. */
export type SplitterSlotProps = {
	/** Merged after the part's own classes, so it wins a conflict. */
	className?: string;
};
