# AssemblyScript C Header Translator

## build
`npm run build`
## run
`node --experimental-modules build/index.js -f [input assemblyscript file] -o [target header file]`  
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
extern "C" {
enum class Status {
  OK = 0x1,
  FAIL = 0x2,
};
__attribute__((import_module("example"))) void printStatus(Status Status);

}
#endif


```

## cuation

For function type declaration, when use it in the function parameter, should use the same name.  
for example:  
ASC
```typescript
export type mycallback = (data: i32) => void;
export function callService(mycallback: i32):void;
```
then we can translate to:  
```C++
using mycallback = void (*) (int data);
 __attribute__((import_module("test"))) void callService(mycallback mycallback);

```

but if we got asc like:  
ASC
```typescript
export type mycallback = (data: i32) => void;
export function callService(my_callback: i32):void;
```
then we can translate to:  
```C++
using mycallback = void (*) (int data);
 __attribute__((import_module("test"))) void callService(int my_callback);

```
