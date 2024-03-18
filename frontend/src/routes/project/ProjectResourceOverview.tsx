import { Icons } from "@/icons";
import {
  useDeleteProjectByIdMutation,
  useDeleteResourceByIdMutation,
  useProjectById,
  useResourceById,
  useUpdateProjectByIdMutation,
  useUpdateResourceByIdMutation,
} from "@/lib/query";
import { Trans } from "@lingui/macro";
import {
  Box,
  Button,
  CopyButton,
  Divider,
  Group,
  LoadingOverlay,
  NativeSelect,
  Paper,
  SimpleGrid,
  Stack,
  TextInput,
  Textarea,
  Title,
  Text,
  Tooltip,
  rem,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { IconCheck, IconCopy, IconTrash } from "@tabler/icons-react";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";

const ResourceDangerZone = ({ resource }: { resource: TResource }) => {
  const deleteResourceByIdMutation = useDeleteResourceByIdMutation();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      deleteResourceByIdMutation.mutate(resource.id);
      navigate("/projects/" + projectId + "/overview");
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
          Delete Resource
        </Button>
      </Box>
    </Stack>
  );
};

// type TResource = {
//   id: string;
//   created_at: Date;
//   updated_at: Date;
//   project_id: string;
//   is_processed: boolean;
//   type: string;
//   original_filename: string;
//   title: string;
//   description?: string;
//   context?: string;
//   processing_error?: string;
// };

type ResourceEditFormValues = {
  title: string;
  description: string;
  context: string;
};

const ResourceEdit = ({ resource }: { resource: TResource }) => {
  const { isSuccess, ...updateResourceMutation } =
    useUpdateResourceByIdMutation();

  const defaultValues: ResourceEditFormValues = {
    title: resource.title ?? "",
    description: resource.description ?? "",
    context: resource.context ?? "",
  };

  const { register, handleSubmit, formState, reset } =
    useForm<ResourceEditFormValues>({
      defaultValues,
    });

  useEffect(() => {
    if (isSuccess) {
      reset();
    }
  }, [isSuccess, reset]);

  const onSubmit = (data: ResourceEditFormValues) => {
    updateResourceMutation.mutate({
      id: resource.id,
      update: data,
    });
  };

  return (
    <Stack>
      <Group>
        <Title order={2}>
          <Trans>Edit Resource</Trans>
        </Title>
        {formState.isDirty && <Trans>Unsaved changes</Trans>}
      </Group>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="Title"
            {...register("title")}
            defaultValue={resource.title}
          />
          <Textarea
            label="Description"
            rows={6}
            {...register("description")}
            defaultValue={resource.description}
          />
          <Textarea
            label="Additional Context"
            rows={6}
            {...register("context")}
            defaultValue={resource.context}
          />

          <Group>
            <Button
              type="submit"
              loading={updateResourceMutation.isPending}
              disabled={!formState.isDirty}
            >
              <Trans>Save</Trans>
            </Button>
            <Button
              type="reset"
              variant="outline"
              onClick={() => reset(defaultValues)}
              disabled={!formState.isDirty}
            >
              <Trans>Cancel</Trans>
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
};

export const ProjectResourceOverviewRoute = () => {
  const { resourceId } = useParams();
  const resourceQuery = useResourceById(resourceId ?? "");

  return (
    <Stack className="relative">
      <LoadingOverlay visible={resourceQuery.isLoading} />
      {resourceQuery.data && (
        <>
          <ResourceEdit resource={resourceQuery.data} />
          <Divider />
          <ResourceDangerZone resource={resourceQuery.data} />
        </>
      )}
    </Stack>
  );
};
