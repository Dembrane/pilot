import { useConversationById, useResourceById } from "@/lib/query";
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

export const ProjectConversationLayout = () => {
  const navigate = useNavigate();
  const { conversationId, projectId } = useParams();
  const conversationQuery = useConversationById(conversationId ?? "");
  const location = useLocation();

  const determineInitialTab = () => {
    if (location.pathname.includes(`/overview`)) {
      return "overview";
    }
    if (location.pathname.includes(`/transcript`)) {
      return "transcript";
    }
    if (location.pathname.includes(`/chat`)) {
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
    navigate(`/projects/${projectId}/conversation/${conversationId}/${value}`);
    setActiveTab(value);
  };

  return (
    <Stack className="relative py-4 px-2">
      <LoadingOverlay visible={conversationQuery.isLoading} />
      <Title order={1}>
        {conversationQuery.data?.participant_name ?? "Conversation"}
      </Title>

      <Tabs value={activeTab} onChange={handleTabChange} variant="default">
        <Tabs.List grow justify="space-between">
          <Tabs.Tab value="overview">
            <Trans>Overview</Trans>
          </Tabs.Tab>
          <Tabs.Tab value="transcript">
            <Trans>Transcript</Trans>
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
