"use client"

import { Home, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
  SidebarFooter
} from "@/components/ui/sidebar"
import { useData } from "@/contexts/data-context"

import "@/app/globals.css"

const baseItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  }
]

const dashboardItem = {
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard,
}

export function AppSidebar() {
  const sidebar_state = useSidebar();
  const { hasData } = useData();

  const items = hasData ? [...baseItems, dashboardItem] : baseItems;
  
  return (
    <Sidebar variant="inset">
      {sidebar_state.state == "expanded" && <div className="px-2 py-4">
        <SidebarHeader>
          <p className="text-3xl bold">D a t a G l a s s</p>
        </SidebarHeader>
      </div>}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mx-2 my-4">
        <SidebarFooter>
        Made by Yash Verma
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}