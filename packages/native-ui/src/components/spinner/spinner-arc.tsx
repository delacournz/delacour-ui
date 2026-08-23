import { type ReactElement, useId } from "react";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useSpinnerContext } from "./spinner.context";

/**
 * The default glyph: a ring whose stroke fades from opaque to transparent
 * around the circle.
 *
 * Drawn as two half-rings because a linear gradient only fades along one axis —
 * one alone cannot carry the stroke all the way round. Central Icons has no
 * loader glyph, so this is drawn from SVG primitives rather than imported.
 *
 * It carries no width or height on purpose. react-native-svg resolves both to
 * `'100%'` when neither is set, so the arc fills whatever box the spinner root
 * sized — one place decides the size instead of threading a number down. The
 * viewBox stays fixed at 24, so the stroke stays proportional at every size
 * with no geometry to recompute.
 *
 * Reads the spinner context optionally rather than through `useSpinner`: the
 * arc is also the fallback glyph and must not throw outside a `<Spinner>`.
 */
export function SpinnerArc(): ReactElement {
	const spinner = useSpinnerContext();
	const resolvedColor = spinner?.color;

	// An SVG gradient is referenced by id, and ids are global to the document.
	// React 19 emits `«r1»`-style ids, whose delimiters are invalid in `url(#…)`.
	const id = useId().replace(/[^a-zA-Z0-9]/g, "");
	const leadId = `spinner-lead-${id}`;
	const tailId = `spinner-tail-${id}`;

	return (
		<Svg fill="none" viewBox="0 0 24 24">
			<Defs>
				<LinearGradient id={leadId} x1="0" x2="0" y1="0" y2="1">
					<Stop offset="0" stopColor={resolvedColor} stopOpacity={1} />
					<Stop offset="1" stopColor={resolvedColor} stopOpacity={0.55} />
				</LinearGradient>
				<LinearGradient id={tailId} x1="0" x2="0" y1="0" y2="1">
					<Stop offset="0" stopColor={resolvedColor} stopOpacity={0} />
					<Stop offset="1" stopColor={resolvedColor} stopOpacity={0.55} />
				</LinearGradient>
			</Defs>
			<Path d="M 12 2 A 10 10 0 0 1 12 22" stroke={`url(#${leadId})`} strokeLinecap="round" strokeWidth={2.5} />
			<Path d="M 12 22 A 10 10 0 0 1 12 2" stroke={`url(#${tailId})`} strokeLinecap="round" strokeWidth={2.5} />
		</Svg>
	);
}
