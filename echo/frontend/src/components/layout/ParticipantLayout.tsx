import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Group } from "@mantine/core";
import useSessionStorageState from "use-session-storage-state";

import { Logo } from "../common/Logo";
import { I18nProvider } from "./I18nProvider";

const ParticipantHeader = () => {
  const [loadingFinished] = useSessionStorageState("loadingFinished", {
    defaultValue: false,
  });

  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    if (loadingFinished) {
      // Delay showing the logo to match the spinner's fade-out
      setTimeout(() => {
        setShowLogo(true);
      }, 500);
    }
  }, [loadingFinished]);

  if (!loadingFinished) {
    return null;
  }

  return (
    <Group
      component="header"
      justify="center"
      className="py-2 shadow-sm"
      style={{
        opacity: showLogo ? 1 : 0,
        transition: "opacity 500ms ease-in-out",
      }}
    >
      <Logo hideLogo={!showLogo} hideTitle h="64px" />
    </Group>
  );
};

export const ParticipantLayout = () => {
  const { pathname } = useLocation();
  const isReportPage = pathname.includes("report");

  return (
    <I18nProvider>
      <main className="relative !h-dvh overflow-y-auto">
        <div className="flex h-full flex-col">
          {!isReportPage && <ParticipantHeader />}
          <main className="relative grow">
            <Outlet />
          </main>
        </div>
      </main>
    </I18nProvider>
  );
};
