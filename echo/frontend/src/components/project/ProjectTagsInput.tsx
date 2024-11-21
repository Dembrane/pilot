import {
  useCreateProjectTagMutation,
  useDeleteTagByIdMutation,
  useProjectById,
  useUpdateProjectTagByIdMutation,
} from "@/lib/query";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Trans, t } from "@lingui/macro";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Pill,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useState } from "react";
import {
  DragEndEvent,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icons } from "@/icons";
import { IconX } from "@tabler/icons-react";

export const ProjectTagPill = ({ tag }: { tag: ProjectTag }) => {
  const deleteTagMutation = useDeleteTagByIdMutation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ 
      id: tag.id,
      // @ts-expect-error prevent accidental drag
      activationConstraint: {
        distance: 8,
      }
    });

  if (!tag || !tag.text) {
    return null;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isDragging && window.confirm(t`Are you sure you want to delete this tag?`)) {
      deleteTagMutation.mutate(tag.id);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="flex items-center gap-2 rounded-md bg-blue-200 px-2"
      >
        <div className="">{tag.text}</div>
        <ActionIcon
          onClick={(e) => handleDelete(e)}
          size="xs"
          variant="transparent"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <IconX />
        </ActionIcon>
      </div>
    </>
  );
};

export const ProjectTagsInput = (props: { project: Project }) => {
  const projectQuery = useProjectById({ projectId: props.project.id });
  const createTagMutation = useCreateProjectTagMutation();
  const updateTagMutation = useUpdateProjectTagByIdMutation();

  const [tagInput, setTagInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleSubmit = () => {
    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    const currentMaxSort = Math.max(
      0,
      ...(projectQuery.data?.tags?.map((t) => t.sort ?? 0) ?? []),
    );

    tags.forEach((tag, index) => {
      createTagMutation.mutate({
        project_id: {
          id: props.project.id,
          directus_user_id: (props.project.directus_user_id as string) ?? "",
        },
        text: tag,
        sort: currentMaxSort + index + 1, // New tags get appended to the end
      });
    });
    setTagInput("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id) return;

    const oldIndex = projectQuery.data?.tags?.findIndex(
      (tag) => tag.id === active.id,
    );
    const newIndex = projectQuery.data?.tags?.findIndex(
      (tag) => tag.id === over.id,
    );

    if (
      oldIndex === undefined ||
      newIndex === undefined ||
      !projectQuery.data?.tags
    )
      return;

    // Create new array with updated positions
    const newTags = arrayMove(projectQuery.data.tags, oldIndex, newIndex);

    // Update sort values for all affected tags
    newTags.forEach((tag: ProjectTag, index: number) => {
      updateTagMutation.mutate({
        id: tag.id,
        project_id: props.project.id,
        payload: {
          sort: index + 1, // Sort starts from 1
        },
      });
    });
  };

  if (projectQuery.isLoading) {
    return (
      <Stack>
        <Skeleton height={30} />
      </Stack>
    );
  }

  // Sort tags by sort field before rendering
  const sortedTags = [...(projectQuery.data?.tags ?? [])].sort(
    (a, b) => (a.sort ?? Infinity) - (b.sort ?? Infinity),
  );

  return (
    <Stack className="relative">
      <LoadingOverlay visible={projectQuery.isLoading} />
      <Box>
        {createTagMutation.isError && (
          <Text c="red" size="sm">
            {createTagMutation.error.message}
          </Text>
        )}
        <Stack gap="sm">
          <Group align="end">
            <TextInput
              label={t`Tags`}
              description={t`Participants will be able to select tags when creating conversations`}
              value={tagInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              onChange={(e) => setTagInput(e.currentTarget.value)}
            />
            <Button
              loading={createTagMutation.isPending}
              onClick={handleSubmit}
              variant="outline"
              disabled={!tagInput.trim() || createTagMutation.isPending}
            >
              {tagInput.includes(",") ? t`Add Tags` : t`Add Tag`}
            </Button>
          </Group>
          <Group gap="sm">
            {(projectQuery.data?.tags?.length ?? 0) === 0 ? (
              <Alert>
                <Text size="sm">
                  <Trans>
                    No tags have been added to this project yet. Add a tag using
                    the text input above to get started.
                  </Trans>
                </Text>
              </Alert>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedTags.map((tag) => tag.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {sortedTags.map((tag) => (
                    <ProjectTagPill key={tag.id} tag={tag} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </Group>
        </Stack>
      </Box>
    </Stack>
  );
};
