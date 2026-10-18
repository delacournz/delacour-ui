/**
 * Preloaded by `bun run start` (`bun --preload ./otel/register.mjs …`) so the tracer provider and
 * the W3C propagator exist before the Nitro server module is evaluated.
 *
 * Plain `.mjs`, outside `src/` and never bundled: Nitro's `.output` does not ship node_modules for
 * these packages, so they are resolved here from the workspace at run time.
 *
 * Nothing about the destination is set here. Railway injects `OTEL_EXPORTER_OTLP_ENDPOINT`,
 * `_PROTOCOL`, `_HEADERS`, `OTEL_SERVICE_NAME` and `OTEL_SERVICE_VERSION`, and the SDK reads them.
 * With no endpoint (local dev, CI) the exporter just fails quietly and nothing leaves the machine;
 * `OTEL_TRACES_EXPORTER=console` prints spans instead.
 *
 * Traces only — the start script sets `OTEL_METRICS_EXPORTER=none` and `OTEL_LOGS_EXPORTER=none`.
 *
 * Bun does not run Node's `http` module for `Bun.serve`, so the SDK's auto-instrumentations see
 * nothing here. The SERVER span is made by `src/lib/tracing.ts`, called from `src/start.ts`.
 */
import { NodeSDK } from "@opentelemetry/sdk-node";

const sdk = new NodeSDK({ instrumentations: [] });
sdk.start();

const shutdown = () => {
	sdk.shutdown().finally(() => process.exit(0));
};
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
