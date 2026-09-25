import { describe, expect, it } from "vitest";
import { createGameSchema, messageSchema } from "@/lib/validation";

describe("Vertex validation", () => {
  it("accepts a valid game", () => {
    expect(createGameSchema.parse({title:"Neon City",description:"A test world",genre:"Adventure"}).title).toBe("Neon City");
  });
  it("rejects oversized messages", () => {
    expect(() => messageSchema.parse({content:"x".repeat(4001)})).toThrow();
  });
});
