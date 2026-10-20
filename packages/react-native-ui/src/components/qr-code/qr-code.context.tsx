import { createContext, type ReactElement, type ReactNode, use } from "react";

/** What `QRCode.Logo` reads: where its plate goes, in dp, and the tile's colour. */
export type QRCodeContextValue = {
	/** The plate's top-left offset and side in dp, or null when no logo fits and it is dropped. */
	logoFrame: { offset: number; side: number; inset: number } | null;
	backgroundColor: string | undefined;
};

const QRCodeContext = createContext<QRCodeContextValue | null>(null);

/**
 * Supplies one code's logo frame to its `Logo`.
 *
 * Its own module, importing nothing but React, so the part never imports
 * `./qr-code` and closes a cycle.
 */
export function QRCodeProvider({ value, children }: { value: QRCodeContextValue; children: ReactNode }): ReactElement {
	return <QRCodeContext value={value}>{children}</QRCodeContext>;
}
QRCodeProvider.displayName = "DelacourUI.QRCode.Provider";

/** The enclosing code's state, or null outside a `<QRCode>`. */
export function useQRCodeContext(): QRCodeContextValue | null {
	return use(QRCodeContext);
}

/**
 * The enclosing code's state, for a part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useQRCodePart(component: string): QRCodeContextValue {
	const context = useQRCodeContext();
	if (!context) throw new Error(`${component} must be rendered inside a <QRCode>.`);
	return context;
}
