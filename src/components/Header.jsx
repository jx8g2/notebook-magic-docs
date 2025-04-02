
import { Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen, openSettings }) => {
  return (
    <div className="absolute top-2 right-2 z-10">
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
    </div>
  );
};

export default Header;
