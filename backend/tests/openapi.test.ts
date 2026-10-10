import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Swagger API documentation", () => {
  it("serves Swagger UI and documents only existing API paths", async () => {
    const response = await request(app).get("/api-docs/");
    const configuration = await request(app).get("/api-docs/swagger-ui-init.js");

    expect(response.status).toBe(200);
    expect(response.text).toContain("NeoStats API Documentation");
    expect(configuration.status).toBe(200);
    expect(configuration.text).toContain('"/health"');
    expect(configuration.text).toContain('"/tasks"');
    expect(configuration.text).toContain("cookieAuth");
    expect(configuration.text).toContain("bearerAuth");
    expect(configuration.text).not.toContain('"/projects/{id}/tasks"');
  });

  it("keeps the existing health endpoint available", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "neostats-api" });
  });
});
