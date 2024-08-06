import { useDeleteProjectByIdMutation } from "@/lib/query";
import { Stack, Title, Box, Button } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";

export const ProjectDangerZone = ({ project }: { project: Project }) => {
  const deleteProjectByIdMutation = useDeleteProjectByIdMutation();
  const navigate = useNavigate();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteProjectByIdMutation.mutate(project.id);
      navigate(`/projects`);
    }
  };

  return (
    <Stack>
      <Title order={2}>Danger Zone</Title>
      <Box>
        <Button
          onClick={handleDelete}
          color="red"
          variant="outline"
          rightSection={<IconTrash />}
        >
          Delete Project
        </Button>
      </Box>
    </Stack>
  );
};
