/**
 * Normalize a filesystem path: collapse multiple slashes,
 * strip trailing slash (except root "/"), and ensure leading "/".
 */
export function normalizePath(p: string): string {
    if (!p || typeof p !== "string") return "/";
    // Collapse multiple consecutive slashes into one
    let normalized = p.replace(/\/+/g, "/");
    // Strip trailing slash unless it's the root "/"
    if (normalized.length > 1 && normalized.endsWith("/")) {
        normalized = normalized.slice(0, -1);
    }
    // Ensure leading slash
    if (!normalized.startsWith("/")) {
        normalized = "/" + normalized;
    }
    return normalized || "/";
}

/**
 * Build a child path from a parent directory and a child name.
 * Handles root "/" correctly to avoid double slashes.
 */
export function joinPath(parentPath: string, name: string): string {
    const parent = normalizePath(parentPath);
    return parent === "/" ? "/" + name : parent + "/" + name;
}
