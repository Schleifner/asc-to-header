/* eslint-disable node/no-unpublished-import */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from "node:assert";
import * as Path from "node:path";
import { fileURLToPath } from "node:url";

import { suite, test } from "mocha";

import { AscToHeaderConvertor } from "../src/index.js";

suite("Test AscToHeaderConvertor", () => {
  const PROJECT_ROOT = Path.dirname(Path.dirname(Path.dirname(fileURLToPath(import.meta.url))));
  const inputFile = Path.join(PROJECT_ROOT, "fixture", "asc1.ts");
  const badInputFile = Path.join(PROJECT_ROOT, "fixture", "badEnum.ts"); //enum with string
  const outputFile = Path.join(PROJECT_ROOT, "build", "asc1.hpp");

  test("test wrong input path", () => {
    const ascToHeaderConvertor = new AscToHeaderConvertor();
    const success = ascToHeaderConvertor.generateHpp("ab", "dc");
    assert(!success);
  });

  test("test wrong output path", () => {
    const ascToHeaderConvertor = new AscToHeaderConvertor();
    const success = ascToHeaderConvertor.generateHpp(inputFile, "/not_exist_path");
    assert(!success);
  });

  test("convert success", () => {
    const ascToHeaderConvertor = new AscToHeaderConvertor();
    const success = ascToHeaderConvertor.generateHpp(inputFile, outputFile);
    assert(success);
  });

  test("convert fail", () => {
    const ascToHeaderConvertor = new AscToHeaderConvertor();
    const success = ascToHeaderConvertor.generateHpp(badInputFile, outputFile);
    assert(!success);
  });
});
