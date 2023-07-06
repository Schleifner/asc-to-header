import {argv} from "process";

import {Command} from "commander";

import {AscToHeaderConvertor} from "../dist/index.js";

const program = new Command();

program
  .requiredOption("-f, --input <input>", "Input ts definition file")
  .requiredOption("-o, --output <output>", "output C++ header file")
  .option("-c, --compiler", "Convert env.ts to C++ header of JIT compiler")
  .option("-n, --namespace <namespace>", "namespace for generated code")
  .option("-h, --headerIdentifier <headerIdentifier>", "macro head define")
  .parse();

const options = program.opts();

const ascToHeaderConvertor = new AscToHeaderConvertor();

const success = ascToHeaderConvertor.generateHpp(options.input, options.output, {
  compiler: options.compiler,
  namespace: options.namespace,
  headerIdentifier: options.headerIdentifier
});

process.exit(success ? 0 : 1);
