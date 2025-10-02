import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeafLoaderProps {
  className?: string;
  size?: number;
}

export const LeafLoader = ({ className, size = 24 }: LeafLoaderProps) => {
  return (
    <Leaf
      size={size}
      className={cn('animate-grow-and-sway text-primary', className)}
    />
  );
};
