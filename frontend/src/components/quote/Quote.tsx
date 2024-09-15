import { Paper, Pill, Text } from "@mantine/core";
import { useParams, Link } from "react-router-dom";

export const Quote = ({ data }: { data: Quote }) => {
  const { projectId } = useParams();

  return (
    <Paper p="sm" withBorder>
      <Text size="sm" pb="xs">
        "{data.text}"
      </Text>
      {data.conversation_id && (
        <Link
          to={`/projects/${projectId}/conversation/${(data.conversation_id as unknown as Conversation).id}/analysis`}
        >
          <Pill>
            {((data as any).conversation_id as Conversation).participant_name ??
              ""}
          </Pill>
        </Link>
      )}
    </Paper>
  );
};
