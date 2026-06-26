import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Brain,
  Calendar,
  Briefcase,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
  { title: "Kanban", url: "/kanban", icon: KanbanSquare },
  { title: "Calendar", url: "/calendar", icon: Calendar },
] as const;

const aiItems = [
  { title: "AI Assistant", url: "/assistant", icon: Brain },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
] as const;

const accountItems = [
  { title: "Profile", url: "/profile", icon: UserIcon },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

...

        <SidebarGroup>
          <SidebarGroupLabel>Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-lg p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="gradient-brand text-xs text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-medium">
              {(user?.user_metadata?.full_name as string | undefined) ?? "You"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive rounded-md p-1.5 transition group-data-[collapsible=icon]:hidden"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
