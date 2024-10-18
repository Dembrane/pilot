import { useProjectById } from "@/lib/query";
import { Box, Divider, LoadingOverlay, Stack } from "@mantine/core";
import { useParams } from "react-router-dom";
import { TabsWithRouter } from "./TabsWithRouter";
import { useDocumentTitle } from "@mantine/hooks";
import { ProjectQRCode } from "../project/ProjectQRCode";
import { OngoingConversationsSummaryCard } from "../conversation/OngoingConversationsSummaryCard";
import { t } from "@lingui/macro";
import { OpenForParticipationSummaryCard } from "../conversation/OpenForParticipationSummaryCard";

export const ProjectOverviewLayout = () => {
  const projectId = useParams().projectId;
  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  useDocumentTitle(t`Project Overview | Dembrane`);

  return (
    <Stack className="relative px-2 py-4">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <div className="grid grid-cols-12 place-content-stretch gap-3">
        <Box visibleFrom="lg" className="col-span-5 h-full">
          <ProjectQRCode project={projectQuery.data} />
        </Box>
        <Stack
          gap="sm"
          className="col-span-12 h-full lg:col-span-7 2xl:col-span-4"
        >
          <OpenForParticipationSummaryCard projectId={projectId ?? ""} />
          <OngoingConversationsSummaryCard projectId={projectId ?? ""} />
        </Stack>
      </div>
      <Divider />
      <TabsWithRouter
        basePath="/projects/:projectId"
        tabs={[
          { value: "overview", label: t`Overview` },
          { value: "portal-editor", label: t`Portal Editor` },
          { value: "transcript-settings", label: t`Transcript Settings` },
        ]}
        loading={projectQuery.isLoading}
      />
    </Stack>
  );
};
