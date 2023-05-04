enum Status10 {
    OK = 0,
    FAIL = 1,
}

enum Status16 {
    OK = 0x0,
    FAIL = 0xff,
}
enum Another {
    OK,
    FAIL = 0x1
}

export type CustomCallback = (userData: i32) => void;

export declare function Test(a: i32, b: i64, c: u32, d: u64, e: i16, f: u16, g: u8, h: i8, i: boolean, j: Status10, k: Status16, CustomCallback: i32, m:f32, n:f64);
export declare function Test2(CustomCallback: u32): u32;
