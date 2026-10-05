import { memo, type ReactElement, useMemo } from "react";
import { Defs, G, Mask, Path, Rect } from "react-native-svg";
import { groupSketchItems, type SketchGroup, type SketchItem } from "./sketch.paths";

type SketchGroupsProps = {
	items: readonly SketchItem[];
	width: number;
	height: number;
	/** Prefixes every mask id, so two sketches on one screen never reference each other's masks. */
	idPrefix: string;
};

type SketchGroupViewProps = {
	group: SketchGroup;
	id: string;
	width: number;
	height: number;
};

function sameItems(a: readonly SketchItem[], b: readonly SketchItem[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((item, index) => item === b[index]);
}

/**
 * One run of ink, masked by the erasers drawn after it.
 *
 * `memo`'d by the identity of its marks and erasers rather than the group object,
 * which `groupSketchItems` rebuilds on every change. A new stroke therefore
 * re-renders the last run alone, and an erase re-renders only the runs it masks.
 */
const SketchGroupView = memo(
	function SketchGroupView({ group, id, width, height }: SketchGroupViewProps): ReactElement {
		const marks = group.marks.map((mark) => (
			<Path
				d={mark.d}
				fill="none"
				key={mark.id}
				stroke={mark.color}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={mark.width}
			/>
		));

		if (group.erasers.length === 0) return <G>{marks}</G>;

		return (
			<G>
				<Defs>
					<Mask height={height} id={id} maskUnits="userSpaceOnUse" width={width} x={0} y={0}>
						<Rect fill="#fff" height={height} width={width} />
						{group.erasers.map((eraser) => (
							<Path
								d={eraser.d}
								fill="none"
								key={eraser.id}
								stroke="#000"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={eraser.width}
							/>
						))}
					</Mask>
				</Defs>
				<G mask={`url(#${id})`}>{marks}</G>
			</G>
		);
	},
	(previous, next) =>
		previous.id === next.id &&
		previous.width === next.width &&
		previous.height === next.height &&
		sameItems(previous.group.marks, next.group.marks) &&
		sameItems(previous.group.erasers, next.group.erasers)
);
SketchGroupView.displayName = "DelacourUI.Sketch.Group";

/**
 * The committed drawing, as runs of ink split at every eraser.
 *
 * An eraser hides only what was drawn before it, so each run is masked by the
 * erasers after it and by none before — the same model `sketchItemsToSvg`
 * exports, so the file matches the screen. A run is keyed by its first mark,
 * which no later stroke can change.
 */
export function SketchGroups({ items, width, height, idPrefix }: SketchGroupsProps): ReactElement {
	const groups = useMemo(() => groupSketchItems(items), [items]);
	return (
		<>
			{groups.map((group) => {
				const key = group.marks[0]?.id ?? "empty";
				return <SketchGroupView group={group} height={height} id={`${idPrefix}-${key}`} key={key} width={width} />;
			})}
		</>
	);
}
SketchGroups.displayName = "DelacourUI.Sketch.Groups";
