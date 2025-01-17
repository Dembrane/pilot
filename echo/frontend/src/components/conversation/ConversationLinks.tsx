import { Anchor, Group } from "@mantine/core";
import { useParams } from "react-router-dom";
import { I18nLink } from "@/components/common/i18nLink";

export const ConversationLinks = ({
  conversations,
}: {
  conversations: Conversation[];
}) => {
  const { projectId } = useParams();

  return (
    <Group gap="xs" align="center">
      {conversations?.map((conversation) => (
        <I18nLink
          key={conversation.id}
          to={`/projects/${projectId}/conversation/${conversation.id}/overview`}
        >
          <Anchor size="xs">{conversation.participant_name}</Anchor>
        </I18nLink>
      )) ?? null}
    </Group>
  );
};
