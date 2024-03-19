import { Icons } from "@/icons";
import { useCreateProject } from "@/lib/query";
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
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import EditableTextBox from "@/components/EditableTextBox";

type FormValues = {
  language: "en" | "nl";
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
  const createProjectMutation = useCreateProject();

  const onSubmit = (data: FormValues) => {
    createProjectMutation.mutate(data);
  };

  return (
    <Container size="sm">
      <Stack>
        <Group className="sticky top-0" justify="space-between">
          <Group>
            <Breadcrumbs>
              <Link to="/projects/home">
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
              to={`/projects/${createProjectMutation.data.id}/overview`}
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
