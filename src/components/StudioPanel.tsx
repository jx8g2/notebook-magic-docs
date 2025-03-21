
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, FileTextIcon, Mic, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const StudioPanel = () => {
  return (
    <div className="studio-container flex h-[calc(100vh-3.5rem)] w-[380px] flex-col border-l">
      <div className="border-b p-4">
        <h2 className="text-lg font-medium">Studio</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Audio Overview</CardTitle>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-md bg-background p-2">
                      <Mic className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-medium">Deep Dive conversation</h4>
                      <p className="text-xs text-muted-foreground">Two hosts (English only)</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full">Customize</Button>
                  <Button className="w-full">Generate</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Understanding your sources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  NotebookLM analyzes your uploaded content to provide informed responses and generate content based on your documents.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notes</h3>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <PlusIcon className="h-4 w-4" /> Add note
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start gap-2">
                <FileTextIcon className="h-4 w-4" /> Study guide
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <FileTextIcon className="h-4 w-4" /> Briefing doc
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <FileTextIcon className="h-4 w-4" /> FAQ
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <FileTextIcon className="h-4 w-4" /> Timeline
              </Button>
            </div>
            
            <div className="mt-8 flex flex-col items-center justify-center text-center">
              <FileTextIcon className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Saved notes will appear here</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Save a chat message to create a new note, or click Add note above.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudioPanel;
