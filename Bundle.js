import {execSync} from "child_process";

import {build} from "esbuild";

try {
  await build({
    entryPoints: ["./src/index.ts"],
    bundle: true,
    outfile: "./dist/index.js",
    platform: "node",
    target: "esnext",
    sourcemap: true,
    loader: {".ts": "ts", ".tsx": "tsx"},
    packages: "external",
    format: "esm",
    plugins: [
      {
        name: "TypeScriptDeclarationsPlugin",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length === 0) {
              execSync("npx tsc -p tsconfig-bundle.json");
            }
          });
        }
      }
    ]
  });
} catch (e) {
  console.log(`bundle failed due to ${JSON.stringify(e)}`);
}
