import { Checkbox, Tooltip } from "@mantine/core";
import { Icons } from "@/icons";
import { t } from "@lingui/macro";
import { SummaryCard } from "../common/SummaryCard";
import { useProjectById, useUpdateProjectByIdMutation } from "@/lib/query";

interface OpenForParticipationSummaryCardProps {
  projectId: string;
}

export const OpenForParticipationSummaryCard = ({
  projectId,
}: OpenForParticipationSummaryCardProps) => {
  const projectQuery = useProjectById({ projectId });
  const updateProjectMutation = useUpdateProjectByIdMutation();

  const handleOpenForParticipationCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateProjectMutation.mutate({
      id: projectId,
      payload: {
        is_conversation_allowed: e.target.checked,
      },
    });
  };

  return (
    <SummaryCard
      loading={projectQuery.isLoading}
      icon={<Icons.Phone width="24px" />}
      label={t`Open for Participation?`}
      value={
        <Tooltip
          position="bottom"
          label={t`Allow participants using the link to start new conversations`}
        >
          <Checkbox
            size="md"
            checked={projectQuery.data?.is_conversation_allowed}
            disabled={updateProjectMutation.isPending}
            onChange={handleOpenForParticipationCheckboxChange}
          />
        </Tooltip>
      }
    />
  );
};
