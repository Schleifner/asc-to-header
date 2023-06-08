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
    format: "esm"
  });
} catch (e) {
  console.log(`bundle failed due to ${JSON.stringify(e)}`);
}
