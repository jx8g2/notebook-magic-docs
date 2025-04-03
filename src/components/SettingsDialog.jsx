
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Check, AlertCircle, FileText, ImageIcon, FileIcon, ArrowRight, Server } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import aiService from '@/utils/ai';

const SettingsDialog = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState(null);
  const [aiProvider, setAiProvider] = useState('gemini');
  const [serverUrl, setServerUrl] = useState('http://localhost:8000');
  const [localModel, setLocalModel] = useState('llama-3.2-8b');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const currentKey = aiService.getApiKey();
      setApiKey(currentKey);
      setIsKeyValid(currentKey ? true : null);
      
      const currentProvider = aiService.getProvider();
      setAiProvider(currentProvider);
      
      if (currentProvider === 'local') {
        setServerUrl(aiService.getServerUrl() || 'http://localhost:8000');
        setLocalModel(aiService.getModel() || 'llama-3.2-8b');
        setIsConnected(true); // Assume connected if previously configured
      }
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

  const handleTestLocalConnection = async () => {
    if (!serverUrl.trim()) {
      toast({
        title: "Server URL Required",
        description: "Please enter the URL for your local Llama server",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const isConnected = await aiService.setLocalServer(serverUrl, localModel);
      setIsConnected(isConnected);
      
      if (isConnected) {
        toast({
          title: "Success",
          description: "Connected to local Llama server successfully",
          duration: 3000,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Could not connect to the local Llama server. Check that it's running and the URL is correct.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error connecting to local server:', error);
      setIsConnected(false);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to the local Llama server",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSave = () => {
    // Set the AI provider
    aiService.setProvider(aiProvider);
    
    if (aiProvider === 'gemini' && !isKeyValid) {
      handleVerifyKey();
      return;
    } else if (aiProvider === 'local' && isConnected === null) {
      handleTestLocalConnection();
      return;
    }
    
    toast({
      title: "Settings Saved",
      description: `Using ${aiProvider === 'gemini' ? 'Google Gemini API' : 'Local Llama Model'} for AI processing`,
      duration: 3000,
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Configure your NotebookLM settings and AI capabilities.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={aiProvider} onValueChange={setAiProvider} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gemini">Google Gemini API</TabsTrigger>
            <TabsTrigger value="local">Local Llama 3.2</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gemini" className="space-y-4 mt-4">
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
          </TabsContent>
          
          <TabsContent value="local" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/50 p-3 text-sm border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <Server className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-300">Running Llama 3.2 Locally</p>
                    <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                      This option requires you to run a Llama 3.2 model on your local machine
                      with an OpenAI-compatible API endpoint.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                <h3 className="text-sm font-medium">Local Llama Server</h3>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL of your local Llama server with OpenAI-compatible API
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Llama Model</h4>
                  <Input
                    type="text"
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                    placeholder="llama-3.2-8b"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    The model name that's running on your local server
                  </p>
                </div>
                
                <Button 
                  onClick={handleTestLocalConnection}
                  disabled={isConnecting}
                  className="mt-2"
                >
                  {isConnecting ? "Testing Connection..." : "Test Connection"}
                </Button>
                
                {isConnected !== null && (
                  <div className={`flex items-center gap-1 text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                    {isConnected ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Connected to local Llama server</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <span>Could not connect to server</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 space-y-4">
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
                    Images are processed using advanced OCR capabilities to extract and analyze text, 
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
              
              <div className="border-t border-border/40 mt-3 pt-3">
                <div className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-primary mr-2" />
                  <span className="font-medium">Document Content Now Viewable</span>
                </div>
                <p className="text-muted-foreground text-xs mt-1 ml-6">
                  After uploading a file, you can now view the extracted content directly in the chat panel
                  by clicking the "View Content" button. This helps you confirm that the document was processed correctly.
                </p>
              </div>
            </div>
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
