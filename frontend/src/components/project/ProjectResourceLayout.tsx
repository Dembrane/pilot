import { useResourceById } from "@/lib/query";
import { Trans } from "@lingui/macro";
import {
  Box,
  Group,
  LoadingOverlay,
  Paper,
  Stack,
  Tabs,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";

export const ProjectResourceLayout = () => {
  const navigate = useNavigate();
  const { sessionId, resourceId, projectId } = useParams();
  const resourceQuery = useResourceById(resourceId ?? "");
  const location = useLocation();

  const determineInitialTab = () => {
    if (location.pathname.includes(`${resourceId}/overview`)) {
      return "overview";
    }
    if (location.pathname.includes(`${resourceId}/chat`)) {
      return "chat";
    }
    return "overview";
  };

  const [activeTab, setActiveTab] = useState<string | null>(
    determineInitialTab(),
  );

  useEffect(() => {
    setActiveTab(determineInitialTab());
  }, [location.pathname]);

  const handleTabChange = (value: string | null) => {
    navigate(
      `/workspaces/${sessionId}/projects/${projectId}/resources/${resourceId}/${value}`,
    );
    setActiveTab(value);
  };

  return (
    <Stack className="relative py-4 px-2">
      <LoadingOverlay visible={resourceQuery.isLoading} />
      <Title order={1}>{resourceQuery.data?.title ?? "Resource"}</Title>

      <Tabs value={activeTab} onChange={handleTabChange} variant="default">
        <Tabs.List grow justify="space-between">
          <Tabs.Tab value="overview">
            <Trans>Overview</Trans>
          </Tabs.Tab>
          <Tabs.Tab value="chat" disabled>
            <Trans>Analysis</Trans>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
      <Outlet />
    </Stack>
  );
};
