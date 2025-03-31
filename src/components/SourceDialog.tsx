
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileTextIcon, FolderIcon, Globe, CloudUpload, FileSymlink, Copy, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SourceDialog = ({ isOpen, onClose, onAddSource }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [url, setUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [useLocalDrive, setUseLocalDrive] = useState(false);
  const fileInputRef = useRef(null);
  const directoryInputRef = useRef(null);
  const { toast } = useToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDirectoryInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    setFiles([...files, ...newFiles]);
    
    toast({
      title: "Files added",
      description: `Added ${newFiles.length} file(s) to your sources.`,
      duration: 3000,
    });
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleAddSource = () => {
    if (activeTab === 'upload' && files.length > 0) {
      files.forEach(file => {
        onAddSource({ 
          type: 'file', 
          name: file.name, 
          content: file,
          useLocalDrive: useLocalDrive
        });
      });
    } else if (activeTab === 'link' && url) {
      onAddSource({ 
        type: 'link', 
        name: new URL(url).hostname, 
        content: url 
      });
    } else if (activeTab === 'text' && pastedText) {
      onAddSource({ 
        type: 'text', 
        name: 'Text Snippet', 
        content: pastedText 
      });
    } else if (activeTab === 'localDrive') {
      onAddSource({ 
        type: 'localDrive', 
        name: 'Local Drive', 
        content: 'local://all' 
      });
    } else {
      toast({
        title: "No content added",
        description: "Please add content before submitting.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setFiles([]);
    setUrl('');
    setPastedText('');
    setUseLocalDrive(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add sources</DialogTitle>
          <DialogDescription>
            Sources let NotebookLM base its responses on the information that matters most to you.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="mt-4" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <CloudUpload className="h-4 w-4" /> Upload
            </TabsTrigger>
            <TabsTrigger value="localDrive" className="flex items-center gap-1">
              <FolderIcon className="h-4 w-4" /> Local Drive
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-1">
              <FileSymlink className="h-4 w-4" /> Link
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1">
              <Copy className="h-4 w-4" /> Paste
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-4">
            <div
              className={`drop-area ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <CloudUpload className="mb-2 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-medium">Upload sources</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag & drop or <span className="text-primary underline">choose file</span> to upload
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Supported file types: PDF, Excel, Word, .txt, Markdown, Images
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileInput}
                />
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Selected files:</h4>
                <div className="max-h-32 overflow-y-auto rounded-md border bg-muted p-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded py-1">
                      <div className="flex items-center">
                        <FileTextIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4 flex items-center space-x-2">
              <input
                type="checkbox"
                id="useLocalDrive"
                checked={useLocalDrive}
                onChange={(e) => setUseLocalDrive(e.target.checked)}
              />
              <label htmlFor="useLocalDrive" className="text-sm">
                Also search my local drive for relevant information
              </label>
            </div>
          </TabsContent>
          
          <TabsContent value="localDrive" className="mt-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
              <FolderIcon className="mb-2 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">Select Local Folder</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Allows NotebookLM to search across your local files and folders for relevant information
              </p>
              <input
                ref={directoryInputRef}
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                className="hidden"
                onChange={handleDirectoryInput}
              />
              <Button 
                className="mt-4" 
                onClick={() => directoryInputRef.current.click()}
              >
                Select Folder
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="link" className="mt-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">Website URL</label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="flex items-center justify-start gap-1">
                <Globe className="h-4 w-4" /> Website
              </Button>
              <Button variant="outline" disabled className="flex items-center justify-start gap-1 opacity-50">
                <FileTextIcon className="h-4 w-4" /> YouTube
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="text" className="mt-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="text" className="text-sm font-medium">Paste text</label>
              <Textarea
                id="text"
                placeholder="Paste your text here..."
                className="min-h-[200px]"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddSource}>
            Add to Notebook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SourceDialog;
