import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Project Selection Manager
          </h1>
          <p className="text-muted-foreground mb-8">
            Manage your construction projects, rooms, and material selections
          </p>
          <div className="space-y-4">
            <Link 
              to="/login"
              className="block w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/signup"
              className="block w-full py-3 px-4 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
