import { Paper, Stack, Text } from "@mantine/core";
import { Link, useParams } from "react-router-dom";

export const Insight = ({
  data,
  overrideProjectId,
}: {
  data: TInsight;
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
        className="p-4 h-full place-content-start text-left hover:-translate-y-1 hover:border-opacity-70 border-2 border-opacity-0 border-primary-300 transition-all"
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
