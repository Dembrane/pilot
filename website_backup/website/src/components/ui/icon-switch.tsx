'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const IconSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    iconUnchecked?: React.ReactNode;
    iconChecked?: React.ReactNode;
  }
>(({ className, iconUnchecked, iconChecked, checked, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none flex h-5 w-5 items-center justify-center bg-foreground text-background rounded-full shadow-lg ring-0 transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0'
      )}
    >
      {checked ? iconChecked : iconUnchecked}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
IconSwitch.displayName = 'IconSwitch';

export { IconSwitch };
