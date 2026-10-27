import { useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { PERFORMANCE_WORKLOAD_IDS } from "@/performance/protocol";
import { WorkloadScreen } from "@/performance/workload-screen";

export default function Performance(): ReactElement {
	const { workload } = useLocalSearchParams<{ workload?: string }>();
	return <WorkloadScreen key={workload} workload={PERFORMANCE_WORKLOAD_IDS.find((id) => id === workload)} />;
}
