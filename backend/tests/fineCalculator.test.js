import { calculateFine } from "../services/fineCalculator.js";

describe("calculateFine", () => {
  test("returns 0 when returned on the due date", () => {
    expect(
      calculateFine("2026-09-14", "2026-09-14")
    ).toBe(0);
  });

  test("returns 0 when returned before the due date", () => {
    expect(
      calculateFine("2026-09-14", "2026-09-10")
    ).toBe(0);
  });

  test("returns 10 for one day late", () => {
    expect(
      calculateFine("2026-09-14", "2026-09-15")
    ).toBe(10);
  });

  test("returns 50 for five days late", () => {
    expect(
      calculateFine("2026-09-14", "2026-09-19")
    ).toBe(50);
  });

  test("calculates whole calendar days", () => {
    expect(
      calculateFine(
        "2026-09-14T23:59:00Z",
        "2026-09-15T01:00:00Z"
      )
    ).toBe(10);
  });
});