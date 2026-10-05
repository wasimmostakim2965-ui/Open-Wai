import { describe, expect, it } from "vitest";
import { assertExperimentalClawsEnabled, isExperimentalClawsEnabled } from "./experimental.js";

describe("experimental Claws gate", () => {
  it("is enabled by default", () => {
    expect(isExperimentalClawsEnabled({})).toBe(true);
  });

  it("honors explicit process opt-outs", () => {
    expect(isExperimentalClawsEnabled({ OPENCLAW_EXPERIMENTAL_CLAWS: "0" })).toBe(false);
    expect(isExperimentalClawsEnabled({ OPENCLAW_EXPERIMENTAL_CLAWS: "false" })).toBe(false);
    expect(isExperimentalClawsEnabled({ OPENCLAW_EXPERIMENTAL_CLAWS: "FALSE" })).toBe(false);
  });

  it("accepts explicit process opt-ins", () => {
    expect(isExperimentalClawsEnabled({ OPENCLAW_EXPERIMENTAL_CLAWS: "1" })).toBe(true);
    expect(isExperimentalClawsEnabled({ OPENCLAW_EXPERIMENTAL_CLAWS: "TRUE" })).toBe(true);
  });

  it("rejects direct handler access only when explicitly disabled", () => {
    expect(() => assertExperimentalClawsEnabled({})).not.toThrow();
    expect(() =>
      assertExperimentalClawsEnabled({ OPENCLAW_EXPERIMENTAL_CLAWS: "0" }),
    ).toThrow("OPENCLAW_EXPERIMENTAL_CLAWS");
  });
});
