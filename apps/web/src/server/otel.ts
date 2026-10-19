import { defineMiddleware } from "nitro/h3";
import { traceRequest } from "@/server/trace";

/** Nitro middleware: one SERVER span per request, ahead of TanStack Start's own request middleware. */
export default defineMiddleware((event, next) => traceRequest(event.req, next));
