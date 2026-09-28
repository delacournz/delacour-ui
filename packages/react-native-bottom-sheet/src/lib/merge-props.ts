type UnknownProps = Record<string, unknown>;

function isEventHandlerKey(key: string): boolean {
	return key.startsWith("on") && key.length > 2 && key[2] === key[2]?.toUpperCase();
}

/**
 * Merges a slot's own props with those of the element it renders into.
 *
 * Child props win, with two exceptions: event handlers are chained
 * slot-first-then-child so neither side is silently dropped, and `style` is
 * flattened into an array with the child last (React Native resolves style
 * arrays left to right).
 *
 * The copy in `@delacour/react-native-ui` also merges class strings; this
 * package has none to merge, which is the whole point of it.
 */
export function mergeProps<T extends UnknownProps>(slotProps: UnknownProps, childProps: UnknownProps): T {
	const merged: UnknownProps = { ...slotProps };

	for (const key of Object.keys(childProps)) {
		const slotValue = slotProps[key];
		const childValue = childProps[key];

		if (isEventHandlerKey(key) && typeof slotValue === "function" && typeof childValue === "function") {
			merged[key] = (...args: unknown[]) => {
				(slotValue as (...a: unknown[]) => unknown)(...args);
				return (childValue as (...a: unknown[]) => unknown)(...args);
			};
			continue;
		}

		if (key === "style" && slotValue != null && childValue != null) {
			merged[key] = [slotValue, childValue].flat();
			continue;
		}

		merged[key] = childValue;
	}

	return merged as T;
}
