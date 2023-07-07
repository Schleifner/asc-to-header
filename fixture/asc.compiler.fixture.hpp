
// clang-format off
#ifndef __TEST_HEADER_IDENTIFIER__
#define __TEST_HEADER_IDENTIFIER__
#include <cstdint>
namespace testNamespace{
enum class Status10 : uint32_t {
OK=0,
FAIL=1,
};
enum class Status16 : uint32_t {
OK=0x0,
FAIL=0xff,
};
enum class Another : uint32_t {
OK,
FAIL=0x1,
};
using CustomCallback = void (*) (int32_t userData );
void Test(int32_t a ,int64_t b ,uint32_t c ,uint64_t d ,int16_t e ,uint16_t f ,uint8_t g ,int8_t h ,bool i ,Status10 j ,Status16 k ,int32_t CustomCallback ,float m ,double n ) noexcept;
uint32_t Test2(uint32_t CustomCallback ,uint32_t userData ) noexcept;
uint32_t Test3(int32_t ptr ,uint32_t pointer ,uint32_t myPtr ,uint32_t myPointer ) noexcept;

}
#endif
