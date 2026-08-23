import { Button } from "@delacour/native-ui/button";
import { Screen } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { View } from "react-native";

type Engine = "flat" | "section" | "legend";

type Row = { id: string; title: string; detail: string };

const ROWS: Row[] = Array.from({ length: 60 }, (_, index) => ({
	detail: `Row ${index + 1} of 60`,
	id: String(index),
	title: `Item ${index + 1}`,
}));

const SECTIONS = ["A", "B", "C", "D"].map((letter, index) => ({
	data: ROWS.slice(index * 15, index * 15 + 15),
	title: letter,
}));

function RowView({ row }: { row: Row }): ReactElement {
	return (
		<View className="gap-0.5 border-border border-b px-screen-gutter py-3">
			<Text className="font-medium text-base text-foreground">{row.title}</Text>
			<Text.Caption>{row.detail}</Text.Caption>
		</View>
	);
}

/**
 * The three virtualised bodies, all sharing one reserve.
 *
 * `Screen.FlatList`, `Screen.SectionList` and `Screen.LegendList` differ only
 * in the engine that draws the rows: every one of them takes its navbar and
 * footer clearance from the same `useScreenScrollInsets`, so switching engines
 * cannot change where the content starts or ends.
 *
 * The reserves ride on the lists' header and footer components rather than on
 * content-container padding, because a virtualised list measures its own
 * content and padding would sit outside what it measures.
 *
 * `contentContainerClassName="px-0"` opts the horizontal half of the library's
 * gutter out, because the rows carry their own — a divider has to reach both
 * edges, and one inset by the container would stop short of them. The vertical
 * half still applies.
 */
export default function ScreenListsDemo(): ReactElement {
	const router = useRouter();
	const [engine, setEngine] = useState<Engine>("flat");

	const picker = (
		<View className="flex-row gap-2 px-screen-gutter pb-3">
			{(["flat", "section", "legend"] as const).map((value) => (
				<Button
					key={value}
					onPress={() => setEngine(value)}
					size="sm"
					variant={engine === value ? "primary" : "outline"}
				>
					{value}
				</Button>
			))}
		</View>
	);

	return (
		<Screen>
			<Screen.Navbar placement="static">
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<Screen.Navbar.Title>Lists</Screen.Navbar.Title>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			{engine === "flat" ? (
				<Screen.FlatList
					data={ROWS}
					contentContainerClassName="px-0"
					header={picker}
					keyExtractor={(row) => row.id}
					renderItem={({ item }) => <RowView row={item} />}
				/>
			) : null}

			{engine === "section" ? (
				<Screen.SectionList
					contentContainerClassName="px-0"
					header={picker}
					keyExtractor={(row) => row.id}
					renderItem={({ item }) => <RowView row={item} />}
					renderSectionHeader={({ section }) => (
						<Text className="bg-background px-screen-gutter py-2 font-semibold text-muted-foreground text-xs uppercase">
							{section.title}
						</Text>
					)}
					sections={SECTIONS}
					stickySectionHeadersEnabled
				/>
			) : null}

			{engine === "legend" ? (
				<Screen.LegendList
					data={ROWS}
					estimatedItemSize={64}
					contentContainerClassName="px-0"
					header={picker}
					keyExtractor={(row) => row.id}
					renderItem={({ item }) => <RowView row={item} />}
				/>
			) : null}

			<Screen.Footer>
				<Button haptic="medium" onPress={() => router.back()}>
					Done
				</Button>
			</Screen.Footer>
		</Screen>
	);
}
