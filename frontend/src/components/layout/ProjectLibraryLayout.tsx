import { useDocumentTitle } from "@mantine/hooks";
import { Outlet } from "react-router-dom";

export const ProjectLibraryLayout = () => {
  useDocumentTitle("Project Library | Dembrane");
  return <Outlet />;
};
