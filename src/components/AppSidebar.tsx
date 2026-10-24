import { 
  Home, 
  BarChart3, 
  PieChart, 
  BookOpen, 
  Settings, 
  HelpCircle,
  Wallet,
  TrendingUp,
  CreditCard,
  Scan,
  Flame
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslatedUI } from "@/hooks/useTranslatedUI";

const NAV_KEYS = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  transactions: "Transactions",
  spending: "Spending",
  scanBill: "Scan Bill",
  trending: "Trending",
  reports: "Reports",
  financialTips: "Financial Tips",
  growthInsights: "Growth Insights",
  settings: "Settings",
  help: "Help",
  mainMenu: "Main Menu",
  learnAndGrow: "Learn & Grow",
  support: "Support",
  financeTracker: "Finance Tracker",
};

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const ui = useTranslatedUI(NAV_KEYS);

  const navigationItems = [
    { titleKey: "dashboard", url: "/", icon: Home },
    { titleKey: "analytics", url: "/analytics", icon: BarChart3 },
    { titleKey: "transactions", url: "/transactions", icon: Wallet },
    { titleKey: "spending", url: "/spending", icon: CreditCard },
    { titleKey: "scanBill", url: "/scan", icon: Scan },
    { titleKey: "trending", url: "/trending", icon: Flame },
    { titleKey: "reports", url: "/reports", icon: PieChart },
  ];

  const learningItems = [
    { titleKey: "financialTips", url: "/learn", icon: BookOpen },
    { titleKey: "growthInsights", url: "/insights", icon: TrendingUp },
  ];

  const settingsItems = [
    { titleKey: "settings", url: "/settings", icon: Settings },
    { titleKey: "help", url: "/help", icon: HelpCircle },
  ];

  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-muted/50";

  const isCollapsed = state === "collapsed";

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* App Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-xl sm:text-lg">Trackify</h2>
                <p className="text-sm sm:text-xs text-muted-foreground">{ui.financeTracker}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm sm:text-xs mt-2 sm:mt-0">{ui.mainMenu}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild className="h-12 sm:h-8" onClick={handleNavClick}>
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="h-5 w-5 sm:h-4 sm:w-4" />
                      {!isCollapsed && <span className="text-base sm:text-sm">{ui[item.titleKey as keyof typeof ui]}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Learning Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm sm:text-xs mt-2 sm:mt-0">{ui.learnAndGrow}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {learningItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild className="h-12 sm:h-8" onClick={handleNavClick}>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className="h-5 w-5 sm:h-4 sm:w-4" />
                      {!isCollapsed && <span className="text-base sm:text-sm">{ui[item.titleKey as keyof typeof ui]}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm sm:text-xs mt-2 sm:mt-0">{ui.support}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild className="h-12 sm:h-8" onClick={handleNavClick}>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className="h-5 w-5 sm:h-4 sm:w-4" />
                      {!isCollapsed && <span className="text-base sm:text-sm">{ui[item.titleKey as keyof typeof ui]}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}