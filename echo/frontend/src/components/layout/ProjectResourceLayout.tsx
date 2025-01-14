import { Trans } from "@lingui/react/macro";
import { useResourceById } from "@/lib/query";
import { LoadingOverlay, Stack, Tabs, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { useI18nNavigate } from "@/hooks/useI18nNavigate";

export const ProjectResourceLayout = () => {
  const navigate = useI18nNavigate();
  const { resourceId, projectId } = useParams();
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
    navigate(`/projects/${projectId}/resources/${resourceId}/${value}`);
    setActiveTab(value);
  };

  return (
    <Stack className="relative px-2 py-4">
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
