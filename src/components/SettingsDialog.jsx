
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Check, AlertCircle } from 'lucide-react';
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
        description: "Please enter an OpenAI API key",
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
            <h3 className="text-sm font-medium">OpenAI API Key</h3>
            <div className="space-y-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI dashboard</a>
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
            <h3 className="text-sm font-medium">AI Model</h3>
            <p className="text-xs text-muted-foreground">
              Currently using GPT-4o-mini for optimal performance and cost. Model selection will be available in a future update.
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
