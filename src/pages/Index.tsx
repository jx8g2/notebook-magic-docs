import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatPanel from '@/components/ChatPanel';
import DocumentsPanel from '@/components/DocumentsPanel';
import SourceDialog from '@/components/SourceDialog';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import AIService to ensure it's initialized
import aiService from '@/utils/ai';

const Index = () => {
  const [sources, setSources] = useState([]);
  const [activeSource, setActiveSource] = useState(0);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate initial loading animation
    const timer = setTimeout(() => {
      setIsFirstLoad(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddSource = (source) => {
    const newSources = [...sources, source];
    setSources(newSources);
    setActiveSource(newSources.length - 1);
    
    toast({
      title: "Source added",
      description: `${source.name} has been added to your notebook.`,
      duration: 3000,
    });
  };

  const handleClearAllSources = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmClearAllSources = () => {
    setSources([]);
    setActiveSource(0);
    
    // Clear document processor cache
    if (window.aiService) {
      window.aiService.clearCache();
    }
    
    toast({
      title: "All sources deleted",
      description: "All documents have been removed from your notebook.",
      duration: 3000,
    });
    
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {isFirstLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="animate-pulse text-center">
            <div className="notebook-icon mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold">NotebookLM</h1>
          </div>
        </div>
      )}

      <Header 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        openSettings={() => {}}
      />
      
      <main className="flex flex-1 overflow-hidden">
        {(!isMobile || isMobileMenuOpen) && (
          <Sidebar 
            sources={sources} 
            addSource={() => setIsSourceDialogOpen(true)}
            clearSources={handleClearAllSources}
            setActiveSource={setActiveSource}
            activeSource={activeSource}
          />
        )}
        
        <ChatPanel sources={sources} activeSource={activeSource} />
        
        {!isMobile && (
          <DocumentsPanel 
            sources={sources} 
            activeSource={activeSource}
            setActiveSource={setActiveSource}
          />
        )}
      </main>
      
      <SourceDialog 
        isOpen={isSourceDialogOpen} 
        onClose={() => setIsSourceDialogOpen(false)} 
        onAddSource={handleAddSource}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all documents?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All uploaded files and text snippets will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAllSources} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
