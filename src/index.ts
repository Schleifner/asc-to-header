import { Program, Options, ASTBuilder } from "../node_modules/assemblyscript/dist/assemblyscript.js";
import * as fs from 'fs';
const program = new Program(new Options());
const parser = program.parser;
const sourceText = fs.readFileSync("/home/jesse/workspace/asc-to-header/test/types/env.ts", { encoding: "utf8" }).replace(/\r?\n/g, "\n");
parser.parseFile(sourceText, "env.ts", true);
const serializedSourceText = ASTBuilder.build(program.sources[0]);
console.log(serializedSourceText);
