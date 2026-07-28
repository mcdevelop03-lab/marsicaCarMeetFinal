import { describe, it, expect } from "vitest";
import { estraiIdYouTube } from "./youtube";

describe("estraiIdYouTube", () => {
  it("watch?v=ID", () => {
    expect(estraiIdYouTube("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("youtu.be/ID", () => {
    expect(estraiIdYouTube("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("watch con parametri extra (&t=, &list=)", () => {
    expect(estraiIdYouTube("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLxyz")).toBe(
      "dQw4w9WgXcQ",
    );
  });
  it("youtu.be con parametro ?t=", () => {
    expect(estraiIdYouTube("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe("dQw4w9WgXcQ");
  });
  it("embed/ID", () => {
    expect(estraiIdYouTube("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("shorts/ID", () => {
    expect(estraiIdYouTube("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("senza protocollo (youtu.be/ID)", () => {
    expect(estraiIdYouTube("youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("con spazi ai bordi", () => {
    expect(estraiIdYouTube("  https://youtu.be/dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });
  it("URL non-YouTube → null", () => {
    expect(estraiIdYouTube("https://vimeo.com/12345678")).toBeNull();
  });
  it("stringa vuota / solo spazi → null", () => {
    expect(estraiIdYouTube("")).toBeNull();
    expect(estraiIdYouTube("   ")).toBeNull();
  });
  it("id di lunghezza errata → null", () => {
    expect(estraiIdYouTube("https://youtu.be/short")).toBeNull();
  });
  it("testo qualsiasi non-URL → null", () => {
    expect(estraiIdYouTube("pippo")).toBeNull();
  });
});
