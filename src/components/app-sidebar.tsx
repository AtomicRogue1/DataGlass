"use client"

import { Calendar, Heading1, Home, Inbox, Search, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
  SidebarFooter
} from "@/components/ui/sidebar"

import "@/app/globals.css"

const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Contact Us",
    url: "#",
    icon: Inbox,
  }
]
 
export function AppSidebar() {
  const sidebar_state = useSidebar();
  return (
    <Sidebar variant="inset">
      {sidebar_state.state == "expanded" && <div className="px-2 py-4">
        <SidebarHeader>
          <p className="text-2xl">DataGlass</p>
        </SidebarHeader>
      </div>}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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