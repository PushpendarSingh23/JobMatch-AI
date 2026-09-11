import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/config/redis", () => ({
  createRedisConnection: () => ({
    status: "ready",
    ping: async () => "PONG",
    on: () => {},
    subscribe: (_ch: string, cb?: (err: Error | null) => void) => cb?.(null),
  }),
}));

import request from "supertest";
import app from "../../src/app";

describe("GET /health", () => {
  it("reports ok when db and redis are reachable", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.checks).toMatchObject({ db: "ok", redis: "ok" });
  });
});
