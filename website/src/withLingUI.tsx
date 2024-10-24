import React, { ReactNode } from 'react';
import { getI18nInstance } from './appRouterI18n';
import { setI18n } from '@lingui/react/server';

export type PageLangParam = {
  params: { lang: string };
};

type PageProps = PageLangParam & {
  searchParams?: any; // in query
};

type LayoutProps = PageLangParam & {
  children: React.ReactNode;
};

type PageExposedToNextJS<Props extends PageProps> = (props: Props) => ReactNode;

const setupI18n = (lang: string) => {
  if (lang && lang.length === 5) {  // Basic check for valid language code
    const i18n = getI18nInstance(lang);
    setI18n(i18n);
    return lang;
  }
  return null;
};

export const withLinguiPage = <Props extends PageProps>(
  AppRouterPage: React.ComponentType<PageLangParam & Props>,
): PageExposedToNextJS<Props> => {
  return function WithLingui(props) {
    const lang = setupI18n(props.params.lang);
    return lang ? <AppRouterPage {...props} lang={lang} /> : null;
  };
};

type LayoutExposedToNextJS<Props extends LayoutProps> = (
  props: Props,
) => ReactNode;

export const withLinguiLayout = <Props extends LayoutProps>(
  AppRouterPage: React.ComponentType<PageLangParam & Props>,
): LayoutExposedToNextJS<Props> => {
  return function WithLingui(props) {
    const lang = setupI18n(props.params.lang);
    return lang ? <AppRouterPage {...props} lang={lang} /> : props.children;
  };
};
