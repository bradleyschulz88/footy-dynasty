import { describe, expect, it } from "vitest";
import { nextAutosaveDelayMs } from "../autosaveTiming.js";

describe("nextAutosaveDelayMs", () => {
  it("uses debounce immediately after burst starts", () => {
    expect(nextAutosaveDelayMs(1000, 1000, 450, 4000)).toBe(450);
  });

  it("shrinks delay as max dwell approaches", () => {
    expect(nextAutosaveDelayMs(4000, 1000, 450, 4000)).toBe(Math.min(450, 4000 - 3000)); // min(450,1000)=450
    expect(nextAutosaveDelayMs(4400, 1000, 450, 4000)).toBe(Math.min(450, 4000 - 3400)); // min(450,600)=450
    expect(nextAutosaveDelayMs(4700, 1000, 450, 4000)).toBe(Math.min(450, 4000 - 3700)); // min(450,300)=300
  });

  it("flushes as soon as max wait elapsed since burst started", () => {
    expect(nextAutosaveDelayMs(5001, 1000, 450, 4000)).toBe(0);
  });

  it("handles unset burst marker as full debounce budget", () => {
    expect(nextAutosaveDelayMs(1000, 0, 450, 4000)).toBe(Math.min(450, 4000));
  });
});
