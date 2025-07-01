'use client';

import { motion } from 'framer-motion';
import { SparklesIcon } from './icons';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ImageProcessingMessageProps {
  imageCount: number;
  className?: string;
}

export const ImageProcessingMessage = ({
  imageCount,
  className,
}: ImageProcessingMessageProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : `${prev}.`));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getMessage = () => {
    if (imageCount === 1) {
      return `Reading your image${dots}`;
    }
    return `Reading your ${imageCount} images${dots}`;
  };

  return (
    <motion.div
      data-testid="image-processing-message"
      className={cn('w-full mx-auto max-w-3xl px-4 group/message', className)}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -5, opacity: 0 }}
    >
      <div className="flex gap-4 w-full">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <div className="translate-y-px">
            <SparklesIcon size={14} />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 text-muted-foreground">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
              className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full"
            />
            <span className="text-sm">{getMessage()}</span>
          </div>
          <div className="text-xs text-muted-foreground/70">
            Transcribing content to help understand your request...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
