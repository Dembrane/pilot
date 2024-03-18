import { i18n } from "@lingui/core";
import { I18nProvider as I18nP } from "@lingui/react";
import { PropsWithChildren, useEffect } from "react";
import { useCurrentSession } from "../lib/query";
import { LoadingOverlay } from "@mantine/core";
import { messages } from "../locales/en";
import { messages as nlMessages } from "../locales/nl";

export const defaultLocale = "en";

i18n.load({
  en: messages,
  nl: nlMessages,
});

i18n.activate(defaultLocale);
console.log("Activated", defaultLocale);

export const I18nProvider = ({ children }: PropsWithChildren) => {
  const session = useCurrentSession();

  useEffect(() => {
    if (session.data) {
      // i18n.activate(session.data.language);
    } else {
      i18n.activate(defaultLocale);
    }
  }, [session.data]);

  // if (session.isLoading) {
  //   return <LoadingOverlay visible />;
  // }

  return <I18nP i18n={i18n}>{children}</I18nP>;
};
