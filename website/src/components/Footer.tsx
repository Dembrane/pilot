import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logo from '@/public/logo-circle.png';
import { getGlobalsByLang } from '@lib/globals';
import { t } from '@lingui/macro';
import { initLingui } from '@/initLingui';

type FooterProps = {
  lang: string;
};

export const Footer: React.FC<FooterProps> = async ({ lang }) => {
  const globals = await getGlobalsByLang(lang);
  initLingui(lang as 'en-US' | 'nl-NL');

  return (
    <footer className="sticky z-50 mt-48 flex min-h-64 w-screen flex-col items-center justify-between gap-4 self-center border-t border-border bg-transparent pt-4 text-center shadow backdrop-blur-md">
      <div className="flex items-center">
        <Image
          src={logo}
          alt={t`logo`}
          className="p-2"
          width={80}
          height={80}
        />
        <h1 className="text-4xl">{globals?.title || 'Dembrane'}</h1>
      </div>
      <div className="p-2">
        <p>{t`Intrigued?`}</p>
        <p>
          {t`Send us an email at:`}{' '}
          <Link
            className="text-primary hover:bg-secondary"
            href="mailto:info@dembrane.com?subject=sent from dembrane.com"
          >
            info@dembrane.com
          </Link>
        </p>
        <p>{t`Or give us a call at:`} +310635625130</p>
      </div>
      <div className="mb-4 flex flex-col gap-4 p-2">
        <Link
          className="text-primary hover:bg-secondary"
          href="https://dembrane.notion.site/Privacy-statements-all-languages-fa97a183f9d841f7a1089079e77ffb52?pvs=4"
        >
          {t`Privacy Statements`}
        </Link>
        <p className="opacity-50">
          {t`Dembrane B.V. 2023, all rights reserved`}
        </p>
      </div>
    </footer>
  );
};
