import { describe, expect, it } from "vitest";
import { appUrl } from "./app-url";

describe("appUrl", () => {
  it("prefiere AUTH_URL sobre NEXTAUTH_URL", () => {
    expect(
      appUrl({ AUTH_URL: "https://malbecmotion.com", NEXTAUTH_URL: "https://viejo.ngrok-free.app" }),
    ).toBe("https://malbecmotion.com");
  });

  it("usa NEXTAUTH_URL si no hay AUTH_URL", () => {
    expect(appUrl({ NEXTAUTH_URL: "https://malbecmotion.com" })).toBe("https://malbecmotion.com");
  });

  it("quita la barra final para no armar URLs con //", () => {
    expect(appUrl({ AUTH_URL: "https://malbecmotion.com/" })).toBe("https://malbecmotion.com");
  });

  it("cae en localhost en desarrollo", () => {
    expect(appUrl({})).toBe("http://localhost:3000");
  });
});
