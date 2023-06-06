import * as assemblyscript from "assemblyscript";

export class CppHeaderTransfer extends assemblyscript.ASTBuilder {
  private functionPtrSet = [];
  private content = "";
  private typeMap: Map<string, string> = new Map<string, string>([
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
    ["usize", "uintptr_t"],
    ["UserDataType", "uintptr_t"],
    ["boolean", "bool"]
  ]);

  private writeContentWithBreakLine(str: string) {
    this.content = `${this.content}${str}\n`;
  }

  private genValueFromRange(range: assemblyscript.Range): string {
    return range.source.text.substring(range.start, range.end);
  }

  private transformAscTypeToCType(type: assemblyscript.TypeNode, name = ""): string {
    const typeString = this.genValueFromRange(type.range);
    const isPtrType: boolean = typeString === "i32" || typeString === "u32" || typeString === "usize";
    if (this.functionPtrSet.includes(name) && isPtrType) {
      return name;
    }

    // filter all xxPtr or xxPointer parameter and return the void* type
    const isPtrName: boolean = name.endsWith("Ptr") || name.endsWith("Pointer") || name === "ptr" || name === "pointer";

    if (isPtrName && isPtrType) {
      return "void *";
    }

    const cppTypeString: string | undefined = this.typeMap.get(typeString);
    if (cppTypeString) {
      return cppTypeString;
    } else {
      return typeString;
    }
  }

  public visitEnumDeclaration(node: assemblyscript.EnumDeclaration, isDefault?: boolean): void {
    // console.log(node.range.source.text.substring(node.range.start, node.range.end));
    this.writeContentWithBreakLine(`enum class ${node.name.text}{`);
    for (const item of node.values) {
      if (
        item["initializer"] &&
        item.initializer.range &&
        item.initializer.range.end - item.initializer.range.start > 0
      ) {
        if (
          this.genValueFromRange(item.initializer.range).startsWith("0x") ||
          this.genValueFromRange(item.initializer.range).startsWith("0X")
        ) {
          this.writeContentWithBreakLine(
            `${item.name.text}=0x${Number(item.initializer["value"]["low"]).toString(16)},`
          );
        } else {
          this.writeContentWithBreakLine(`${item.name.text}=${Number(item.initializer["value"]["low"]).toString()},`);
        }
      } else {
        this.writeContentWithBreakLine(`${item.name.text},`);
      }
    }
    this.writeContentWithBreakLine(`};`);
    super.visitEnumDeclaration(node, isDefault);
  }

  public visitFunctionDeclaration(node: assemblyscript.FunctionDeclaration, isDefault?: boolean): void {
    let functionCDefine = "";
    let returnType: string;
    if (this.genValueFromRange(node.signature.returnType.range) === "") {
      returnType = "void";
    } else {
      returnType = this.transformAscTypeToCType(node.signature.returnType);
    }
    functionCDefine += ` __attribute__((import_module("${node.range.source.simplePath}"))) ${returnType} ${node.name.text}(`;

    for (let i = 0; i < node.signature.parameters.length; ++i) {
      const parameter = node.signature.parameters[i];
      let endChar = ",";
      if (i === node.signature.parameters.length - 1) {
        endChar = "";
      }
      const cType = this.transformAscTypeToCType(parameter.type, parameter.name.text);
      functionCDefine += `${cType} ${parameter.name.text} ${endChar}`;
    }
    functionCDefine += ") noexcept;";
    this.writeContentWithBreakLine(functionCDefine);
    super.visitFunctionDeclaration(node, isDefault);
  }

  public visitTypeDeclaration(node: assemblyscript.TypeDeclaration): void {
    if (node.type.kind === assemblyscript.NodeKind.FunctionType) {
      // handle function type
      const functionTypeNode = node.type as assemblyscript.FunctionTypeNode;
      let functionCDefine = "";
      functionCDefine += `using ${node.name.text} = ${this.transformAscTypeToCType(functionTypeNode.returnType)} (*) (`;
      this.functionPtrSet.push(`${node.name.text}`);
      for (let i = 0; i < functionTypeNode.parameters.length; ++i) {
        const parameter = functionTypeNode.parameters[i];
        let endChar = ",";
        if (i === functionTypeNode.parameters.length - 1) {
          endChar = "";
        }
        functionCDefine += `${this.transformAscTypeToCType(parameter.type)} ${parameter.name.text} ${endChar}`;
      }
      functionCDefine += ");";
      this.writeContentWithBreakLine(functionCDefine);
    }
    super.visitTypeDeclaration(node);
  }

  public getHppContent(): string {
    return this.content;
  }
}
