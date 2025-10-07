import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Card, CardHeader } from "@/components/ui/card"
import "@/app/globals.css"
import { ModeToggle } from "@/components/theme-toggler";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head/>
      <body>
        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        >
          <SidebarProvider>
          <AppSidebar/>
            <SidebarInset>
              <main>
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <div className="fixed top-4 right-4">
            <ModeToggle/>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}