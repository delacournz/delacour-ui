/**
 * The `translateY` that puts `height` pixels of sheet above its resting bottom
 * line, inside a container `containerHeight` tall.
 *
 * Height space is the engine's coordinate system; this is the one place it is
 * converted to a transform. A detached sheet rests `restingBottom` above the
 * container's bottom edge, so its closed position is the full container
 * height and every snap point sits that much higher.
 */
export function positionFor(containerHeight: number, restingBottom: number, height: number): number {
	"worklet";
	return containerHeight - restingBottom - height;
}
