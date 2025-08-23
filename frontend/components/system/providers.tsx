"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ConversationProvider } from "@/contexts/conversation-context";
import { useState, useEffect } from "react";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  // Track window width for responsive toaster
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Disable toaster on small screens (< 30rem = 480px)
  const isToasterEnabled = windowWidth === null || windowWidth >= 480;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
        themes={["light", "dark"]}
        storageKey="gpt-image-generator-theme"
      >
        <SidebarProvider>
          <ConversationProvider>
            {children}
          </ConversationProvider>
          
          {/* Toast Notifications */}
          {isToasterEnabled && (
            <Toaster 
              position="top-right"
              expand
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
                className: "toast",
                style: {
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--card-foreground))",
                },
              }}
              data-testid="toast-container"
            />
          )}
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}