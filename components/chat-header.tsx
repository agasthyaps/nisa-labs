'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { VercelIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { Session } from 'next-auth';

function PureChatHeader({
  chatId,
  isReadonly,
  session,
}: {
  chatId: string;
  isReadonly: boolean;
  session: Session;
}) {
  const router = useRouter();
  const { open, setOpen } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  const handleBackToHome = () => {
    // Close sidebar before navigating
    setOpen(false);
    router.push('/welcome');
  };

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {/* Back to Welcome button */}
      <Button
        variant="ghost"
        className="order-1 md:order-1 px-2 h-fit"
        onClick={handleBackToHome}
      >
        Back to Home
      </Button>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
