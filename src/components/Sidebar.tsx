
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";

const Sidebar = ({ sources, addSource, clearSources, setActiveSource, activeSource }) => {
  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">Sources</h2>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={addSource}
            title="Add source"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {sources.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearSources}
              title="Delete all sources"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sources.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">No documents added yet</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2" 
                onClick={addSource}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </div>
          ) : (
            <div>
              {sources.map((source, index) => (
                <div
                  key={index}
                  className={`group flex items-center justify-between rounded-md px-2 py-2 cursor-pointer ${
                    index === activeSource ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => setActiveSource(index)}
                >
                  <span className="text-sm truncate">{source.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
