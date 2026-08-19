import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "es2022",
    dts: true,
    clean: true,
  },
  {
    entry: { "cli/index": "src/cli/index.ts" },
    format: ["esm"],
    target: "es2022",
    dts: false,
    clean: false,
    banner: { js: "#!/usr/bin/env node" },
  },
]);
