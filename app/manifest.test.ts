import manifest from "./manifest";

// 웹 앱 설명서 (COMPONENT_SPEC 11-1)
describe("manifest", () => {
  it("UI-113 이름·짧은 이름 '트레이스', 시작 주소 '/', 주소창 없이 열기, 192·512 아이콘과 512 maskable", () => {
    const result = manifest();

    expect(result.name).toBe("트레이스");
    expect(result.short_name).toBe("트레이스");
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512" }),
        expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512", purpose: "maskable" }),
      ]),
    );
  });
});
