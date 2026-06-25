/**
 * Run with: npx tsx src/tests/register-validation.test.ts
 */
import {
  formatNorwegianPhone,
  isValidNorwegianPhone,
  normalizeNorwegianPhone,
} from "@/lib/utils/phone";
import { isValidOrgNumber } from "@/lib/services/breg";

const PASS = "✅";
const FAIL = "❌";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`${PASS} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${FAIL} ${name}`);
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

test("normalizeNorwegianPhone strips +47 prefix", () => {
  assert(normalizeNorwegianPhone("+47 912 34 567") === "91234567", "expected 8 digits");
});

test("isValidNorwegianPhone accepts 8 digits", () => {
  assert(isValidNorwegianPhone("91234567"), "8 digits valid");
  assert(isValidNorwegianPhone("+47 912 34 567"), "+47 format valid");
});

test("isValidNorwegianPhone rejects too short", () => {
  assert(!isValidNorwegianPhone("12345"), "too short");
});

test("formatNorwegianPhone groups digits", () => {
  assert(formatNorwegianPhone("91234567") === "912 34 567", "formatted phone");
});

test("isValidOrgNumber accepts 9 digits", () => {
  assert(isValidOrgNumber("123456789"), "valid org");
  assert(isValidOrgNumber("123 456 789"), "valid org with spaces");
});

test("isValidOrgNumber rejects invalid", () => {
  assert(!isValidOrgNumber("12345"), "too short");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
