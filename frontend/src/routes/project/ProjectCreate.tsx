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
import EditableTextBox from "@/components/common/EditableTextBox";
import { useDocumentTitle } from "@mantine/hooks";

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
  useDocumentTitle("New Project | Dembrane");
  const createProjectMutation = useCreateProjectMutation();

  const onSubmit = (data: FormValues) => {
    createProjectMutation.mutate({
      ...data,
    });
  };

  return (
    <Container size="sm">
      <Stack>
        <Group className="sticky top-0" justify="space-between">
          <Group>
            <Breadcrumbs>
              <Link to={`/projects`}>
                <Icons.Home />
              </Link>
              <Title order={1}>
                <EditableTextBox
                  value="New Event Title"
                  onChange={async (value) => setValue("name", value)}
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
