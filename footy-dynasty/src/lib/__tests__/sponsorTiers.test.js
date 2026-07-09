import { describe, it, expect } from "vitest";
import { sponsorTier, negotiateStance, SPONSOR_STANCES } from "../finance/sponsorTiers.js";

describe("sponsorTier", () => {
  it("classifies Major/Premier/Stadium as Major, Apparel as Apparel, rest as Minor", () => {
    expect(sponsorTier({ type: 'Major' }).key).toBe('major');
    expect(sponsorTier({ type: 'Premier' }).key).toBe('major');
    expect(sponsorTier({ type: 'Stadium' }).key).toBe('major');
    expect(sponsorTier({ type: 'Apparel' }).key).toBe('apparel');
    expect(sponsorTier({ type: 'Community' }).key).toBe('minor');
    expect(sponsorTier({}).key).toBe('minor'); // unknown/absent
  });
});

describe("negotiateStance", () => {
  const offer = { annualValue: 1_000_000, yearsLeft: 3 };
  it("balanced is the identity", () => {
    expect(negotiateStance(offer, 'balanced')).toEqual({ annualValue: 1_000_000, yearsLeft: 3 });
    expect(negotiateStance(offer, undefined)).toEqual({ annualValue: 1_000_000, yearsLeft: 3 });
  });
  it("front-loaded raises value and shortens term", () => {
    const r = negotiateStance(offer, 'value');
    expect(r.annualValue).toBeGreaterThan(offer.annualValue);
    expect(r.yearsLeft).toBe(offer.yearsLeft - 1);
  });
  it("long-term lowers value and lengthens term", () => {
    const r = negotiateStance(offer, 'term');
    expect(r.annualValue).toBeLessThan(offer.annualValue);
    expect(r.yearsLeft).toBeGreaterThan(offer.yearsLeft);
  });
  it("never drops the term below 1 year (front-loaded on a 1-year deal)", () => {
    expect(negotiateStance({ annualValue: 500, yearsLeft: 1 }, 'value').yearsLeft).toBe(1);
  });
  it("is NaN-safe and deterministic", () => {
    const r = negotiateStance({ annualValue: NaN, yearsLeft: NaN }, 'value');
    expect(Number.isFinite(r.annualValue)).toBe(true);
    expect(r.yearsLeft).toBeGreaterThanOrEqual(1);
    expect(negotiateStance(offer, 'term')).toEqual(negotiateStance(offer, 'term'));
  });
  it("exposes exactly three stances", () => {
    expect(SPONSOR_STANCES.map((s) => s.key)).toEqual(['balanced', 'value', 'term']);
  });
});
