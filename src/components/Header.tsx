
import { Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen, openSettings }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-end border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
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
