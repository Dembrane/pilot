import {
  useCreateProjectTagMutation,
  useDeleteTagByIdMutation,
  useProjectById,
} from "@/lib/query";
import {
  Box,
  Button,
  Group,
  LoadingOverlay,
  Pill,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";

export const ProjectTagPill = ({ tag }: { tag: ProjectTag }) => {
  const deleteTagMutation = useDeleteTagByIdMutation();

  return (
    <Pill
      size="md"
      withRemoveButton
      onRemove={() => {
        deleteTagMutation.mutate(tag.id);
      }}
    >
      {tag.text}
    </Pill>
  );
};

export const ProjectTagsInput = (props: { projectId: string }) => {
  const projectQuery = useProjectById({ projectId: props.projectId });
  const createTagMutation = useCreateProjectTagMutation();

  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTagMutation.mutate({
      project_id: props.projectId,
      text: tagInput,
    });
    setTagInput("");
  };

  if (projectQuery.isLoading) {
    return (
      <Stack>
        <Skeleton height={30} />
      </Stack>
    );
  }

  return (
    <Stack className="relative">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <Box>
        <Title order={4}>Tags</Title>
        <Group gap="sm">
          {(projectQuery.data?.tags?.length ?? 0) === 0 && (
            <Text size="sm">
              No tags have been added to this project yet. Add a tag using the
              text input below to get started.
            </Text>
          )}
          {projectQuery.data?.tags?.map((tag) => (
            <ProjectTagPill key={tag.id} tag={tag} />
          ))}
        </Group>
      </Box>
      <form onSubmit={handleSubmit}>
        {createTagMutation.isError && (
          <Text c="red" size="sm">
            {createTagMutation.error.message}
          </Text>
        )}
        <Group align="end">
          <TextInput
            label="Add Tag"
            description="Participants will be able to select tags when creating conversations"
            value={tagInput}
            onChange={(e) => setTagInput(e.currentTarget.value)}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={createTagMutation.isPending || !tagInput.trim()}
          >
            Add Tag
          </Button>
        </Group>
      </form>
    </Stack>
  );
};
