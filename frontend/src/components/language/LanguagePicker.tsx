import { SUPPORTED_LANGUAGES } from "@/config";
import { useI18nNavigate } from "@/lib/useI18nNavigate";
import { useLanguage } from "@/lib/useLanguage";
import { t } from "@lingui/macro";
import { NativeSelect } from "@mantine/core";
import { ChangeEvent } from "react";
import { useLocation } from "react-router-dom";

const data = [
  {
    language: "nl-NL",
    label: "Nederlands",
    flag: "🇳🇱",
  },
  {
    language: "en-US",
    label: "English",
    flag: "🇺🇸",
  },
];

export const LanguagePicker = () => {
  const { language: currentLanguage } = useLanguage();
  const { pathname } = useLocation();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = e.target.value;

    // If the selected language is the same as the current language, do nothing
    if (selectedLanguage === currentLanguage) return;

    let newPathname = pathname;

    // Remove existing language from the pathname
    SUPPORTED_LANGUAGES.forEach((lang) => {
      if (newPathname.startsWith(`/${lang}/`)) {
        newPathname = newPathname.replace(`/${lang}`, "");
      } else if (newPathname === `/${lang}`) {
        newPathname = "/";
      }
    });

    // use browser history to navigate to the new language path
    // otherwise the language change found to be inconsistent!
    window.location.href = `/${selectedLanguage}${newPathname}`;
  };

  return (
    <NativeSelect
      data={data.map((d) => ({
        value: d.language,
        label: `${d.label} ${d.flag}`,
      }))}
      value={currentLanguage}
      onChange={handleChange}
    />
  );
};
