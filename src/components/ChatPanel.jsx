import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Upload, UploadCloud } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import geminiService from '@/utils/geminiService'; // Import Gemini service

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

    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Check if Gemini API key is set
      if (!geminiService.getApiKey()) {
        throw new Error('Gemini API key not set. Please add your API key in settings.');
      }

      // Construct the context for Gemini
      let context = "";
      if (sources.length > 0 && activeSource !== null && sources[activeSource]) {
         context = sources[activeSource].content; // Assuming 'content' holds the source text
      }

      const geminiResponse = await geminiService.generateText(message, context);


      const assistantMessage = { role: 'assistant', content: geminiResponse };
      setChatHistory(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error getting Gemini response:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}. ${!geminiService.getApiKey() ? 'Please set your Gemini API key in settings.' : 'Please try again.'}`
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

  // ... rest of the component code (JSX remains the same)
  // ... just replace "NotebookLM" with "Gemini" in the JSX if desired


    // ... (rest of the component code remains the same)

};

export default ChatPanel;
};

export default ChatPanel;
