'use client';

import { useLingui } from '@lingui/react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/public/logo-circle.png';
import { t, Trans } from '@lingui/macro';

export const FooterContent = ({
  globals,
}: {
  globals: {
    title: string;
  };
}) => {
  const { i18n } = useLingui();

  return (
    <footer className="sticky z-50 mt-48 flex min-h-64 w-screen flex-col items-center justify-between gap-4 self-center border-t border-border bg-transparent pt-4 text-center shadow backdrop-blur-md">
      <div className="flex items-center">
        <Image src={logo} alt={'Logo'} className="p-2" width={80} height={80} />
        <h1 className="text-4xl">{globals?.title || 'Dembrane'}</h1>
      </div>
      <div className="p-2">
        <p>
          <Trans>Intrigued?</Trans>
        </p>
        <p>
          <Trans>Send us an email at:</Trans>{' '}
          <Link
            className="text-primary hover:bg-secondary"
            href="mailto:info@dembrane.com?subject=sent from dembrane.com"
          >
            info@dembrane.com
          </Link>
        </p>
        <p>
          <Trans>Or give us a call at:</Trans> +310635625130
        </p>
      </div>
      <div className="mb-4 flex flex-col gap-4 p-2">
        <Link
          className="text-primary hover:bg-secondary"
          href="https://dembrane.notion.site/Privacy-statements-all-languages-fa97a183f9d841f7a1089079e77ffb52?pvs=4"
        >
          <Trans>Privacy Statements</Trans>
        </Link>
        <p className="opacity-50">
          <Trans>
            Dembrane B.V. {new Date().getFullYear()}, all rights reserved
          </Trans>
        </p>
      </div>
    </footer>
  );
};
