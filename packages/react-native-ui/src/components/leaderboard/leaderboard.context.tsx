import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { LeaderboardEntry } from "./leaderboard.types";

export type LeaderboardContextValue = {
	/** Turns a score into the text drawn and spoken. */
	formatValue: (value: number) => string;
	/** Spoken after the value — "points", "seconds". */
	unit: string | undefined;
	/** The entry the board marks as "you". */
	highlightId: string | undefined;
	/** Whether any entry has a `change`, so every row reserves the movement column or none does. */
	showMovement: boolean;
	/** Draws an avatar or a flag beside a name. */
	renderMedia: ((entry: LeaderboardEntry, rank: number) => ReactNode) | undefined;
	/** Makes each place a button. */
	onPressEntry: ((entry: LeaderboardEntry, rank: number) => void) | undefined;
};

const LeaderboardContext = createContext<LeaderboardContextValue | null>(null);

/**
 * Supplies the board's formatting, highlight and handlers to its internal parts.
 *
 * Lives in its own module, importing nothing but types, so a part the board
 * renders can read it without importing `./leaderboard` and closing a cycle.
 * See AGENTS.md rule 3.
 */
export function LeaderboardProvider({
	value,
	children,
}: {
	value: LeaderboardContextValue;
	children: ReactNode;
}): ReactElement {
	return <LeaderboardContext value={value}>{children}</LeaderboardContext>;
}
LeaderboardProvider.displayName = "DelacourUI.Leaderboard.Provider";

/** The enclosing board's context. Throws outside one, naming the part that asked. */
export function useLeaderboardPart(part: string): LeaderboardContextValue {
	const context = use(LeaderboardContext);
	if (!context) {
		throw new Error(`<${part}> must be rendered inside a <Leaderboard>.`);
	}
	return context;
}
