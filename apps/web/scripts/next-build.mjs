import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(scriptDir, "..");
const nextCli = join(webRoot, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextCli, "build"], {
  cwd: webRoot,
  env: {
    ...process.env,
    NEXT_DIST_DIR: ".next-build"
  },
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
