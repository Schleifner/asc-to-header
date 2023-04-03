// import { Program, Options, ASTBuilder } from "../node_modules/assemblyscript/dist/assemblyscript.js";
import * as fs from 'fs';
import path from "path";
import { argv } from 'process';
import { FunctionDeclaration, FunctionExpression, MethodDeclaration } from "types:assemblyscript/src/ast";
import * as assemblyscript from "../node_modules/assemblyscript/dist/assemblyscript.js";

class CDCHeaderTransfer extends assemblyscript.ASTBuilder {
  functionPtrSet = new Array();
  content="";
  constructor() {
    super();
  }
  writeContentWithBreakLine(str: string) {
    this.content += str;
    this.content += '\n';
  }

  genValueFromRange(range: assemblyscript.Range): string {
    return range.source.text.substring(range.start, range.end);;
  }

  transformAscTypeToCType(type: assemblyscript.TypeNode): string {
    const typeString = this.genValueFromRange(type.range);
    switch (typeString) {
      case "void":
        return "void";
      case "i32":
        return "int";
      case "u32":
        return "unsigned int";
      case "u64":
        return "unsigned long long int";
      case "i64":
        return "long long int";
      case "f32":
        return "float";
      case "f64":
        return "double";
      case "boolean":
        return "bool";
      case "u8":
        return "unsigned char";
      case "i8":
        return "char";
      case "u16":
        return "unsigned short";
      case "i16":
        return "short";
      default:
        return typeString;
    }
  }

  visitEnumDeclaration(node: assemblyscript.EnumDeclaration, isDefault?: boolean): void {
    // console.log(node.range.source.text.substring(node.range.start, node.range.end));
    this.writeContentWithBreakLine(`enum class ${node.name.text}{`);
    for (const item of node.values) {
      if (item["initializer"] && item.initializer["value"] && item.initializer["value"]["low"]) {
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
    let functionCDefine = ""
    functionCDefine += ` __attribute__((import_module(\"${node.range.source.simplePath}\"))) ${this.transformAscTypeToCType(node.signature.returnType)} ${node.name.text}(`;

    for (let i = 0; i < node.signature.parameters.length; ++i) {
      const parameter = node.signature.parameters[i];
      let endChar = ",";
      if (i === (node.signature.parameters.length - 1)) {
        endChar = "";
      }
      const cType = this.transformAscTypeToCType(parameter.type);
      if (this.functionPtrSet.includes(`${parameter.name.text}`) && (cType === "int" || cType === "unsigned int")) {
        functionCDefine += `${parameter.name.text} ${parameter.name.text} ${endChar}`;
      } else {
        functionCDefine += `${cType} ${parameter.name.text} ${endChar}`;
      }
    }
    functionCDefine += ');';
    this.writeContentWithBreakLine(functionCDefine);
    super.visitFunctionDeclaration(node, isDefault);
  }

  visitTypeDeclaration(node: assemblyscript.TypeDeclaration): void {
    if (node.type.kind === assemblyscript.NodeKind.FunctionType) { // hanlde function type
      const functionTypeNode = node.type as assemblyscript.FunctionTypeNode;
      let functionCDefine = "";
      functionCDefine += `typedef ${this.transformAscTypeToCType(functionTypeNode.returnType)} (*${node.name.text}) (`;
      this.functionPtrSet.push(`${node.name.text}`);
      for (let i = 0; i < functionTypeNode.parameters.length; ++i) {
        const parameter = functionTypeNode.parameters[i];
        const typeStr = parameter.type.range.source.text.substring(parameter.type.range.start, parameter.type.range.end);
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
let cHeaderContent = `
#ifndef __types_wasm_${program.sources[0].simplePath}_H__
#define __types_wasm_${program.sources[0].simplePath}_H__
#ifdef __cplusplus
extern "C" {
#endif
`;
const builder = new CDCHeaderTransfer();
builder.visitNode(program.sources[0]);
cHeaderContent += builder.content;
builder.finish();
cHeaderContent += `
#ifdef __cplusplus
}
#endif
#endif
`;
/* c8 ignore next */
if(outputFileName === "") {
  /* c8 ignore next */
  outputFileName = `${program.sources[0].internalPath}.h`;
}
fs.writeFileSync(outputFileName, cHeaderContent);
// console.log(cHeaderContent);
