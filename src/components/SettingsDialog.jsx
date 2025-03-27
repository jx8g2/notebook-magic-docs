
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Check, AlertCircle, FileText, ImageIcon, FileIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import aiService from '@/utils/aiService';

const SettingsDialog = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const currentKey = aiService.getApiKey();
      setApiKey(currentKey);
      setIsKeyValid(currentKey ? true : null);
    }
  }, [isOpen]);

  const handleVerifyKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a Google Gemini API key",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await aiService.setApiKey(apiKey);
      setIsKeyValid(isValid);
      
      if (isValid) {
        toast({
          title: "Success",
          description: "API key verified successfully",
          duration: 3000,
        });
      } else {
        toast({
          title: "Invalid API Key",
          description: "Please check your API key and try again",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error verifying API key:', error);
      setIsKeyValid(false);
      toast({
        title: "Verification Failed",
        description: "Could not verify the API key. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    if (isKeyValid) {
      onClose();
    } else {
      handleVerifyKey();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Configure your NotebookLM settings and AI capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Google Gemini API Key</h3>
            <div className="space-y-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="YOUR_API_KEY..."
                className="font-mono"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleVerifyKey}
                  disabled={isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Verify Key"}
                </Button>
              </div>
              {isKeyValid !== null && (
                <div className={`flex items-center gap-1 text-sm ${isKeyValid ? 'text-green-500' : 'text-red-500'}`}>
                  {isKeyValid ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>API key is valid</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <span>Invalid API key</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Document Processing</h3>
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Enhanced PDF Processing</p>
                  <p className="text-muted-foreground text-xs">
                    The app now uses PDF.js to extract text from PDFs, including multi-page documents. 
                    Both text and layout information are preserved to maintain document structure.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 mt-3">
                <ImageIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">OCR Image Analysis</p>
                  <p className="text-muted-foreground text-xs">
                    Images are processed using Gemini's advanced OCR capabilities to extract and analyze text, 
                    including from diagrams, charts, and complex layouts.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 mt-3">
                <FileIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Local Processing</p>
                  <p className="text-muted-foreground text-xs">
                    All document processing happens in your browser, ensuring your documents remain private.
                    Only the extracted text is sent to the AI for analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">AI Model</h3>
            <p className="text-xs text-muted-foreground">
              Currently using Google Gemini 1.5 Flash for optimal performance. This model supports OCR capabilities to analyze documents and images, with robust text extraction from complex documents, diagrams, and screenshots.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
