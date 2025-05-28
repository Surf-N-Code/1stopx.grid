'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { LayoutGrid, Menu, Settings, Table, Upload, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean;
}

export function Sidebar({ className, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Tables',
      icon: Table,
      href: '/tables',
    },
    {
      title: 'Grid',
      icon: LayoutGrid,
      href: '/grid',
    },
    {
      title: 'Import',
      icon: Upload,
      href: '/import',
    },
    {
      title: 'Merge CSV',
      icon: Upload,
      href: '/upload?mode=merge',
    },
    {
      title: 'Team',
      icon: Users,
      href: '/team',
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ];

  return (
    <ShadcnSidebar
      className={cn('border-r', className)}
      data-collapsed={isCollapsed}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex h-[60px] items-center justify-center">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <SidebarContent className="flex flex-col gap-2">
          <SidebarGroup>
            <SidebarGroupLabel className={cn('px-2', isCollapsed && 'sr-only')}>
              Main Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-accent',
                        pathname === item.href && 'bg-accent'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </ShadcnSidebar>
  );
}
