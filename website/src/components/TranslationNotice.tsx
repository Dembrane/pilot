'use client';

import { i18n } from '@lingui/core';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export default function TranslationNotice() {
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!hasShownToast.current) {
      toast.info(i18n.t('This page has no translations available'), {
        duration: 4000,
        position: 'top-center',
      });
      hasShownToast.current = true;
    }
  }, []);

  return null;
}
