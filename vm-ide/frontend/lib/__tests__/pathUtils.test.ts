import { normalizePath, joinPath } from "../pathUtils";

describe("normalizePath", () => {
    it("strips trailing slash", () => {
        expect(normalizePath("/home/")).toBe("/home");
    });

    it("strips multiple trailing slashes", () => {
        expect(normalizePath("/home///")).toBe("/home");
    });

    it("preserves root /", () => {
        expect(normalizePath("/")).toBe("/");
    });

    it("collapses multiple internal slashes", () => {
        expect(normalizePath("/home//user///docs")).toBe("/home/user/docs");
    });

    it("handles /home without trailing slash", () => {
        expect(normalizePath("/home")).toBe("/home");
    });

    it("returns / for empty string", () => {
        expect(normalizePath("")).toBe("/");
    });

    it("returns / for null-like values", () => {
        expect(normalizePath(null as any)).toBe("/");
        expect(normalizePath(undefined as any)).toBe("/");
    });

    it("adds leading slash if missing", () => {
        expect(normalizePath("home/user")).toBe("/home/user");
    });

    it("handles complex paths", () => {
        expect(normalizePath("//var///log//")).toBe("/var/log");
    });
});

describe("joinPath", () => {
    it("joins root path correctly", () => {
        expect(joinPath("/", "file.txt")).toBe("/file.txt");
    });

    it("joins normal path correctly", () => {
        expect(joinPath("/home", "file.txt")).toBe("/home/file.txt");
    });

    it("handles trailing slash in parent", () => {
        expect(joinPath("/home/", "file.txt")).toBe("/home/file.txt");
    });

    it("handles double slashes in parent", () => {
        expect(joinPath("/home//", "file.txt")).toBe("/home/file.txt");
    });

    it("handles /home specifically (the bug case)", () => {
        expect(joinPath("/home", "newfile.txt")).toBe("/home/newfile.txt");
        expect(joinPath("/home/", "newfile.txt")).toBe("/home/newfile.txt");
        expect(joinPath("/home//", "newfile.txt")).toBe("/home/newfile.txt");
    });
});
