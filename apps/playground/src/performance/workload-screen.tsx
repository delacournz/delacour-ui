import { BottomSheet } from "@delacour/react-native-ui/bottom-sheet";
import { Button } from "@delacour/react-native-ui/button";
import { Chart } from "@delacour/react-native-ui/chart";
import { Dialog } from "@delacour/react-native-ui/dialog";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Screen } from "@delacour/react-native-ui/screen";
import { Text } from "@delacour/react-native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import { FlatList, Keyboard, View } from "react-native";
import { LIST_GAP } from "@/tokens";
import {
	chartRows,
	LIST_ROWS,
	OVERLAY_STEPS,
	overlayStep,
	PERFORMANCE_LABELS,
	PERFORMANCE_PROTOCOL,
	PERFORMANCE_WORKLOAD_IDS,
	type PerformanceWorkload,
} from "./protocol";

const CONFIG = { alpha: { label: "Alpha" }, beta: { label: "Beta" }, gamma: { label: "Gamma" } };

export function WorkloadScreen({ workload }: { workload?: PerformanceWorkload }): ReactElement {
	const router = useRouter();
	const [status, setStatus] = useState("ready");
	const [run, setRun] = useState(0);
	const [active, setActive] = useState(false);
	const complete = useCallback(() => {
		setActive(false);
		setStatus("complete");
	}, []);
	return (
		<Screen>
			<Screen.Navbar placement="static">
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<Screen.Navbar.Title>{workload ? PERFORMANCE_LABELS[workload] : "Performance"}</Screen.Navbar.Title>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>
			{workload ? (
				<View className="flex-1 gap-3 px-screen-gutter py-3">
					<Text.Caption testID="performance-status">{`${workload}:${status}:run-${run}`}</Text.Caption>
					{__DEV__ ? (
						<Text.Caption>Development build. Use a physical device and a release build for profiles.</Text.Caption>
					) : null}
					<Button
						isDisabled={active}
						onPress={() => {
							setRun((value) => value + 1);
							setStatus("running");
							setActive(true);
						}}
						testID="performance-start"
					>
						Start
					</Button>
					<Button
						isDisabled={!active}
						onPress={() => {
							Keyboard.dismiss();
							setActive(false);
							setStatus("stopped");
						}}
						testID="performance-stop"
						variant="secondary"
					>
						Stop
					</Button>
					<Workload active={active} complete={complete} key={run} workload={workload} />
				</View>
			) : (
				<Screen.ScrollArea contentContainerClassName={LIST_GAP}>
					<ListGroup>
						{PERFORMANCE_WORKLOAD_IDS.map((id) => (
							<ListGroup.Item
								key={id}
								onPress={() => router.push({ pathname: "/performance", params: { workload: id } })}
							>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>{PERFORMANCE_LABELS[id]}</ListGroup.ItemTitle>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix />
							</ListGroup.Item>
						))}
					</ListGroup>
				</Screen.ScrollArea>
			)}
		</Screen>
	);
}
WorkloadScreen.displayName = "Playground.WorkloadScreen";

function Workload({
	active,
	complete,
	workload,
}: {
	active: boolean;
	complete(): void;
	workload: PerformanceWorkload;
}): ReactElement {
	const [tick, setTick] = useState(0);
	const [dialog, setDialog] = useState(false);
	const [sheet, setSheet] = useState(false);
	const [cycles, setCycles] = useState(0);
	const [losses, setLosses] = useState(0);
	const [text, setText] = useState("");
	useEffect(() => {
		if (!active) return;
		if (workload === "overlay-lifecycle") {
			let index = 0;
			let timer: ReturnType<typeof setTimeout>;
			const next = () => {
				if (index === OVERLAY_STEPS) {
					complete();
					return;
				}
				const step = overlayStep(index++);
				if (step.kind === "dialog") setDialog(step.isOpen);
				else setSheet(step.isOpen);
				if (step.kind === "sheet" && !step.isOpen) setCycles(step.cycle);
				timer = setTimeout(next, step.waitMs);
			};
			next();
			return () => clearTimeout(timer);
		}
		if (workload === "keyboard-sheet") return;
		const timer = setTimeout(complete, PERFORMANCE_PROTOCOL.durationMs);
		const interval =
			workload === "chart-updates"
				? setInterval(() => setTick((value) => value + 1), PERFORMANCE_PROTOCOL.chartIntervalMs)
				: undefined;
		return () => {
			clearTimeout(timer);
			if (interval) clearInterval(interval);
		};
	}, [active, complete, workload]);
	useEffect(() => () => Keyboard.dismiss(), []);

	if (workload === "long-list")
		return (
			<FlatList
				className="flex-1"
				data={LIST_ROWS}
				keyExtractor={(row) => row.id}
				renderItem={({ item }) => (
					<View className="border-border border-b py-3">
						<Text>{item.label}</Text>
					</View>
				)}
				testID="performance-list"
			/>
		);
	if (workload === "chart-updates")
		return (
			<View className="gap-3">
				<Text.Caption testID="performance-chart-ticks">{`Updates: ${tick}`}</Text.Caption>
				<Chart config={CONFIG} data={chartRows(tick)} xKey="x">
					<Chart.Grid />
					<Chart.YAxis />
					<Chart.XAxis />
					<Chart.Line yKey="alpha" />
					<Chart.Line yKey="beta" />
					<Chart.Line yKey="gamma" />
				</Chart>
			</View>
		);
	return (
		<View className="gap-3">
			<Text.Caption testID="performance-cycles">{`Cycles: ${cycles}; input losses: ${losses}; closed: ${!active || (!dialog && !sheet)}`}</Text.Caption>
			{workload === "keyboard-sheet" ? (
				<Button
					isDisabled={!active || sheet}
					onPress={() => {
						setText("");
						setSheet(true);
					}}
					testID="performance-keyboard-open"
				>
					Open input
				</Button>
			) : null}
			<Dialog isOpen={active && dialog} onOpenChange={setDialog}>
				<Dialog.Content testID="performance-dialog">
					<Dialog.Header>
						<Dialog.Title>Lifecycle workload</Dialog.Title>
						<Dialog.Description>Wait for the cycle to finish.</Dialog.Description>
					</Dialog.Header>
				</Dialog.Content>
			</Dialog>
			<BottomSheet isOpen={active && sheet} onOpenChange={setSheet}>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container>
						<BottomSheet.Content testID="performance-sheet">
							<BottomSheet.Title>
								{workload === "keyboard-sheet" ? "Keyboard workload" : "Lifecycle workload"}
							</BottomSheet.Title>
							<BottomSheet.Description>
								{workload === "keyboard-sheet"
									? `Enter: ${PERFORMANCE_PROTOCOL.keyboardText}`
									: "Wait for the cycle to finish."}
							</BottomSheet.Description>
							{workload === "keyboard-sheet" ? (
								<BottomSheet.TextInput
									accessibilityLabel="Protocol text"
									autoCorrect={false}
									onChangeText={setText}
									testID="performance-keyboard-input"
									value={text}
								/>
							) : null}
						</BottomSheet.Content>
						{workload === "keyboard-sheet" ? (
							<BottomSheet.Footer sticky>
								<Button
									onPress={() => {
										Keyboard.dismiss();
										setSheet(false);
										setCycles((value) => value + 1);
										if (text !== PERFORMANCE_PROTOCOL.keyboardText) setLosses((value) => value + 1);
										if (cycles + 1 === PERFORMANCE_PROTOCOL.keyboardCycles) complete();
									}}
									testID="performance-keyboard-submit"
								>
									Finish cycle
								</Button>
							</BottomSheet.Footer>
						) : null}
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
Workload.displayName = "Playground.PerformanceWorkload";
