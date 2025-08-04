'use client';

import { usePathname } from 'next/navigation';
import type { User } from 'next-auth';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface ConditionalSidebarProps {
  children: React.ReactNode;
  user: User | undefined;
  isCollapsed: boolean;
}

export function ConditionalSidebar({ 
  children, 
  user, 
  isCollapsed 
}: ConditionalSidebarProps) {
  const pathname = usePathname();
  const isWelcomePage = pathname === '/welcome';

  if (isWelcomePage) {
    // On welcome page, render without sidebar
    return <div className="flex-1">{children}</div>;
  }

  // On chat pages, render with sidebar
  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
} 