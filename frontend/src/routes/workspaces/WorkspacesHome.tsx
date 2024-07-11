import { SessionSelection } from "@/components/session/SessionSelection";
import { useDocumentTitle } from "@mantine/hooks";

export const WorkspacesHomeRoute = () => {
  useDocumentTitle("Dembrane | Workspaces");
  return <SessionSelection />;
};
