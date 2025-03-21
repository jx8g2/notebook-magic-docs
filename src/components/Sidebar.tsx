
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, File, Link, FileText, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = ({ sources, addSource, setActiveSource, activeSource }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sidebar-container flex min-h-screen w-[280px] flex-col border-r transition-all duration-300 ease-in-out",
        isCollapsed && "w-[60px]"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!isCollapsed && <h2 className="text-lg font-semibold">Sources</h2>}
        <Button
          variant="ghost"
          size="sm"
          className={cn("ml-auto", isCollapsed && "mx-auto")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "→" : "←"}
        </Button>
      </div>

      <div className="p-4">
        <Button
          onClick={addSource}
          variant="outline"
          className={cn(
            "w-full justify-start gap-2",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span>Add Source</span>}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {sources.length > 0 ? (
          <div className="space-y-1">
            {sources.map((source, index) => (
              <Button
                key={index}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 text-left",
                  activeSource === index && "bg-accent",
                  isCollapsed && "justify-center px-0"
                )}
                onClick={() => setActiveSource(index)}
              >
                {source.type === 'file' && <File className="h-4 w-4" />}
                {source.type === 'link' && <Link className="h-4 w-4" />}
                {source.type === 'drive' && <FolderOpen className="h-4 w-4" />}
                {source.type === 'text' && <FileText className="h-4 w-4" />}
                {!isCollapsed && (
                  <span className="truncate">{source.name}</span>
                )}
              </Button>
            ))}
          </div>
        ) : (
          !isCollapsed && (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center">
              <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No sources added yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a source to get started
              </p>
            </div>
          )
        )}
      </div>

      {!isCollapsed && (
        <div className="border-t p-4">
          <div className="flex flex-col space-y-1">
            <p className="text-xs text-muted-foreground">Source limit</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      (sources.length / 50) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium">
                {sources.length} / 50
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
