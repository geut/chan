import { describe, expect, it } from "vitest"
import * as analyze from "../src/commands/analyze.js"

describe("analyze", () => {
  it("exports yarg command structure", () => {
    expect(analyze.command).toMatch(/analyze/)
    expect(analyze.description).toBeDefined()
    expect(analyze.builder).toBeDefined()
    expect(analyze.builder).toHaveProperty("gitSha")
    expect(analyze.builder).toHaveProperty("auto")
    expect(analyze.builder).toHaveProperty("aiProvider")
    expect(analyze.builder).toHaveProperty("aiModel")
    expect(analyze.handler).toBeDefined()
  })
})
