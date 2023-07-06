import * as fs from "node:fs";
import * as Path from "node:path";

import * as assemblyscript from "assemblyscript";

import { CppHeaderTransfer } from "./cppHeaderTransfer.js";

export class AdditionalTransformOption {
  compiler = false;
  namespace: string | undefined;
  headerIdentifier: string | undefined;
}

export class AscToHeaderConvertor {
  private program: assemblyscript.Program;
  constructor() {
    const compilerOptions = assemblyscript.newOptions();
    this.program = assemblyscript.newProgram(compilerOptions);
  }

  private generateHppContent(
    hppContent: string,
    namespace: string | undefined,
    compiler = false,
    headerIdentifier: string | undefined
  ): string {
    return compiler
      ? `
// clang-format off
#ifndef ${headerIdentifier || `__types_wasm_${this.program.sources[0].simplePath}_H__`}
#define ${headerIdentifier || `__types_wasm_${this.program.sources[0].simplePath}_H__`}
#include <cstdint>
${namespace ? `namespace ${namespace}{` : ""}
${hppContent}
${namespace ? `}` : ""}
#endif
`
      : `
// clang-format off
#ifndef ${headerIdentifier || `__types_wasm_${this.program.sources[0].simplePath}_H__`}
#define ${headerIdentifier || `__types_wasm_${this.program.sources[0].simplePath}_H__`}
#include <stdint.h> // NOLINT(modernize-deprecated-headers)

#ifndef WASM_IMPORT_ATTRIBUTE
#ifdef __wasm32__
#define WASM_IMPORT_ATTRIBUTE(name) __attribute__((import_module(name)))
#else
#define WASM_IMPORT_ATTRIBUTE(name)
#endif
#endif

extern "C" {
${hppContent}
}
#endif      
`;
  }

  public generateHpp(
    inputFileName: string,
    outputFileName: string,
    additionalOptions: AdditionalTransformOption = new AdditionalTransformOption()
  ): boolean {
    let sourceText: string;
    const compiler: boolean = additionalOptions.compiler;
    const namespace: string | undefined = additionalOptions.namespace;
    const headerIdentifier: string | undefined = additionalOptions.headerIdentifier;
    try {
      sourceText = fs.readFileSync(inputFileName, { encoding: "utf8" }).replace(/\r?\n/g, "\n");
    } catch (error) {
      console.error(`open file ${inputFileName} failed due to ${JSON.stringify(error)}`);
      return false;
    }
    assemblyscript.parse(this.program, sourceText, inputFileName, true);
    const builder = new CppHeaderTransfer(compiler);
    try {
      builder.visitNode(this.program.sources[0]);
    } catch (error) {
      console.error(error);
      return false;
    }
    const cHeaderContent = this.generateHppContent(builder.getHppContent(), namespace, compiler, headerIdentifier);
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
