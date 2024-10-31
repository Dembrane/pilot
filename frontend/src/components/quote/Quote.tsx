import { Paper, Pill, Text } from "@mantine/core";
import { Link, useParams } from "react-router-dom";
import { I18nLink } from "../common/i18nLink";

export const Quote = ({ data }: { data: Quote }) => {
  const { projectId } = useParams();

  return (
    <Paper p="sm" withBorder>
      <Text size="sm" pb="xs">
        "{data.text}"
      </Text>
      {data.conversation_id && (
        <I18nLink
          to={`/projects/${projectId}/conversation/${(data.conversation_id as unknown as Conversation).id}/analysis`}
        >
          <Pill>
            {((data as any).conversation_id as Conversation).participant_name ??
              ""}
          </Pill>
        </I18nLink>
      )}
    </Paper>
  );
};
