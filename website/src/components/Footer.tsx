import React from 'react';
import { getGlobalsByLang } from '@lib/globals';
import { FooterContent } from './FooterContent';

type FooterProps = {
  lang: string;
};

export const Footer: React.FC<FooterProps> = async ({ lang }) => {
  const globals = await getGlobalsByLang(lang);
  if (!globals) return null;

  return <FooterContent globals={{ title: globals.title ?? '' }} />;
};
