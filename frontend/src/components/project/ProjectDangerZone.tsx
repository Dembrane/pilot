import { useDeleteProjectByIdMutation } from "@/lib/query";
import { Stack, Title, Box, Button } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { usei18nNavigate } from "@/lib/usei18nNavigate";
import { Trans, t } from "@lingui/macro";

export const ProjectDangerZone = ({ project }: { project: Project }) => {
  const deleteProjectByIdMutation = useDeleteProjectByIdMutation();
  const navigate = usei18nNavigate();

  const handleDelete = () => {
    if (window.confirm(t`Are you sure you want to delete this project?`)) {
      if (
        window.confirm(
          t`By deleting this project, you will delete all the data associated with it. This action cannot be undone. Are you ABSOLUTELY sure you want to delete this project?`,
        )
      ) {
        deleteProjectByIdMutation.mutate(project.id);
        navigate(`/projects`);
      }
    }
  };

  return (
    <Stack>
      <Title order={2}>
        <Trans>Danger Zone</Trans>
      </Title>
      <Box>
        <Button
          onClick={handleDelete}
          color="red"
          variant="outline"
          rightSection={<IconTrash />}
        >
          <Trans>Delete Project</Trans>
        </Button>
      </Box>
    </Stack>
  );
};
