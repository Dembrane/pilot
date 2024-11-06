'use client';

import { useBackground } from '@/lib/contexts/BackgroundContext';
import { useLingui } from '@lingui/react';
import { t } from '@lingui/macro';
import { IconSwitch } from '@/components/ui/icon-switch';
import { PlayIcon, StopIcon } from '@radix-ui/react-icons';

export function BackgroundToggle() {
  const { isBackgroundEnabled, toggleBackground } = useBackground();
  const { i18n } = useLingui();

  return (
    <IconSwitch
      checked={isBackgroundEnabled}
      onCheckedChange={toggleBackground}
      className="border border-input"
      iconChecked={<PlayIcon className="h-4 w-4" />}
      iconUnchecked={<StopIcon className="h-4 w-4" />}
      aria-label={i18n._(t`Toggle animation background`)}
    />
  );
}
