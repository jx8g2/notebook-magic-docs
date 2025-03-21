
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileSearchIcon } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="animate-fade-in">
        <div className="notebook-icon mx-auto mb-6">
          <FileSearchIcon className="h-6 w-6" />
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          The notebook you're looking for doesn't exist
        </p>
        <p className="text-muted-foreground">
          The page at {location.pathname} was not found
        </p>
        <Button className="mt-8" asChild>
          <a href="/">Return to Notebooks</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
