// import { Program, Options, ASTBuilder } from "../node_modules/assemblyscript/dist/assemblyscript.js";
import * as fs from 'fs';
import { argv } from 'process';
import { FunctionDeclaration, FunctionExpression, MethodDeclaration } from "types:assemblyscript/src/ast";
import * as assemblyscript from "../node_modules/assemblyscript/dist/assemblyscript.js";

class CDCHeaderTransfer extends assemblyscript.ASTBuilder {
  functionPtrSet = new Array();
  content = "";
  typeMap: Map<string, string> = new Map<string, string>([
    ["void", "void"],
    ["i8", "int8_t"],
    ["u8", "uint8_t"],
    ["i16", "int16_t"],
    ["u16", "uint16_t"],
    ["i32", "int32_t"],
    ["u32", "uint32_t"],
    ["i64", "int64_t"],
    ["u64", "uint64_t"],
    ["f32", "float"],
    ["f64", "double"],
    ["boolean", "bool"],
  ]);
  constructor() {
    super();
  }
  writeContentWithBreakLine(str: string) {
    this.content = `${this.content}${str}\n`;
  }

  genValueFromRange(range: assemblyscript.Range): string {
    return range.source.text.substring(range.start, range.end);;
  }

  transformAscTypeToCType(type: assemblyscript.TypeNode, name: string = ""): string {
    const typeString = this.genValueFromRange(type.range);
    if (this.functionPtrSet.includes(name) && (typeString === "i32" || typeString === "u32" || typeString === "usize")) {
      return name;
    }

    const cppTypeString: string | undefined = this.typeMap.get(typeString);
    if (cppTypeString) {
      return cppTypeString;
    } else {
      return typeString;
    }
  }

  visitEnumDeclaration(node: assemblyscript.EnumDeclaration, isDefault?: boolean): void {
    // console.log(node.range.source.text.substring(node.range.start, node.range.end));
    this.writeContentWithBreakLine(`enum class ${node.name.text}{`);
    for (const item of node.values) {
      if (item["initializer"] && item.initializer.range && (item.initializer.range.end - item.initializer.range.start > 0)) {
        if (this.genValueFromRange(item.initializer.range).startsWith("0x") || this.genValueFromRange(item.initializer.range).startsWith("0X")) {
          this.writeContentWithBreakLine(`${item.name.text}=0x${Number(item.initializer["value"]["low"]).toString(16)},`);
        }
        else {
          this.writeContentWithBreakLine(`${item.name.text}=${Number(item.initializer["value"]["low"]).toString()},`);
        }
      } else {
        this.writeContentWithBreakLine(`${item.name.text},`);
      }

    }
    this.writeContentWithBreakLine(`};`);
    super.visitEnumDeclaration(node, isDefault);
  }

  visitFunctionDeclaration(node: FunctionDeclaration, isDefault?: boolean): void {
    let functionCDefine = "";
    let returnType: string;
    if (this.genValueFromRange(node.signature.returnType.range) !== "") {
      returnType = this.transformAscTypeToCType(node.signature.returnType);
    } else {
      returnType = "void";
    }
    functionCDefine += ` __attribute__((import_module(\"${node.range.source.simplePath}\"))) ${returnType} ${node.name.text}(`;

    for (let i = 0; i < node.signature.parameters.length; ++i) {
      const parameter = node.signature.parameters[i];
      let endChar = ",";
      if (i === (node.signature.parameters.length - 1)) {
        endChar = "";
      }
      const cType = this.transformAscTypeToCType(parameter.type, parameter.name.text);
      functionCDefine += `${cType} ${parameter.name.text} ${endChar}`;
    }
    functionCDefine += ') noexcept;';
    this.writeContentWithBreakLine(functionCDefine);
    super.visitFunctionDeclaration(node, isDefault);
  }

  visitTypeDeclaration(node: assemblyscript.TypeDeclaration): void {
    if (node.type.kind === assemblyscript.NodeKind.FunctionType) { // hanlde function type
      const functionTypeNode = node.type as assemblyscript.FunctionTypeNode;
      let functionCDefine = "";
      functionCDefine += `using ${node.name.text} = ${this.transformAscTypeToCType(functionTypeNode.returnType)} (*) (`;
      this.functionPtrSet.push(`${node.name.text}`);
      for (let i = 0; i < functionTypeNode.parameters.length; ++i) {
        const parameter = functionTypeNode.parameters[i];
        let endChar = ",";
        if (i === (functionTypeNode.parameters.length - 1)) {
          endChar = "";
        }
        functionCDefine += `${this.transformAscTypeToCType(parameter.type)} ${parameter.name.text} ${endChar}`;
      }
      functionCDefine += ');';
      this.writeContentWithBreakLine(functionCDefine);
    }
    super.visitTypeDeclaration(node);
  }
}

const compilerOptions = assemblyscript.newOptions();
const program = assemblyscript.newProgram(compilerOptions);
let inputFileName = "";
let outputFileName = "";
for (let i = 0; i < argv.length; ++i) {
  const arg = argv[i];
  switch (arg) {
    case "-f":
      inputFileName = argv[i + 1];
      break;
    case "-o":
      outputFileName = argv[i + 1];
  }
}
const sourceText = fs.readFileSync(inputFileName, { encoding: "utf8" }).replace(/\r?\n/g, "\n");
assemblyscript.parse(program, sourceText, inputFileName, true);
const builder = new CDCHeaderTransfer();
builder.visitNode(program.sources[0]);
const cHeaderContent = `
#ifndef __types_wasm_${program.sources[0].simplePath}_H__
#define __types_wasm_${program.sources[0].simplePath}_H__
#include <stdint.h>
extern "C" {
${builder.content}
}
#endif
`;
builder.finish();
/* c8 ignore next 3 */
if (outputFileName === "") {
  outputFileName = `${program.sources[0].internalPath}.h`;
}
fs.writeFileSync(outputFileName, cHeaderContent);
// console.log(cHeaderContent);
