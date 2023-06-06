import {argv} from "process";

import {AscToHeaderConvertor} from "./AscToHeaderConverter.js";

let inputFileName = "";
let outputFileName = "";
for (let i = 0; i < argv.length; ++i) {
  const arg = argv[i];
  switch (arg) {
    case "-f": {
      inputFileName = argv[i + 1];
      break;
    }
    case "-o": {
      outputFileName = argv[i + 1];
    }
  }
}

const ascToHeaderConvertor = new AscToHeaderConvertor();

ascToHeaderConvertor.generateHpp(inputFileName, outputFileName);
