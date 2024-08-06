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
    <Stack className="relative py-4 px-2">
      <Title order={1}>
        {conversationQuery.data?.participant_name ?? "Conversation"}
      </Title>
      <TabsWithRouter
        basePath="/projects/:projectId/conversation/:conversationId"
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "transcript", label: "Transcript" },
          { value: "analysis", label: "Analysis" },
        ]}
        loading={false}
      />
    </Stack>
  );
};
