import { Paper, Stack, Text } from "@mantine/core";
import { Link, useParams } from "react-router-dom";

export const Insight = ({
  data,
  overrideProjectId,
}: {
  data: Insight;
  // use this to override the project id
  overrideProjectId?: string;
}) => {
  let { projectId } = useParams();

  if (overrideProjectId) {
    projectId = overrideProjectId;
  }

  return (
    <Link to={`/projects/${projectId}/library/insights/${data.id}`}>
      <Paper
        component="a"
        className="h-full place-content-start border-2 border-primary-300 border-opacity-0 p-4 text-left transition-all hover:border-opacity-70"
      >
        <Stack className="h-full">
          <Text size="md" className="font-semibold">
            {data.title}
          </Text>
          <Text size="sm">{data.summary}</Text>
        </Stack>
      </Paper>
    </Link>
  );
};
