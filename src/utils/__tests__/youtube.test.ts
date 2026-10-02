import { extractYoutubeId } from "../youtube";

describe("extractYoutubeId", () => {
  it("should extract raw 11-character video ID", () => {
    expect(extractYoutubeId("FSBkTI1QuvY")).toBe("FSBkTI1QuvY");
  });

  it("should extract video ID from standard youtube.com watch URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=FSBkTI1QuvY")).toBe("FSBkTI1QuvY");
    expect(extractYoutubeId("https://youtube.com/watch?v=FSBkTI1QuvY&feature=share")).toBe("FSBkTI1QuvY");
  });

  it("should extract video ID from youtu.be short URL", () => {
    expect(extractYoutubeId("https://youtu.be/FSBkTI1QuvY")).toBe("FSBkTI1QuvY");
    expect(extractYoutubeId("https://youtu.be/FSBkTI1QuvY?t=42")).toBe("FSBkTI1QuvY");
  });

  it("should extract video ID from shorts URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/shorts/FSBkTI1QuvY")).toBe("FSBkTI1QuvY");
  });

  it("should extract video ID from embed URL", () => {
    expect(extractYoutubeId("https://www.youtube.com/embed/FSBkTI1QuvY")).toBe("FSBkTI1QuvY");
  });

  it("should return null for invalid inputs", () => {
    expect(extractYoutubeId("")).toBeNull();
    expect(extractYoutubeId("not a url")).toBeNull();
  });
});
