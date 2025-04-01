
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Upload, UploadCloud, FileText, Loader2, Eye, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import aiService from '@/utils/aiService';

const ChatPanel = ({ sources, activeSource }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [extractedContent, setExtractedContent] = useState('');
  const [showExtractedContent, setShowExtractedContent] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Function to process sources if not already processed
  useEffect(() => {
    if (sources.length > 0 && !isProcessingDocument) {
      const processSourcesIfNeeded = async () => {
        try {
          setIsProcessingDocument(true);
          
          // Process all sources that need processing
          for (const source of sources) {
            if (source.type === 'file' && !aiService.getProcessedDocument(source.name)) {
              // Show toast notification that document is being processed
              toast({
                title: "Processing document",
                description: `Analyzing ${source.name}...`,
                duration: 5000,
              });
              
              console.log(`Processing source: ${source.name}`);
              // Process this document
              await aiService.processDocuments([source]);
            }
          }
          
          // Get the extracted content for the active source
          if (sources[activeSource]) {
            const currentSource = sources[activeSource];
            if (currentSource.type === 'file') {
              const content = aiService.getProcessedDocument(currentSource.name);
              setExtractedContent(content || "No content could be extracted from this document.");
            }
          }
          
          toast({
            title: "Documents ready",
            description: `All documents have been processed and are ready for queries.`,
            duration: 3000,
          });
        } catch (error) {
          console.error('Error processing documents:', error);
          toast({
            title: "Error",
            description: `Failed to process documents: ${error.message}`,
            variant: "destructive",
            duration: 5000,
          });
        } finally {
          setIsProcessingDocument(false);
        }
      };
      
      processSourcesIfNeeded();
    }
  }, [sources, activeSource, toast]);

  const activeSourceData = sources[activeSource];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Check if API key is set
      if (!aiService.getApiKey()) {
        throw new Error('Google Gemini API key not set. Please add your API key in settings.');
      }

      // Format chat history for the API
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get AI response - pass all sources instead of just activeSource
      const aiResponse = await aiService.generateChatResponse(
        message,
        formattedHistory,
        sources,
        activeSource // Still pass activeSource for compatibility
      );
      
      // Process the response to add clickable links for document references
      const processedResponse = processResponseWithLinks(aiResponse, sources);
      
      // Add AI response to chat
      const assistantMessage = { role: 'assistant', content: processedResponse };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}. ${!aiService.getApiKey() ? 'Please set your Google Gemini API key in settings.' : 'Please try again.'}`
      };
      setChatHistory(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to process response text and add clickable links for document references
  const processResponseWithLinks = (text, sources) => {
    if (!text) return text;
    
    // Create a map of document names to their indices
    const documentMap = {};
    sources.forEach((source, index) => {
      documentMap[source.name] = index;
    });
    
    // Replace [document name] with links
    const regex = /\[(.*?)\]/g;
    return text.replace(regex, (match, docName) => {
      // Check if this document name exists in our sources
      if (documentMap[docName] !== undefined) {
        // Create a clickable link for this document
        return `<a href="#" class="text-primary hover:underline" data-document-index="${documentMap[docName]}">[${docName}]</a>`;
      }
      // If not found, return the original match
      return match;
    });
  };

  const toggleExtractedContent = () => {
    setShowExtractedContent(!showExtractedContent);
  };

  const handleReprocessDocument = async () => {
    if (!activeSourceData || !activeSourceData.type === 'file') return;
    
    try {
      setIsProcessingDocument(true);
      
      // Clear the cache for this file to force reprocessing
      aiService.clearCache(activeSourceData.name);
      
      toast({
        title: "Reprocessing document",
        description: `Analyzing ${activeSourceData.name} again...`,
        duration: 5000,
      });
      
      // Process the document again
      await aiService.processDocuments([activeSourceData]);
      
      // Get the updated content
      const content = aiService.getProcessedDocument(activeSourceData.name);
      setExtractedContent(content || "No content could be extracted from this document.");
      
      // Show content after reprocessing
      setShowExtractedContent(true);
      
      toast({
        title: "Document ready",
        description: `${activeSourceData.name} has been reprocessed.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error reprocessing document:', error);
      toast({
        title: "Error",
        description: `Failed to reprocess document: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessingDocument(false);
    }
  };

  // Handler for clicking on document links in AI responses
  const handleDocumentLinkClick = (e) => {
    // Check if the clicked element is a document link
    if (e.target.tagName === 'A' && e.target.dataset.documentIndex !== undefined) {
      e.preventDefault();
      
      // Get the document index and activate that source
      const index = parseInt(e.target.dataset.documentIndex);
      if (!isNaN(index) && index >= 0 && index < sources.length) {
        setActiveSource(index);
        
        toast({
          title: "Source activated",
          description: `Switched to ${sources[index].name}`,
          duration: 3000,
        });
      }
    }
  };

  return (
    <div className="chat-container flex h-[calc(100vh-3.5rem)] flex-1 flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Chat</h2>
          {activeSourceData && activeSourceData.type === 'file' && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleExtractedContent}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                {showExtractedContent ? 'Hide Content' : 'View Content'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprocessDocument}
                disabled={isProcessingDocument}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${isProcessingDocument ? 'animate-spin' : ''}`} />
                Reprocess
              </Button>
            </div>
          )}
        </div>
        {activeSourceData && (
          <p className="text-sm text-muted-foreground">
            {isProcessingDocument ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Processing documents...
              </span>
            ) : (
              <span className="flex items-center">
                <FileText className="mr-2 h-4 w-4" /> 
                Active source: {activeSourceData.name} ({sources.length} total sources)
              </span>
            )}
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4" onClick={handleDocumentLinkClick}>
        {showExtractedContent && activeSourceData ? (
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-2">Extracted Content from {activeSourceData?.name}</h3>
            <div className="max-h-[70vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{extractedContent || "No content has been extracted yet."}</pre>
            </div>
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="max-w-md text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">Add a source to get started</h3>
              <p className="mt-2 text-muted-foreground">
                Upload a document, select a folder, or paste text to begin a conversation based on your content.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex animate-fade-in flex-col rounded-lg p-4",
                  msg.role === 'user'
                    ? "ml-auto max-w-[80%] bg-primary text-primary-foreground"
                    : "mr-auto max-w-[80%] bg-muted"
                )}
              >
                <span className="mb-1 text-xs font-medium">
                  {msg.role === 'user' ? 'You' : 'NotebookLM'}
                </span>
                <div 
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              </div>
            ))}
            {isLoading && (
              <div className="mr-auto flex max-w-[80%] animate-pulse flex-col rounded-lg bg-muted p-4">
                <span className="mb-1 text-xs font-medium">NotebookLM</span>
                <div className="flex space-x-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                  <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={sources.length > 0 ? "Ask about your documents..." : "Add sources to start chatting..."}
            disabled={sources.length === 0 || isProcessingDocument}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!message.trim() || isLoading || sources.length === 0 || isProcessingDocument}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isProcessingDocument && (
          <p className="mt-2 text-xs text-muted-foreground">Processing documents... Please wait.</p>
        )}
      </form>
    </div>
  );
};

export default ChatPanel;
