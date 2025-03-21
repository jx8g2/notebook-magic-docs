
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Upload, UploadCloud } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import aiService from '@/utils/aiService';

const ChatPanel = ({ sources, activeSource }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

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
        throw new Error('OpenAI API key not set. Please add your API key in settings.');
      }

      // Format chat history for the API
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get AI response
      const aiResponse = await aiService.generateChatResponse(
        message,
        formattedHistory,
        sources,
        activeSource
      );
      
      // Add AI response to chat
      const assistantMessage = { role: 'assistant', content: aiResponse };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}. ${!aiService.getApiKey() ? 'Please set your OpenAI API key in settings.' : 'Please try again.'}`
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

  return (
    <div className="chat-container flex h-[calc(100vh-3.5rem)] flex-1 flex-col">
      <div className="border-b p-4">
        <h2 className="text-lg font-medium">Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {chatHistory.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="max-w-md text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">Add a source to get started</h3>
              <p className="mt-2 text-muted-foreground">
                Upload a document, connect to Google Drive, or paste text to begin a conversation based on your content.
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
                <p className="text-sm">{msg.content}</p>
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
            disabled={sources.length === 0}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!message.trim() || isLoading || sources.length === 0}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
