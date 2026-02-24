"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { listDir, FileEntry, renameItem, deleteItem } from "@/lib/api";
import { normalizePath } from "@/lib/pathUtils";

interface CreatingItem {
  parentPath: string;
  type: "file" | "directory";
}

interface Props {
  sessionId: string | null;
  onSelectFile: (path: string) => void;
  onSelectDir?: (path: string) => void;
  selectedFile: string | null;
  onError: (msg: string) => void;
  onSuccess?: (msg: string) => void;
  refreshKey: number;
  softRefreshKey?: number;
  creatingItem?: CreatingItem | null;
  onCreateItem?: (parentPath: string, name: string, type: "file" | "directory") => Promise<void>;
  onCancelCreate?: () => void;
  onItemMoved?: (oldPath: string, newPath: string) => void;
  renamingPath?: string | null;
  onRenameComplete?: () => void;
  onDeleteItem?: (path: string) => void;
  onRootPathChange?: (path: string) => void;
  externalRootPath?: string;
}

interface TreeNode {
  entry: FileEntry;
  children?: TreeNode[];
  expanded: boolean;
  loading: boolean;
}

const fileIcons: Record<string, string> = {
  js: "JS", jsx: "JS", ts: "TS", tsx: "TS",
  py: "PY", rb: "RB", go: "GO", rs: "RS",
  java: "JV", json: "{ }", html: "<>", css: "#",
  md: "MD", sh: "$", yml: "YM", yaml: "YM",
  sql: "SQ", txt: "Tx", log: "Lg",
};

const fileColors: Record<string, string> = {
  js: "#f7df1e", jsx: "#61dafb", ts: "#3178c6", tsx: "#3178c6",
  py: "#3776ab", rb: "#cc342d", go: "#00add8", rs: "#dea584",
  java: "#ed8b00", json: "#0891b2", html: "#e34f26", css: "#1572b6",
  md: "#083fa1", sh: "#4ec9b0",
};

function getFileExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function basename(path: string): string {
  return path.split("/").pop() || path;
}

function getExpandedPaths(nodes: TreeNode[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node.expanded && node.entry.type === "directory") {
      paths.push(node.entry.path);
      if (node.children) {
        paths.push(...getExpandedPaths(node.children));
      }
    }
  }
  return paths;
}

function mergeChildren(existing: TreeNode[], newEntries: FileEntry[]): TreeNode[] | null {
  const existingNames = new Set(existing.map((n) => n.entry.name));
  const newNames = new Set(newEntries.map((e) => e.name));
  const hasChanges =
    newEntries.length !== existing.length ||
    newEntries.some((e) => !existingNames.has(e.name)) ||
    existing.some((n) => !newNames.has(n.entry.name));

  if (!hasChanges) return null; // no change

  return newEntries.map((entry) => {
    const ex = existing.find((n) => n.entry.path === entry.path);
    if (ex) return { ...ex, entry };
    return { entry, expanded: false, loading: false };
  });
}

function updateTreeForPath(
  nodes: TreeNode[],
  dirPath: string,
  newEntries: FileEntry[],
  rootPath: string
): TreeNode[] {
  if (dirPath === rootPath) {
    const merged = mergeChildren(nodes, newEntries);
    return merged || nodes;
  }

  return nodes.map((node) => {
    if (node.entry.path === dirPath && node.expanded && node.children) {
      const merged = mergeChildren(node.children, newEntries);
      if (!merged) return node;
      return { ...node, children: merged };
    }
    if (node.children && dirPath.startsWith(node.entry.path + "/")) {
      const updatedChildren = updateTreeForPath(node.children, dirPath, newEntries, rootPath);
      if (updatedChildren === node.children) return node;
      return { ...node, children: updatedChildren };
    }
    return node;
  });
}

export default function FileTree({
  sessionId,
  onSelectFile,
  onSelectDir,
  selectedFile,
  onError,
  onSuccess,
  refreshKey,
  softRefreshKey,
  creatingItem,
  onCreateItem,
  onCancelCreate,
  onItemMoved,
  renamingPath: externalRenamingPath,
  onRenameComplete,
  onDeleteItem,
  onRootPathChange,
  externalRootPath,
}: Props) {
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [rootPath, setRootPath] = useState("/home");
  const [inputValue, setInputValue] = useState("/home");
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [internalRenamingPath, setInternalRenamingPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; name: string } | null>(null);

  // Use external or internal renaming path
  const renamingPath = externalRenamingPath ?? internalRenamingPath;

  // Refs for polling
  const rootsRef = useRef(roots);
  rootsRef.current = roots;
  const pollingRef = useRef(false);
  const rootPathRef = useRef(rootPath);
  rootPathRef.current = rootPath;

  const loadDir = useCallback(
    async (path: string): Promise<TreeNode[]> => {
      if (!sessionId) return [];
      try {
        const res = await listDir(sessionId, path);
        return res.entries.map((entry) => ({
          entry,
          expanded: false,
          loading: false,
        }));
      } catch (err: any) {
        onError(err.message);
        return [];
      }
    },
    [sessionId, onError]
  );

  // Full reload on refreshKey change
  useEffect(() => {
    if (sessionId) {
      loadDir(rootPath).then(setRoots);
    } else {
      setRoots([]);
    }
  }, [sessionId, rootPath, loadDir, refreshKey]);

  // Sync with external root path changes (e.g. from terminal cd)
  useEffect(() => {
    if (!externalRootPath) return;
    const normalized = normalizePath(externalRootPath);
    if (normalized !== rootPath) {
      setRootPath(normalized);
      setInputValue(normalized);
    }
  }, [externalRootPath]);

  // Smart polling for real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const currentRoots = rootsRef.current;
        const currentRootPath = rootPathRef.current;
        const expandedPaths = getExpandedPaths(currentRoots);
        const pathsToRefresh = [currentRootPath, ...expandedPaths];

        for (const dirPath of pathsToRefresh) {
          try {
            const res = await listDir(sessionId, dirPath);
            setRoots((prev) => updateTreeForPath(prev, dirPath, res.entries, currentRootPath));
          } catch {
            // silently ignore polling errors
          }
        }
      } finally {
        pollingRef.current = false;
      }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [sessionId, softRefreshKey]);

  // Immediate poll when softRefreshKey changes (terminal activity)
  useEffect(() => {
    if (!sessionId || softRefreshKey === undefined || softRefreshKey === 0) return;

    const timer = setTimeout(async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const currentRoots = rootsRef.current;
        const currentRootPath = rootPathRef.current;
        const expandedPaths = getExpandedPaths(currentRoots);
        const pathsToRefresh = [currentRootPath, ...expandedPaths];
        for (const dirPath of pathsToRefresh) {
          try {
            const res = await listDir(sessionId, dirPath);
            setRoots((prev) => updateTreeForPath(prev, dirPath, res.entries, currentRootPath));
          } catch {
            // ignore
          }
        }
      } finally {
        pollingRef.current = false;
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [sessionId, softRefreshKey]);

  // Auto-expand parent directory when creating an item
  useEffect(() => {
    if (!creatingItem || !sessionId) return;

    const expandParent = async () => {
      const { parentPath } = creatingItem;

      // Check if parent is already expanded in roots
      const findAndExpand = (nodes: TreeNode[], targetPath: string): boolean => {
        for (const node of nodes) {
          if (node.entry.path === targetPath) {
            return node.expanded;
          }
          if (node.children) {
            const found = findAndExpand(node.children, targetPath);
            if (found !== undefined) return found;
          }
        }
        return false;
      };

      // If it's the root path, it's always "expanded"
      if (parentPath === rootPath) return;

      const isExpanded = findAndExpand(roots, parentPath);
      if (!isExpanded) {
        // Find the node and expand it
        const findPath = (nodes: TreeNode[], targetPath: string, currentPath: number[]): number[] | null => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].entry.path === targetPath) return [...currentPath, i];
            if (nodes[i].children) {
              const found = findPath(nodes[i].children!, targetPath, [...currentPath, i]);
              if (found) return found;
            }
          }
          return null;
        };

        const nodePath = findPath(roots, parentPath, []);
        if (nodePath) {
          const children = await loadDir(parentPath);
          setRoots((prev) =>
            updateNode(prev, nodePath, { expanded: true, loading: false, children })
          );
        }
      }
    };

    expandParent();
  }, [creatingItem, sessionId, roots, rootPath, loadDir]);

  const toggleDir = async (node: TreeNode, path: number[]) => {
    if (node.entry.type !== "directory") return;

    setRoots((prev) => updateNode(prev, path, { loading: true }));

    if (!node.expanded) {
      const children = await loadDir(node.entry.path);
      setRoots((prev) =>
        updateNode(prev, path, { expanded: true, loading: false, children })
      );
    } else {
      setRoots((prev) =>
        updateNode(prev, path, { expanded: false, loading: false })
      );
    }
  };

  const handleRootPathChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const newPath = normalizePath((e.target as HTMLInputElement).value);
      setRootPath(newPath);
      setInputValue(newPath);
      onRootPathChange?.(newPath);
    }
  };

  // Drag and drop: move item
  const handleMoveItem = useCallback(
    async (sourcePath: string, targetDir: string) => {
      if (!sessionId) return;
      const name = basename(sourcePath);
      const newPath = targetDir === "/" ? "/" + name : targetDir + "/" + name;
      if (sourcePath === newPath) return;

      try {
        await renameItem(sessionId, sourcePath, newPath);
        onSuccess?.("Moved successfully");
        onItemMoved?.(sourcePath, newPath);
        // Refresh the tree
        const currentRootPath = rootPathRef.current;
        const expandedPaths = getExpandedPaths(rootsRef.current);
        const pathsToRefresh = [currentRootPath, ...expandedPaths];
        for (const dirPath of pathsToRefresh) {
          try {
            const res = await listDir(sessionId, dirPath);
            setRoots((prev) => updateTreeForPath(prev, dirPath, res.entries, currentRootPath));
          } catch {
            // ignore
          }
        }
      } catch (err: any) {
        onError(err.message);
      }
    },
    [sessionId, onError, onSuccess, onItemMoved]
  );

  // Inline rename handler
  const handleInlineRename = useCallback(
    async (oldPath: string, newName: string) => {
      if (!sessionId) return;
      const parentDir = oldPath.substring(0, oldPath.lastIndexOf("/")) || "/";
      const newPath = parentDir === "/" ? "/" + newName : parentDir + "/" + newName;
      if (oldPath === newPath) {
        setInternalRenamingPath(null);
        onRenameComplete?.();
        return;
      }
      try {
        await renameItem(sessionId, oldPath, newPath);
        onSuccess?.("Renamed successfully");
        onItemMoved?.(oldPath, newPath);
        // Refresh tree
        const currentRootPath = rootPathRef.current;
        const expandedPaths = getExpandedPaths(rootsRef.current);
        for (const dirPath of [currentRootPath, ...expandedPaths]) {
          try {
            const res = await listDir(sessionId, dirPath);
            setRoots((prev) => updateTreeForPath(prev, dirPath, res.entries, currentRootPath));
          } catch {
            // ignore
          }
        }
      } catch (err: any) {
        onError(err.message);
      }
      setInternalRenamingPath(null);
      onRenameComplete?.();
    },
    [sessionId, onError, onSuccess, onItemMoved, onRenameComplete]
  );

  const handleCancelRename = useCallback(() => {
    setInternalRenamingPath(null);
    onRenameComplete?.();
  }, [onRenameComplete]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((path: string, name: string, x: number, y: number) => {
    setContextMenu({ x, y, path, name });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Context menu actions
  const handleContextMenuRename = useCallback(() => {
    if (contextMenu) {
      setInternalRenamingPath(contextMenu.path);
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleContextMenuDelete = useCallback(async () => {
    if (!contextMenu || !sessionId) return;
    const { path, name } = contextMenu;
    setContextMenu(null);
    const confirmed = confirm(`Delete "${name}"?`);
    if (!confirmed) return;
    try {
      await deleteItem(sessionId, path, true);
      onDeleteItem?.(path);
      onSuccess?.("Deleted successfully");
      // Refresh tree
      const currentRootPath = rootPathRef.current;
      const expandedPaths = getExpandedPaths(rootsRef.current);
      for (const dirPath of [currentRootPath, ...expandedPaths]) {
        try {
          const res = await listDir(sessionId, dirPath);
          setRoots((prev) => updateTreeForPath(prev, dirPath, res.entries, currentRootPath));
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      onError(err.message);
    }
  }, [contextMenu, sessionId, onDeleteItem, onSuccess, onError]);

  // Handle drop on root tree area
  const handleTreeDragOver = (e: React.DragEvent) => {
    if (!dragSource) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(rootPath);
  };

  const handleTreeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourcePath = e.dataTransfer.getData("text/plain");
    if (sourcePath && dragSource) {
      handleMoveItem(sourcePath, rootPath);
    }
    setDragSource(null);
    setDropTarget(null);
  };

  const handleTreeDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the tree container itself
    if (e.currentTarget === e.target) {
      setDropTarget(null);
    }
  };

  if (!sessionId) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Explorer
        </div>
        <div style={styles.empty}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2, marginBottom: 8 }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Connect to a VM to browse files
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        Explorer
      </div>
      <div style={styles.rootInput}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleRootPathChange}
          placeholder="Root path (Enter to load)"
          style={styles.pathInput}
        />
      </div>
      <div
        style={styles.tree}
        onDragOver={handleTreeDragOver}
        onDrop={handleTreeDrop}
        onDragLeave={handleTreeDragLeave}
      >
        {roots.map((node, i) => (
          <TreeItem
            key={node.entry.path}
            node={node}
            depth={0}
            path={[i]}
            onToggle={toggleDir}
            onSelect={onSelectFile}
            onSelectDir={onSelectDir}
            selectedFile={selectedFile}
            loadDir={loadDir}
            setRoots={setRoots}
            dragSource={dragSource}
            dropTarget={dropTarget}
            setDragSource={setDragSource}
            setDropTarget={setDropTarget}
            onMoveItem={handleMoveItem}
            creatingItem={creatingItem}
            onCreateItem={onCreateItem}
            onCancelCreate={onCancelCreate}
            rootPath={rootPath}
            renamingPath={renamingPath}
            onInlineRename={handleInlineRename}
            onCancelRename={handleCancelRename}
            onContextMenu={handleContextMenu}
          />
        ))}
        {/* Context menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onRename={handleContextMenuRename}
            onDelete={handleContextMenuDelete}
            onClose={closeContextMenu}
          />
        )}
        {/* Inline creation at root level */}
        {creatingItem && normalizePath(creatingItem.parentPath) === normalizePath(rootPath) && onCreateItem && onCancelCreate && (
          <InlineCreateInput
            depth={0}
            type={creatingItem.type}
            onSubmit={(name) => onCreateItem(creatingItem.parentPath, name, creatingItem.type)}
            onCancel={onCancelCreate}
          />
        )}
        {roots.length === 0 && !creatingItem && <div style={styles.empty}>Empty directory</div>}
      </div>
    </div>
  );
}

function TreeItem({
  node,
  depth,
  path,
  onToggle,
  onSelect,
  onSelectDir,
  selectedFile,
  loadDir,
  setRoots,
  dragSource,
  dropTarget,
  setDragSource,
  setDropTarget,
  onMoveItem,
  creatingItem,
  onCreateItem,
  onCancelCreate,
  rootPath,
  renamingPath,
  onInlineRename,
  onCancelRename,
  onContextMenu: onContextMenuProp,
}: {
  node: TreeNode;
  depth: number;
  path: number[];
  onToggle: (node: TreeNode, path: number[]) => void;
  onSelect: (path: string) => void;
  onSelectDir?: (path: string) => void;
  selectedFile: string | null;
  loadDir: (path: string) => Promise<TreeNode[]>;
  setRoots: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  dragSource: string | null;
  dropTarget: string | null;
  setDragSource: (path: string | null) => void;
  setDropTarget: (path: string | null) => void;
  onMoveItem: (sourcePath: string, targetDir: string) => void;
  creatingItem?: CreatingItem | null;
  onCreateItem?: (parentPath: string, name: string, type: "file" | "directory") => Promise<void>;
  onCancelCreate?: () => void;
  rootPath: string;
  renamingPath?: string | null;
  onInlineRename?: (oldPath: string, newName: string) => void;
  onCancelRename?: () => void;
  onContextMenu?: (path: string, name: string, x: number, y: number) => void;
}) {
  const isDir = node.entry.type === "directory";
  const isSelected = selectedFile === node.entry.path;
  const isRenaming = renamingPath === node.entry.path;
  const isDragSource = dragSource === node.entry.path;
  const isDropTarget = dropTarget === node.entry.path && isDir;
  const ext = getFileExt(node.entry.name);
  const iconLabel = isDir ? null : fileIcons[ext];
  const iconColor = fileColors[ext] || "var(--text-secondary)";

  const handleClick = () => {
    if (isRenaming) return; // Don't navigate while renaming
    if (isDir) {
      onSelectDir?.(node.entry.path);
      onToggle(node, path);
    } else {
      onSelect(node.entry.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenuProp?.(node.entry.path, node.entry.name, e.clientX, e.clientY);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", node.entry.path);
    e.dataTransfer.effectAllowed = "move";
    setDragSource(node.entry.path);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!dragSource) return;
    if (!isDir) return;
    // Prevent dropping onto self
    if (dragSource === node.entry.path) return;
    // Prevent dropping a folder into its own descendant
    if (dragSource && node.entry.path.startsWith(dragSource + "/")) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(node.entry.path);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (dropTarget === node.entry.path) {
      setDropTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourcePath = e.dataTransfer.getData("text/plain");
    if (sourcePath && isDir) {
      onMoveItem(sourcePath, node.entry.path);
    }
    setDragSource(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDragSource(null);
    setDropTarget(null);
  };

  const showCreatingHere = creatingItem && creatingItem.parentPath === node.entry.path && node.expanded;

  return (
    <>
      <div
        style={{
          ...styles.item,
          paddingLeft: 12 + depth * 16,
          background: isDropTarget
            ? "rgba(6, 182, 212, 0.15)"
            : isSelected
              ? "var(--bg-active)"
              : undefined,
          borderLeft: isDropTarget
            ? "2px solid var(--accent)"
            : isSelected
              ? "2px solid var(--accent)"
              : "2px solid transparent",
          outline: isDropTarget ? "1px dashed var(--accent)" : undefined,
          outlineOffset: "-1px",
          opacity: isDragSource ? 0.4 : 1,
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title={node.entry.path}
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        {isDir ? (
          <span style={{ ...styles.chevron, transform: node.expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5l8 7-8 7z" />
            </svg>
          </span>
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}
        {isDir ? (
          <span style={{ fontSize: 14, flexShrink: 0, filter: "saturate(0.8)" }}>
            {node.expanded ? "\uD83D\uDCC2" : "\uD83D\uDCC1"}
          </span>
        ) : iconLabel ? (
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            color: iconColor,
            background: `${iconColor}18`,
            padding: "1px 3px",
            borderRadius: 2,
            flexShrink: 0,
            lineHeight: "12px",
            fontFamily: "monospace",
          }}>
            {iconLabel}
          </span>
        ) : (
          <span style={{ fontSize: 13, flexShrink: 0, opacity: 0.5 }}>{"\uD83D\uDCC4"}</span>
        )}
        {isRenaming && onInlineRename && onCancelRename ? (
          <InlineRenameInput
            currentName={node.entry.name}
            onSubmit={(newName) => onInlineRename(node.entry.path, newName)}
            onCancel={onCancelRename}
          />
        ) : (
          <span style={{
            ...styles.name,
            color: isSelected ? "var(--text-bright)" : undefined,
            fontWeight: isSelected ? 500 : undefined,
          }}>
            {node.entry.name}
          </span>
        )}
        {node.loading && (
          <span style={styles.spinner}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </span>
        )}
      </div>
      {node.expanded &&
        node.children?.map((child, i) => (
          <TreeItem
            key={child.entry.path}
            node={child}
            depth={depth + 1}
            path={[...path, i]}
            onToggle={onToggle}
            onSelect={onSelect}
            onSelectDir={onSelectDir}
            selectedFile={selectedFile}
            loadDir={loadDir}
            setRoots={setRoots}
            dragSource={dragSource}
            dropTarget={dropTarget}
            setDragSource={setDragSource}
            setDropTarget={setDropTarget}
            onMoveItem={onMoveItem}
            creatingItem={creatingItem}
            onCreateItem={onCreateItem}
            onCancelCreate={onCancelCreate}
            rootPath={rootPath}
            renamingPath={renamingPath}
            onInlineRename={onInlineRename}
            onCancelRename={onCancelRename}
            onContextMenu={onContextMenuProp}
          />
        ))}
      {/* Inline creation input inside this directory */}
      {showCreatingHere && onCreateItem && onCancelCreate && (
        <InlineCreateInput
          depth={depth + 1}
          type={creatingItem.type}
          onSubmit={(name) => onCreateItem(creatingItem.parentPath, name, creatingItem.type)}
          onCancel={onCancelCreate}
        />
      )}
    </>
  );
}

function InlineCreateInput({
  depth,
  type,
  onSubmit,
  onCancel,
}: {
  depth: number;
  type: "file" | "directory";
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus with a small delay to ensure DOM is ready
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      const value = inputRef.current?.value.trim();
      if (value) onSubmit(value);
      else onCancel();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      style={{
        ...styles.item,
        paddingLeft: 12 + depth * 16,
        background: "rgba(6, 182, 212, 0.08)",
      }}
    >
      <span style={{ width: 14, flexShrink: 0 }} />
      <span style={{ fontSize: 14, flexShrink: 0, filter: "saturate(0.8)" }}>
        {type === "directory" ? "\uD83D\uDCC1" : "\uD83D\uDCC4"}
      </span>
      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        style={{
          flex: 1,
          background: "var(--bg-primary)",
          border: "1px solid var(--accent)",
          borderRadius: 4,
          color: "var(--text-bright)",
          fontSize: 13,
          padding: "2px 8px",
          outline: "none",
          minWidth: 0,
        }}
        placeholder={type === "directory" ? "folder name" : "file name"}
      />
    </div>
  );
}

function InlineRenameInput({
  currentName,
  onSubmit,
  onCancel,
}: {
  currentName: string;
  onSubmit: (newName: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Select the name without extension for files
        const dotIdx = currentName.lastIndexOf(".");
        if (dotIdx > 0) {
          inputRef.current.setSelectionRange(0, dotIdx);
        } else {
          inputRef.current.select();
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [currentName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      const value = inputRef.current?.value.trim();
      if (value && value !== currentName) {
        onSubmit(value);
      } else {
        onCancel();
      }
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      defaultValue={currentName}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      onClick={(e) => e.stopPropagation()}
      style={{
        flex: 1,
        background: "var(--bg-primary)",
        border: "1px solid var(--accent)",
        borderRadius: 4,
        color: "var(--text-bright)",
        fontSize: 13,
        padding: "1px 6px",
        outline: "none",
        minWidth: 0,
      }}
    />
  );
}

function ContextMenu({
  x,
  y,
  onRename,
  onDelete,
  onClose,
}: {
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 9999,
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        padding: "4px 0",
        minWidth: 140,
      }}
    >
      <button
        onClick={onRename}
        style={contextMenuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-active)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
        Rename
      </button>
      <button
        onClick={onDelete}
        style={{ ...contextMenuItemStyle, color: "var(--danger)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,107,0.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Delete
      </button>
    </div>
  );
}

const contextMenuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "6px 12px",
  background: "transparent",
  border: "none",
  color: "var(--text-primary)",
  fontSize: 13,
  cursor: "pointer",
  textAlign: "left",
};

function updateNode(
  nodes: TreeNode[],
  path: number[],
  updates: Partial<TreeNode>
): TreeNode[] {
  if (path.length === 0) return nodes;
  return nodes.map((node, i) => {
    if (i !== path[0]) return node;
    if (path.length === 1) return { ...node, ...updates };
    return {
      ...node,
      children: updateNode(node.children || [], path.slice(1), updates),
    };
  });
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--bg-secondary)",
    borderRight: "1px solid var(--border)",
    overflow: "hidden",
  },
  header: {
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  rootInput: {
    padding: "6px 8px",
    borderBottom: "1px solid var(--border)",
  },
  pathInput: {
    width: "100%",
    padding: "5px 8px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 5,
    color: "var(--text-primary)",
    fontSize: 12,
  },
  tree: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    paddingTop: 2,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    userSelect: "none",
    transition: "background 0.1s ease",
  },
  chevron: {
    width: 14,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)",
    transition: "transform 0.15s ease",
  },
  name: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: 13,
  },
  spinner: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
  },
  empty: {
    padding: 24,
    color: "var(--text-secondary)",
    textAlign: "center",
    fontSize: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};
