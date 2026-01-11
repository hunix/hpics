/**
 * FolderStructurePreview - Tree view of dropped folder structure
 */

import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Folder,
  FolderOpen,
  File,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  FileAudioIcon,
  FileVideoIcon,
  FileTextIcon
} from 'lucide-react';
import { formatFileSize } from '@/lib/bulkUpload';
import { cn } from '@/lib/utils';

interface FolderNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: FolderNode[];
  file?: File;
  size?: number;
  category?: string;
}

interface FolderStructurePreviewProps {
  files: Array<{ file: File; path: string; category: string }>;
  onToggleInclude: (path: string, included: boolean) => void;
  excludedPaths: Set<string>;
  preserveStructure: boolean;
  onPreserveStructureChange: (preserve: boolean) => void;
}

export function FolderStructurePreview({
  files,
  onToggleInclude,
  excludedPaths,
  preserveStructure,
  onPreserveStructureChange
}: FolderStructurePreviewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));

  // Build tree structure from files
  const tree = useMemo(() => {
    const root: FolderNode = {
      name: 'Root',
      path: '',
      isFolder: true,
      children: []
    };

    files.forEach(({ file, path, category }) => {
      const parts = path.split('/').filter(Boolean);
      let current = root;

      // Create folder nodes
      parts.slice(0, -1).forEach((part, index) => {
        const folderPath = parts.slice(0, index + 1).join('/');
        let folderNode = current.children.find(c => c.name === part && c.isFolder);
        
        if (!folderNode) {
          folderNode = {
            name: part,
            path: folderPath,
            isFolder: true,
            children: []
          };
          current.children.push(folderNode);
        }
        current = folderNode;
      });

      // Add file node
      const fileName = parts[parts.length - 1] || file.name;
      current.children.push({
        name: fileName,
        path: path || file.name,
        isFolder: false,
        children: [],
        file,
        size: file.size,
        category
      });
    });

    // Sort: folders first, then files alphabetically
    const sortNodes = (nodes: FolderNode[]) => {
      nodes.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(node => {
        if (node.isFolder) sortNodes(node.children);
      });
    };
    sortNodes(root.children);

    return root;
  }, [files]);

  // Calculate folder stats
  const getFolderStats = (node: FolderNode): { files: number; size: number } => {
    if (!node.isFolder) {
      return { files: 1, size: node.size || 0 };
    }
    return node.children.reduce(
      (acc, child) => {
        const childStats = getFolderStats(child);
        return {
          files: acc.files + childStats.files,
          size: acc.size + childStats.size
        };
      },
      { files: 0, size: 0 }
    );
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (category?: string) => {
    switch (category) {
      case 'image': return ImageIcon;
      case 'audio': return FileAudioIcon;
      case 'video': return FileVideoIcon;
      case 'document': return FileTextIcon;
      default: return File;
    }
  };

  const renderNode = (node: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isExcluded = excludedPaths.has(node.path);
    const stats = node.isFolder ? getFolderStats(node) : null;

    return (
      <div key={node.path || 'root'} className={cn(depth > 0 && 'ml-4')}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors",
            "hover:bg-muted/50",
            isExcluded && "opacity-50"
          )}
        >
          {node.isFolder ? (
            <>
              <button
                onClick={() => toggleFolder(node.path)}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
              <Checkbox
                checked={!isExcluded}
                onCheckedChange={(checked) => onToggleInclude(node.path, !!checked)}
              />
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-yellow-500" />
              ) : (
                <Folder className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm font-medium flex-1">{node.name}</span>
              {stats && (
                <span className="text-xs text-muted-foreground">
                  {stats.files} files • {formatFileSize(stats.size)}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="w-[22px]" /> {/* Spacer for alignment */}
              <Checkbox
                checked={!isExcluded}
                onCheckedChange={(checked) => onToggleInclude(node.path, !!checked)}
              />
              {(() => {
                const Icon = getFileIcon(node.category);
                return <Icon className="h-4 w-4 text-muted-foreground" />;
              })()}
              <span className="text-sm flex-1 truncate">{node.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(node.size || 0)}
              </span>
            </>
          )}
        </div>

        {node.isFolder && isExpanded && node.children.length > 0 && (
          <div className="border-l ml-3 pl-1">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalStats = getFolderStats(tree);
  const includedFiles = files.filter(f => !excludedPaths.has(f.path));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Folder Structure</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">
            {includedFiles.length} / {totalStats.files} files
          </Badge>
          <span>{formatFileSize(includedFiles.reduce((acc, f) => acc + f.file.size, 0))}</span>
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="preserve-structure"
            checked={preserveStructure}
            onCheckedChange={(checked) => onPreserveStructureChange(!!checked)}
          />
          <label htmlFor="preserve-structure" className="text-sm cursor-pointer">
            Preserve folder structure in storage
          </label>
        </div>
      </div>

      {/* Tree View */}
      <ScrollArea className="h-[300px] border rounded-lg p-2">
        {tree.children.length > 0 ? (
          <div className="space-y-0.5">
            {tree.children.map(child => renderNode(child, 0))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No files to display
          </div>
        )}
      </ScrollArea>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            files.forEach(f => onToggleInclude(f.path, true));
          }}
        >
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            files.forEach(f => onToggleInclude(f.path, false));
          }}
        >
          Deselect All
        </Button>
      </div>
    </div>
  );
}
