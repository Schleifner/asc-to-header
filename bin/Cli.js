import {argv} from "process";

import {Command} from "commander";

import {AscToHeaderConvertor} from "../dist/index.js";

const program = new Command();

program
  .requiredOption("-f, --input <input>", "Input ts definition file")
  .requiredOption("-o, --output <output>", "output C++ header file")
  .parse();

const options = program.opts();

const ascToHeaderConvertor = new AscToHeaderConvertor();

const success = ascToHeaderConvertor.generateHpp(options.input, options.output);

process.exit(success ? 0 : 1);
