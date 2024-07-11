import { Icons } from "@/icons";
import { useCreateProjectMutation } from "@/lib/query";
import {
  Breadcrumbs,
  Button,
  Container,
  Divider,
  Group,
  LoadingOverlay,
  Stack,
  Textarea,
  Title,
} from "@mantine/core";
import { Link, Navigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import EditableTextBox from "@/components/EditableTextBox";

type FormValues = {
  language: "en" | "nl" | "multi";
  context?: string;
  name?: string;
};

export const ProjectsCreateRoute = () => {
  const {
    setValue,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const createProjectMutation = useCreateProjectMutation();

  const { sessionId } = useParams();

  const onSubmit = (data: FormValues) => {
    createProjectMutation.mutate({
      ...data,
      session_id: Number(sessionId),
    });
  };

  return (
    <Container size="sm">
      <Stack>
        <Group className="sticky top-0" justify="space-between">
          <Group>
            <Breadcrumbs>
              <Link to={`/workspaces/${sessionId}/projects`}>
                <Icons.Home />
              </Link>
              <Title order={1}>
                <EditableTextBox
                  initialValue="New Event Title"
                  onSave={(value) => setValue("name", value)}
                  disabled={createProjectMutation.isPending}
                />
              </Title>
            </Breadcrumbs>
          </Group>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={createProjectMutation.isPending}
          >
            Publish
          </Button>
        </Group>
        <Divider />
        <Stack>
          <LoadingOverlay visible={createProjectMutation.isPending} />
          {createProjectMutation.data && (
            <Navigate
              to={`/workspaces/${sessionId}/projects/${createProjectMutation.data.id}/overview`}
            />
          )}
          <Textarea
            size="md"
            {...register("context")}
            placeholder="Enter context here..."
            label="Context"
            error={errors.context?.message}
            rows={6}
          />
        </Stack>
      </Stack>
    </Container>
  );
};
