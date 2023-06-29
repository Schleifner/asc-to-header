import * as fs from "node:fs";
import * as Path from "node:path";

import * as assemblyscript from "assemblyscript";

import { CppHeaderTransfer } from "./cppHeaderTransfer.js";

export class AscToHeaderConvertor {
  private program: assemblyscript.Program;
  constructor() {
    const compilerOptions = assemblyscript.newOptions();
    this.program = assemblyscript.newProgram(compilerOptions);
  }

  public generateHpp(inputFileName: string, outputFileName: string): boolean {
    let sourceText: string;
    try {
      sourceText = fs.readFileSync(inputFileName, { encoding: "utf8" }).replace(/\r?\n/g, "\n");
    } catch (error) {
      console.error(`open file ${inputFileName} failed due to ${JSON.stringify(error)}`);
      return false;
    }
    assemblyscript.parse(this.program, sourceText, inputFileName, true);
    const builder = new CppHeaderTransfer();
    try {
      builder.visitNode(this.program.sources[0]);
    } catch (error) {
      console.error(error);
      return false;
    }
    const cHeaderContent = `
#ifndef __types_wasm_${this.program.sources[0].simplePath}_H__
#define __types_wasm_${this.program.sources[0].simplePath}_H__
#include <stdint.h>

#ifndef WASM_IMPORT_ATTRIBUTE
#ifdef __wasm32__
#define WASM_IMPORT_ATTRIBUTE(name) __attribute__((import_module(name)))
#else
#define WASM_IMPORT_ATTRIBUTE(name)
#endif
#endif

extern "C" {
${builder.getHppContent()}
}
#endif
`;
    builder.finish();
    try {
      fs.mkdirSync(Path.dirname(outputFileName), { recursive: true });
      fs.writeFileSync(outputFileName, cHeaderContent);
    } catch (error) {
      console.error(`write file ${outputFileName} failed due to ${JSON.stringify(error)}`);
      return false;
    }
    return true;
  }
}
