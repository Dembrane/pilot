import { Outlet } from "react-router-dom";
import { I18nProvider } from "../I18nProvider";

export const ParticipantLayout = () => {
  return (
    <I18nProvider>
      {/* <main className="relative h-screen overflow-y-auto">
        <div className="container mx-auto h-full max-w-lg"> */}
      <Outlet />
      {/* </div>
      </main> */}
    </I18nProvider>
  );
};
