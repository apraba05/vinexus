/**
 * Tests for the CWD detection logic used in the legacy terminal WebSocket handler.
 * The handler uses a regex to detect OSC escape sequences containing the CWD,
 * injected by PROMPT_COMMAND on the remote shell.
 */

// Replicate the regex from multiplexer.ts
const CWD_REGEX = /\x1b\]7;CWD:([^\x07]+)\x07/g;

function extractCwd(data: string): string | null {
    CWD_REGEX.lastIndex = 0;
    const match = CWD_REGEX.exec(data);
    return match ? match[1] : null;
}

function extractAllCwds(data: string): string[] {
    CWD_REGEX.lastIndex = 0;
    const results: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = CWD_REGEX.exec(data)) !== null) {
        results.push(match[1]);
    }
    return results;
}

function stripCwdSequences(data: string): string {
    return data.replace(CWD_REGEX, "");
}

describe("CWD detection from OSC7 escape sequences", () => {
    it("detects CWD from simple path", () => {
        const data = "\x1b]7;CWD:/var/log\x07";
        expect(extractCwd(data)).toBe("/var/log");
    });

    it("detects CWD from home directory", () => {
        const data = "\x1b]7;CWD:/home/ubuntu\x07";
        expect(extractCwd(data)).toBe("/home/ubuntu");
    });

    it("detects CWD from root", () => {
        const data = "\x1b]7;CWD:/\x07";
        expect(extractCwd(data)).toBe("/");
    });

    it("detects CWD with path containing spaces", () => {
        const data = "\x1b]7;CWD:/home/user/my project\x07";
        expect(extractCwd(data)).toBe("/home/user/my project");
    });

    it("returns null for regular terminal output", () => {
        const data = "total 32\ndrwxr-xr-x  2 user user 4096 Jan  1 00:00 docs\n";
        expect(extractCwd(data)).toBeNull();
    });

    it("returns null for empty data", () => {
        expect(extractCwd("")).toBeNull();
    });

    it("extracts CWD embedded in terminal output", () => {
        const data = "some output\x1b]7;CWD:/tmp\x07more output";
        expect(extractCwd(data)).toBe("/tmp");
    });

    it("strips CWD sequences from output", () => {
        const data = "before\x1b]7;CWD:/var/log\x07after";
        expect(stripCwdSequences(data)).toBe("beforeafter");
    });

    it("strips multiple CWD sequences", () => {
        const data = "a\x1b]7;CWD:/tmp\x07b\x1b]7;CWD:/home\x07c";
        expect(stripCwdSequences(data)).toBe("abc");
    });

    it("extracts multiple CWDs from output", () => {
        const data = "\x1b]7;CWD:/tmp\x07\x1b]7;CWD:/home\x07";
        expect(extractAllCwds(data)).toEqual(["/tmp", "/home"]);
    });

    it("does not match incomplete sequences", () => {
        const data = "\x1b]7;CWD:/tmp"; // missing \x07
        expect(extractCwd(data)).toBeNull();
    });

    it("does not match wrong prefix", () => {
        const data = "\x1b]8;CWD:/tmp\x07"; // wrong number
        expect(extractCwd(data)).toBeNull();
    });
});
