import assert from "node:assert/strict";
import test from "node:test";
import { isEmailAllowed, parseAllowedEmails } from "./auth-allowlist";

test("parseAllowedEmails accepts comma and whitespace separators", () => {
  assert.deepEqual(
    [...parseAllowedEmails("one@example.com, TWO@example.com\nthree@example.com")],
    ["one@example.com", "two@example.com", "three@example.com"]
  );
});

test("isEmailAllowed compares email addresses case-insensitively", () => {
  assert.equal(isEmailAllowed("MAX.C.LV@GMAIL.COM", "max.c.lv@gmail.com"), true);
});

test("isEmailAllowed fails closed for missing users and empty allowlists", () => {
  assert.equal(isEmailAllowed(undefined, "max.c.lv@gmail.com"), false);
  assert.equal(isEmailAllowed("max.c.lv@gmail.com", ""), false);
});
