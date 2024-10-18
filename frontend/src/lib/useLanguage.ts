import { i18n } from "@lingui/core";

import { messages as enMessages } from "../locales/en-US";
import { messages as nlMessages } from "../locales/nl-NL";

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { SUPPORTED_LANGUAGES } from "@/config";

export const defaultLanguage = "en-US";

i18n.load({
  "en-US": enMessages,
  "nl-NL": nlMessages,
});

i18n.activate(defaultLanguage);

export const useLanguage = () => {
  const params = useParams();
  const language = params.language ?? i18n.locale ?? defaultLanguage;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ([...SUPPORTED_LANGUAGES.map((l) => l.toString())].includes(language)) {
      i18n.activate(language);
    } else {
      console.log("Unsupported language", language);
      i18n.activate(defaultLanguage);
    }
    setLoading(false);
  }, [language, setLoading]);

  return {
    i18n,
    language,
    loading,
  };
};
