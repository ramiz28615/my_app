/* Dimensia JavaScript: browser sample + shared input contract on Node.js. */
"use strict";
async function main() {
  let numbers = [1, 2, 3, 4, 5];
  if (typeof process !== "undefined" && process.versions?.node) {
    const { readFileSync } = await import("node:fs");
    numbers = readFileSync("code-lab/shared/numbers.txt", "utf8")
      .trim().split(/\s+/).map(Number);
    if (numbers.some(x => !Number.isSafeInteger(x))) throw Error("Invalid integer input");
  }
  const total = numbers.reduce((sum, value) => sum + value, 0);
  console.log("Merhaba Dimensia JavaScript!");
  console.log("Toplam:", total);
  console.log("DIMENSIA_RESULT:" + JSON.stringify({count:numbers.length,sum:total}));
}
main().catch(error => { console.error(error); if (typeof process !== "undefined") process.exitCode = 1; });
