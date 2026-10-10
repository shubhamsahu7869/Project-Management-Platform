import { describe, expect, it } from "vitest";
import { login, taskUpdate, userCreate } from "../src/validation.js";

describe("request validation contracts", () => {
  it("normalizes login email and ignores client-supplied role fields", () => {
    expect(login.parse({
      email: "  MEMBER@NEOSTATS.LOCAL ",
      password: "DemoPass123!",
      role: "ADMIN"
    })).toEqual({
      email: "member@neostats.local",
      password: "DemoPass123!"
    });
  });

  it("requires a current positive task version for updates", () => {
    expect(taskUpdate.safeParse({ status: "DONE" }).success).toBe(false);
    expect(taskUpdate.safeParse({ status: "DONE", version: 0 }).success).toBe(false);
    expect(taskUpdate.parse({ status: "DONE", version: 3 })).toEqual({ status: "DONE", version: 3 });
  });

  it("rejects weak passwords and invalid roles when creating users", () => {
    const base = { name: "Member User", email: "member@neostats.local", password: "short" };
    expect(userCreate.safeParse({ ...base, role: "ADMIN" }).success).toBe(false);
    expect(userCreate.safeParse({ ...base, password: "Welcome123!", role: "OWNER" }).success).toBe(false);
    expect(userCreate.safeParse({ ...base, password: "Welcome123!", role: "TEAM_MEMBER" }).success).toBe(true);
    expect(userCreate.parse({ ...base, email: " MEMBER@NEOSTATS.LOCAL ", password: "Welcome123!", role: "TEAM_MEMBER" }).email)
      .toBe("member@neostats.local");
  });
});
