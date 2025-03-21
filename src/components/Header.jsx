
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Settings, Menu, X } from 'lucide-react';

const Header = ({ title, setTitle, isMobileMenuOpen, setIsMobileMenuOpen, openSettings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableTitle, setEditableTitle] = useState(title);

  const handleTitleSave = () => {
    setTitle(editableTitle);
    setIsEditing(false);
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <div className="notebook-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
          </svg>
        </div>
        <div className="mr-2 flex items-center">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="h-9 w-[200px] focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                autoFocus
              />
              <Button variant="outline" size="sm" onClick={handleTitleSave}>
                Save
              </Button>
            </div>
          ) : (
            <h1
              className="text-xl font-semibold hover:underline"
              onClick={() => setIsEditing(true)}
            >
              {title}
            </h1>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button variant="ghost" size="icon" onClick={openSettings}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
};

export default Header;
