import * as fs from "fs";

import * as assemblyscript from "assemblyscript";

import {CppHeaderTransfer} from "./CppHeaderTransfer.js";

export class AscToHeaderConvertor {
  private program: assemblyscript.Program;
  constructor() {
    const compilerOptions = assemblyscript.newOptions();
    this.program = assemblyscript.newProgram(compilerOptions);
  }

  public generateHpp(inputFileName: string, outputFileName: string): boolean {
    let sourceText: string;
    try {
      sourceText = fs.readFileSync(inputFileName, {encoding: "utf8"}).replace(/\r?\n/g, "\n");
    } catch (e) {
      console.error(`open file ${inputFileName} failed due to ${JSON.stringify(e)}`);
      return false;
    }
    assemblyscript.parse(this.program, sourceText, inputFileName, true);
    const builder = new CppHeaderTransfer();
    builder.visitNode(this.program.sources[0]);
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
      fs.writeFileSync(outputFileName, cHeaderContent);
    } catch (e) {
      console.error(`write file ${outputFileName} failed due to ${JSON.stringify(e)}`);
      return false;
    }
    return true;
  }
}
