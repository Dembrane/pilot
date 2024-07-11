import { Outlet } from "react-router-dom";
import { I18nProvider } from "../I18nProvider";

export const ParticipantLayout = () => {
  return (
    <I18nProvider>
      <Outlet />
    </I18nProvider>
  );
};
