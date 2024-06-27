import * as React from 'react';
import { X } from 'lucide-react';

import { Badge, BadgeProps } from 'components/dsfr/Badge';
import { cn } from 'utils/cn';

export interface ClickableBadgeProps extends BadgeProps {
  onClose?: () => void;
}

export const ClickableBadge = React.forwardRef<
  HTMLDivElement,
  ClickableBadgeProps
>(({ className, variant, onClose, onClick, children, ...props }, ref) => {
  return (
    <Badge
      variant={variant}
      className={cn(
        'pr-1 cursor-pointer inline-flex items-center',
        onClick && 'hover:opacity-80',
        className,
      )}
      {...props}
    >
      <span className="mr-1">{children}</span>
      {onClose && (
        <X
          className="h-3 w-3 shrink-0 opacity-60 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
      )}
    </Badge>
  );
});

ClickableBadge.displayName = 'ClickableBadge';
