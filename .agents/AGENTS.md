# Compilation Fix Freeze Rule

The firmware is now in compilation stabilization mode.

Do not introduce new features, architectural refactors, optimizations, or API changes during compilation fixes.

For each Arduino IDE compile:
1. Read the first compiler error only.
2. Identify the root cause.
3. Modify only the minimum number of files required to fix that error.
4. Recompile.
5. Repeat until the Arduino IDE reports "Done compiling."

Do not fix hypothetical problems that the compiler has not yet reported.

The firmware is not considered compile-ready until it successfully builds on:
- Arduino IDE 2.3.x
- Arduino Mega 2560
- Arduino AVR Boards 1.8.7
