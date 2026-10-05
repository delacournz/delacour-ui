import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import type { HapticFeedback } from "../pressable/pressable";
import { type PaginationContextValue, PaginationProvider } from "./pagination.context";
import {
	clampPage,
	PAGINATION_DEFAULT_BOUNDARIES,
	PAGINATION_DEFAULT_PAGE_JUMP,
	PAGINATION_DEFAULT_SIBLINGS,
	PAGINATION_DEFAULT_SIZE,
	PAGINATION_DEFAULT_VARIANT,
	type PaginationSize,
	type PaginationVariant,
	paginationVariants,
	resolveControlState,
	resolvePageCorrection,
	resolvePaginationRange,
	shouldEmitPage,
} from "./pagination.variants";
import { PaginationCompact } from "./pagination-compact";
import { PaginationEllipsis } from "./pagination-ellipsis";
import { PaginationItem } from "./pagination-item";
import { PaginationNext } from "./pagination-next";
import { PaginationPrevious } from "./pagination-previous";
import { PaginationStatus } from "./pagination-status";
import { PaginationSummary } from "./pagination-summary";

export type PaginationProps = Omit<ViewProps, "children"> & {
	/** Total pages, numbered from 1. */
	count: number;
	/** The current page, one-based. Controlled. */
	page?: number;
	/** The first page while uncontrolled. */
	defaultPage?: number;
	/** Called with the page moved to — and once with the clamp, for a `page` outside `[1, count]`. */
	onPageChange?: (page: number) => void;
	/** `numbers` draws the run; `compact` a "3 / 12" readout; `simple` labelled arrows alone. */
	variant?: PaginationVariant;
	size?: PaginationSize;
	/** Pages either side of the current one in the `numbers` run. */
	siblings?: number;
	/** Pages always drawn at each end of the `numbers` run. */
	boundaries?: number;
	/** Show the previous/next arrows. */
	hasControls?: boolean;
	/** Pages jumped by tapping an ellipsis. */
	pageJump?: number;
	/** Every target blocks presses and fades. */
	isDisabled?: boolean;
	/** Played on press-in by every target. */
	haptic?: false | HapticFeedback;
	/** The root's accessible name. */
	accessibilityLabel?: string;
	/**
	 * Leading content — a `Pagination.Summary`; the run follows on the trailing
	 * edge. Children that include a run part (`Item`, `Previous`, `Next`,
	 * `Ellipsis`) replace the default run instead.
	 */
	children?: ReactNode;
	className?: string;
};

/** The parts that make children a run of their own rather than leading content. */
const RUN_PARTS: ReadonlySet<unknown> = new Set([
	PaginationItem,
	PaginationPrevious,
	PaginationNext,
	PaginationEllipsis,
]);

function PaginationRoot({
	count,
	page: pageProp,
	defaultPage = 1,
	onPageChange,
	variant = PAGINATION_DEFAULT_VARIANT,
	size = PAGINATION_DEFAULT_SIZE,
	siblings = PAGINATION_DEFAULT_SIBLINGS,
	boundaries = PAGINATION_DEFAULT_BOUNDARIES,
	hasControls = true,
	pageJump = PAGINATION_DEFAULT_PAGE_JUMP,
	isDisabled = false,
	haptic = "selection",
	accessibilityLabel = "Pagination",
	children,
	className,
	...props
}: PaginationProps): ReactElement {
	const [held, setPage] = useControllableState<number>({
		defaultValue: defaultPage,
		onChange: onPageChange,
		value: pageProp,
	});
	const page = clampPage(held, count);

	// A held page outside `[1, count]` — a controlled value left behind by a
	// shrinking result set — is drawn as its clamp at once and reported from
	// here, once per out-of-range pair, so a parent that ignores the report is
	// not called again on every render.
	const reported = useRef<string | undefined>(undefined);
	useEffect(() => {
		const correction = resolvePageCorrection(held, count);
		if (correction === undefined) {
			reported.current = undefined;
			return;
		}
		const key = `${held}/${count}`;
		if (reported.current === key) return;
		reported.current = key;
		setPage(correction);
	}, [count, held, setPage]);

	const select = useCallback(
		(next: number) => {
			const target = clampPage(next, count);
			if (!isDisabled && shouldEmitPage(page, target)) setPage(target);
		},
		[count, isDisabled, page, setPage]
	);

	const range = useMemo(
		() => resolvePaginationRange({ boundaries, count, page, siblings }),
		[boundaries, count, page, siblings]
	);
	const { canNext, canPrevious } = resolveControlState(page, count);

	const context = useMemo<PaginationContextValue>(
		() => ({
			accessibilityLabel,
			canNext,
			canPrevious,
			count,
			haptic,
			isDisabled,
			page,
			pageJump,
			range,
			select,
			size,
			variant,
		}),
		[accessibilityLabel, canNext, canPrevious, count, haptic, isDisabled, page, pageJump, range, select, size, variant]
	);

	const slots = paginationVariants({ size });
	const isCustomRun = Children.toArray(children).some((child) => isValidElement(child) && RUN_PARTS.has(child.type));

	const middle =
		variant === "numbers" ? (
			range.map((token) =>
				token.kind === "page" ? (
					<PaginationItem key={`page-${token.page}`} page={token.page} />
				) : (
					<PaginationEllipsis direction={token.direction} key={`gap-${token.direction}`} />
				)
			)
		) : variant === "compact" ? (
			<PaginationCompact />
		) : null;

	const run = isCustomRun ? (
		<View className={slots.run()}>{children}</View>
	) : (
		<View className={slots.run()}>
			{hasControls ? <PaginationPrevious /> : null}
			{middle}
			{hasControls ? <PaginationNext /> : null}
		</View>
	);

	return (
		<PaginationProvider value={context}>
			<View
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="toolbar"
				className={slots.root({ className })}
				{...props}
			>
				{isCustomRun ? null : children}
				{run}
			</View>
		</PaginationProvider>
	);
}

/**
 * Moves through the pages of a result set — an order history, search results,
 * an admin table — where the reader needs to say "page 7" rather than scroll.
 *
 * The component owns the arithmetic: which numbers to draw, where the gaps fall,
 * which arrow is disabled. The caller owns fetching and slicing.
 *
 * **The `numbers` run is fixed-width.** Once `count` outgrows it, every page
 * draws the same number of targets, so the one the thumb is aiming at never
 * slides away as the window moves; a gap never hides a single page, and tapping
 * one jumps `pageJump` pages.
 *
 * A controlled `page` outside `[1, count]` is drawn clamped and reported once
 * through `onPageChange`.
 *
 * @example
 * <Pagination count={24} page={page} onPageChange={setPage} />
 *
 * @example
 * <Pagination count={24} variant="compact" size="sm" />
 *
 * @example
 * <Pagination count={24} page={page} onPageChange={setPage}>
 *   <Pagination.Summary>
 *     <Pagination.Status pageSize={20} total={472} />
 *   </Pagination.Summary>
 * </Pagination>
 */
export const Pagination = Object.assign(PaginationRoot, {
	/** One page number — filled when current. */
	Item: PaginationItem,
	/** The back arrow. Disabled on the first page. */
	Previous: PaginationPrevious,
	/** The forward arrow. Disabled on the last page. */
	Next: PaginationNext,
	/** A gap that jumps `pageJump` pages the way it points. */
	Ellipsis: PaginationEllipsis,
	/** Leading content; pushes the run to the trailing edge. */
	Summary: PaginationSummary,
	/** "41–60 of 472", from the current page. */
	Status: PaginationStatus,
	displayName: "DelacourUI.Pagination",
});
