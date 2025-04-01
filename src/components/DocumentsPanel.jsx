
import React, { useState } from 'react';
import { FileTextIcon, FolderIcon, TextIcon, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import aiService from '@/utils/ai';

const DocumentsPanel = ({ sources, setActiveSource, activeSource }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleReprocessSource = async (index) => {
    const source = sources[index];
    if (!source) return;
    
    try {
      setIsProcessing(true);
      
      if (source.type === 'file') {
        aiService.clearCache(source.name);
        
        toast({
          title: "Reprocessing document",
          description: `Analyzing ${source.name} again...`,
          duration: 3000,
        });
        
        await aiService.processDocuments([source]);
      } else if (source.type === 'folder' && Array.isArray(source.content)) {
        toast({
          title: "Reprocessing folder",
          description: `Analyzing all files in ${source.name}...`,
          duration: 3000,
        });
        
        source.content.forEach(file => {
          const fileName = `${source.name}/${file.name}`;
          aiService.clearCache(fileName);
        });
        
        const fileSources = source.content.map(file => ({
          type: 'file',
          name: `${source.name}/${file.name}`,
          content: file
        }));
        
        await aiService.processDocuments(fileSources);
      }
      
      toast({
        title: "Document ready",
        description: `${source.name} has been reprocessed.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error reprocessing document:', error);
      toast({
        title: "Error",
        description: `Failed to reprocess document: ${error.message}`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getSourceIcon = (source) => {
    switch (source.type) {
      case 'file':
        return <FileTextIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
      case 'folder':
        return <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
      case 'text':
        return <TextIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
      default:
        return <FileTextIcon className="h-4 w-4 mr-2 flex-shrink-0" />;
    }
  };

  return (
    <div className="w-64 border-l bg-background px-3 py-4 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Documents</h2>
      </div>
      
      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <FileTextIcon className="h-10 w-10 mb-2" />
          <p className="text-sm">No documents added yet</p>
        </div>
      ) : (
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div
                key={index}
                className={`group flex items-center justify-between rounded-md px-2 py-2 cursor-pointer ${index === activeSource ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                onClick={() => setActiveSource(index)}
              >
                <div className="flex items-center overflow-hidden">
                  {getSourceIcon(source)}
                  <span className="text-sm truncate">{source.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${index === activeSource ? 'text-primary-foreground' : 'text-muted-foreground'} opacity-0 group-hover:opacity-100 transition-opacity`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReprocessSource(index);
                  }}
                  disabled={isProcessing}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default DocumentsPanel;
