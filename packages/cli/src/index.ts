#!/usr/bin/env node
import { program } from "./program";

/**
 * The entry point, and deliberately nothing else. See `program.ts` for the
 * command wiring and for why the two are separate files.
 */

program.parseAsync(process.argv);
