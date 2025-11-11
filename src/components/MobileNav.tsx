import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import type { User } from "@supabase/supabase-js";

interface MobileNavProps {
  user: User | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Toggle navigation menu"
      >
        <span className="sr-only">Open main menu</span>
        {/* Hamburger Icon */}
        {!isOpen ? (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        ) : (
          // Close Icon
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Mobile Menu Panel */}
          <div
            id="mobile-menu"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xs border-l bg-background px-6 py-6 shadow-lg sm:max-w-sm"
            role="navigation"
            aria-label="Mobile navigation"
          >
            {/* Close Button */}
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-lg">Menu</span>
              <button
                onClick={closeMenu}
                className="rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                aria-label="Close menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-4">
              {user ? (
                <>
                  <a
                    href="/flashcards"
                    onClick={closeMenu}
                    className="block rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    My Flashcards
                  </a>
                  <a
                    href="/flashcards/create"
                    onClick={closeMenu}
                    className="block rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    Create Flashcard
                  </a>
                  <a
                    href="/flashcards/ai-generation"
                    onClick={closeMenu}
                    className="block rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    Generate Flashcards
                  </a>
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                    <div className="mt-4">
                      <form action="/api/auth/signout" method="POST">
                        <Button
                          type="submit"
                          variant="outline"
                          className="w-full"
                          onClick={closeMenu}
                        >
                          Sign Out
                        </Button>
                      </form>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <a
                    href="/auth/login"
                    onClick={closeMenu}
                    className="block rounded-md px-3 py-2 text-base font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    Sign In
                  </a>
                  <a
                    href="/auth/register"
                    onClick={closeMenu}
                    className="block rounded-md px-3 py-2 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

