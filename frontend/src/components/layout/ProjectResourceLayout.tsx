import { useResourceById } from "@/lib/query";
import { LoadingOverlay, Stack, Title } from "@mantine/core";
import { useParams } from "react-router-dom";
import { TabsWithRouter } from "./TabsWithRouter";

export const ProjectResourceLayout = () => {
  const { resourceId, projectId } = useParams();
  const resourceQuery = useResourceById(resourceId ?? "");

  return (
    <Stack className="relative py-4 px-2">
      <LoadingOverlay visible={resourceQuery.isLoading} />
      <Title order={1}>{resourceQuery.data?.title ?? "Resource"}</Title>

      <TabsWithRouter
        basePath={`/projects/${projectId}/resources/${resourceId}`}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "analysis", label: "Analysis" },
        ]}
      />
    </Stack>
  );
};
