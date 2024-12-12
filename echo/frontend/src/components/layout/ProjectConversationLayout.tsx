import { t } from "@lingui/core/macro";
import { useConversationById } from "@/lib/query";
import { Stack, Title } from "@mantine/core";
import { useParams } from "react-router-dom";
import { TabsWithRouter } from "./TabsWithRouter";

export const ProjectConversationLayout = () => {
  const { conversationId } = useParams();

  const conversationQuery = useConversationById({
    conversationId: conversationId ?? "",
    query: {
      fields: ["participant_name"],
    },
  });

  return (
    <Stack className="relative px-2 py-4">
      <Title order={1}>
        {conversationQuery.data?.participant_name ?? "Conversation"}
      </Title>
      <TabsWithRouter
        basePath="/projects/:projectId/conversation/:conversationId"
        tabs={[
          { value: "overview", label: t`Overview` },
          { value: "transcript", label: t`Transcript` },
          { value: "analysis", label: t`Analysis` },
        ]}
        loading={false}
      />
    </Stack>
  );
};
