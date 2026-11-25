import { act, type RenderOptions, render } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { DelacourProvider } from "../components/provider";

/** The provider stack every component expects above it: gesture root, safe area, keyboard. */
function TestProviders({ children }: { children: ReactNode }): ReactElement {
	return <DelacourProvider>{children}</DelacourProvider>;
}

/**
 * `render` inside `DelacourProvider`. A `wrapper` passed in sits inside the
 * provider, so a test adds an `OverlayProvider` or a `DirectionProvider` on top.
 */
export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
	const { wrapper: Inner, ...rest } = options;
	const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
		<TestProviders>{Inner ? <Inner>{children}</Inner> : children}</TestProviders>
	);
	return render(ui, { ...rest, wrapper: Wrapper });
}

/**
 * Taps a `Pressable` the way a finger does: its tap gesture, `${testID}-press`, run through
 * `fireGestureHandler`. Use it for a touch-only press — a row or a box that is `accessible={false}`
 * and so has no accessibility activation to fire — where `fireEvent.press` cannot help: Gesture
 * Handler 3's detector declines the responder, and Testing Library drops the press.
 */
export async function pressGesture(testID: string): Promise<void> {
	await act(async () => {
		fireGestureHandler(getByGestureTestId(`${testID}-press`), [
			{ state: State.BEGAN },
			{ state: State.ACTIVE },
			{ state: State.END },
		]);
	});
}

export * from "@testing-library/react-native";
