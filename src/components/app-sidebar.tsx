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

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const initial =
    (user?.user_metadata?.full_name as string | undefined)?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "U";

  const renderGroup = (label: string, items: ReadonlyArray<{ title: string; url: string; icon: typeof LayoutDashboard }>) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="gradient-brand shadow-glow flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            Trackr
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Workspace", mainItems)}
        {renderGroup("Intelligence", aiItems)}
        {renderGroup("Account", accountItems)}
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
