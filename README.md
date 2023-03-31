# AssemblyScript C Header Translator

## build
`npm run build`
## run
`node build/index.js -f [input assemblyscript file]`
output:  
C Header file

## Example
`example.ts`:  
```typescript
enum Status{
    OK=0x1,
    FAIL=0x2
}

export declare function printStatus(Status:Status);
```

output:  
`example.h`:  
```C++

#ifndef __types_wasm_example_H__
#define __types_wasm_example_H__
#ifdef __cplusplus
extern "C" {
#endif
enum class Status {
  OK = 0x1,
  FAIL = 0x2,
};
__attribute__((import_module("example"))) printStatus(Status Status);

#ifdef __cplusplus
}
#endif
#endif


```