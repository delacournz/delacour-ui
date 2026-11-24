import { type RenderOptions, render } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
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

export * from "@testing-library/react-native";
