import * as assemblyscript from "assemblyscript";

export class CppHeaderTransfer extends assemblyscript.ASTBuilder {
  public constructor(compiler: boolean) {
    super();
    this.compiler = compiler;
  }
  private compiler;
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
    ["boolean", "bool"],
  ]);

  private writeContentWithBreakLine(str: string) {
    this.content = `${this.content}${str}\n`;
  }

  private genValueFromRange(range: assemblyscript.Range): string {
    return range.source.text.slice(range.start, range.end);
  }

  private transformAscTypeToCType(type: assemblyscript.TypeNode, name = ""): string {
    const typeString = this.genValueFromRange(type.range);
    if (!this.compiler) {
      // for JIT compiler, keep ( i32 / U32 / usize ) type transform logic
      const isPtrType: boolean = typeString === "i32" || typeString === "u32" || typeString === "usize";
      if (this.functionPtrSet.includes(name) && isPtrType) {
        return name;
      }

      // filter all xxPtr or xxPointer parameter and return the void* type
      const isPtrName: boolean =
        name.endsWith("Ptr") || name.endsWith("Pointer") || name === "ptr" || name === "pointer";

      if (isPtrName && isPtrType) {
        return "void *";
      }
    }
    const cppTypeString: string | undefined = this.typeMap.get(typeString);
    if (this.compiler && cppTypeString && cppTypeString === "uintptr_t") {
      // for compiler transform, all point type should be uint32_t
      return "uint32_t";
    }
    return cppTypeString ?? typeString;
  }

  public visitEnumDeclaration(node: assemblyscript.EnumDeclaration, isDefault?: boolean): void {
    this.writeContentWithBreakLine(`enum class ${node.name.text} ${this.compiler ? ": uint32_t " : ""}{`);
    for (const item of node.values) {
      if (item.initializer === null) {
        this.writeContentWithBreakLine(`${item.name.text},`);
      } else {
        const expr = item.initializer;
        if (
          expr instanceof assemblyscript.IntegerLiteralExpression ||
          (expr instanceof assemblyscript.UnaryPrefixExpression &&
            expr.operand instanceof assemblyscript.IntegerLiteralExpression)
        ) {
          this.writeContentWithBreakLine(`${item.name.text}=${this.genValueFromRange(expr.range)},`);
        } else {
          throw new TypeError(
            `enum expr not supported: ${item.name.text}=${this.genValueFromRange(
              expr.range
            )}. (Only unary expression with integer literal and integer literal are supported.)`
          );
        }
      }
    }
    this.writeContentWithBreakLine(`};`);
    super.visitEnumDeclaration(node, isDefault);
  }

  public visitFunctionDeclaration(node: assemblyscript.FunctionDeclaration, isDefault?: boolean): void {
    let functionCDefine = "";
    const returnType =
      this.genValueFromRange(node.signature.returnType.range) === ""
        ? "void"
        : this.transformAscTypeToCType(node.signature.returnType);
    const compilerPrefix = this.compiler ? "" : `WASM_IMPORT_ATTRIBUTE("${node.range.source.simplePath}") `;
    functionCDefine += `${compilerPrefix}${returnType} ${node.name.text}(`;

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
