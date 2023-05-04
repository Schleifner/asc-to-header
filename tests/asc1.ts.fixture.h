
#ifndef __types_wasm_asc1_H__
#define __types_wasm_asc1_H__
#include <stdint.h>
extern "C" {
enum class Status10{
OK=0,
FAIL=1,
};
enum class Status16{
OK=0x0,
FAIL=0xff,
};
enum class Another{
OK,
FAIL=0x1,
};
using CustomCallback = void (*) (int32_t userData );
 __attribute__((import_module("asc1"))) void Test(int32_t a ,int64_t b ,uint32_t c ,uint64_t d ,int16_t e ,uint16_t f ,uint8_t g ,int8_t h ,bool i ,Status10 j ,Status16 k ,CustomCallback CustomCallback ,float m ,double n ) noexcept;
 __attribute__((import_module("asc1"))) uint32_t Test2(CustomCallback CustomCallback ) noexcept;

}
#endif
