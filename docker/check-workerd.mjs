// Fail the image build when workerd cannot run.
//
// The workerd package ships a JS shim that resolves the platform binary from an
// optional dependency. pnpm skips a failed optional download silently, so the
// image would build fine and only fail at runtime, when the plugin sandbox is
// first used. Resolve the binary the same way the sandbox runner does;
// node_modules/.bin/workerd is a shim that breaks once the native binary
// replaces it.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const binary = join(require.resolve("workerd"), "..", "..", "bin", "workerd");

execFileSync(binary, ["--version"], { stdio: "inherit" });
