import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { DataProvider } from "@/contexts/data-context"
import "@/app/globals.css"
import { ModeToggle } from "@/components/theme-toggler";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head/>
      <body>
        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        >
          <DataProvider>
            <SidebarProvider>
            <AppSidebar/>
              <SidebarInset>
                <main>
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </DataProvider>
          <div className="fixed top-4 right-4">
            <ModeToggle/>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}