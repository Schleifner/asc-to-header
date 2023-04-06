
#ifndef __types_wasm_asc1_H__
#define __types_wasm_asc1_H__
extern "C" {
enum class Status10{
OK,
FAIL=1,
};
enum class Status16{
OK,
FAIL=0xff,
};
typedef void (*CustomCallback) (int userData );
 __attribute__((import_module("asc1")))  Test(int a ,long long int b ,unsigned int c ,unsigned long long int d ,short e ,unsigned short f ,unsigned char g ,char h ,bool i ,Status10 j ,Status16 k ,CustomCallback CustomCallback ,float m ,double n );
 __attribute__((import_module("asc1")))  Test2(CustomCallback CustomCallback );

}
#endif
