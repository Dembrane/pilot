import { DIRECTUS_PUBLIC_URL } from "@/config";
import { directus } from "@/lib/directus";
import {
  useCreateProjectMutation,
  useCreateSessionMutation,
  useLoginMutation,
} from "@/lib/query";
import { readItems, readProviders } from "@directus/sdk";
import {
  Alert,
  Anchor,
  Button,
  Container,
  Divider,
  PasswordInput,
  Text,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { IconBrandGoogle, IconLogin2 } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const LoginWithProvider = ({
  provider,
  icon,
  label,
}: {
  provider: string;
  icon: React.ReactNode;
  label: string;
}) => {
  return (
    <Button
      component="a"
      href={`${DIRECTUS_PUBLIC_URL}/auth/login/${provider}?redirect=${encodeURIComponent(
        window.location.origin + "/workspaces",
      )}`}
      c="gray"
      color="gray.6"
      variant="outline"
      rightSection={icon}
      fullWidth
    >
      {label}
    </Button>
  );
};

export const LoginRoute = () => {
  useDocumentTitle("Login | Dembrane");
  const { register, handleSubmit } = useForm<{
    email: string;
    password: string;
  }>();

  const [searchParams, _setSearchParams] = useSearchParams();

  const providerQuery = useQuery({
    queryKey: ["auth-providers"],
    queryFn: () => directus.request(readProviders()),
  });

  const navigate = useNavigate();
  const createSessionMutation = useCreateSessionMutation();
  const createProjectMutation = useCreateProjectMutation();

  const [error, setError] = useState("");
  const loginMutation = useLoginMutation();

  const onSubmit = handleSubmit(async (data) => {
    try {
      setError("");
      await loginMutation.mutateAsync([data.email, data.password]);

      const projectsCount = await directus.request<Project[]>(
        readItems("project", { limit: 1 }),
      );
      const isNewAccount =
        searchParams.get("new") === "true" && projectsCount.length === 0;

      if (Boolean(isNewAccount)) {
        toast("Setting up your first project");
        await loginMutation.mutateAsync([data.email, data.password]);
        const session = await createSessionMutation.mutateAsync({});
        const project = await createProjectMutation.mutateAsync({
          session_id: session.id,
          name: "New Project",
        });
        navigate(`/workspaces/${session.id}/projects/${project.id}/overview`);
        return;
      }

      const next = searchParams.get("next");
      if (!!next && next !== "/login") {
        window.location.href = next;
      } else {
        window.location.href = "/workspaces";
      }
    } catch (error) {
      try {
        if ((error as any).errors[0].message != "") {
          setError((error as any).errors[0].message);
        }
      } catch {
        setError("Something went wrong");
      }
    }
  });

  return (
    <Container size="sm" className="!h-full">
      <Stack className="h-full">
        <Stack className="flex-grow" gap="md">
          <Title order={1}>Welcome!</Title>

          {(searchParams.get("new") === "true" ||
            !!searchParams.get("redirect")) && (
            <Text>Please login to continue.</Text>
          )}

          <form onSubmit={onSubmit}>
            <Stack gap="sm">
              {error && <Alert color="red">{error}</Alert>}

              <TextInput
                label="Email"
                size="lg"
                {...register("email")}
                placeholder="Email"
                required
                type="email"
              />
              <PasswordInput
                label="Password"
                size="lg"
                {...register("password")}
                placeholder="Password"
                required
              />
              <div className="w-full text-right">
                <Link to="/request-password-reset">
                  <Anchor variant="outline">Forgot your password?</Anchor>
                </Link>
              </div>
              <Button size="lg" type="submit" loading={loginMutation.isPending}>
                Login
              </Button>
            </Stack>
          </form>

          <Divider variant="dashed" label="or" labelPosition="center" />

          <Link to="/register">
            <Button size="lg" variant="outline" fullWidth>
              Register as a new user
            </Button>
          </Link>

          {providerQuery.data && providerQuery.data.length > 0 && (
            <Divider variant="dashed" label="or" labelPosition="center" />
          )}

          {providerQuery.data?.find(
            (provider) => provider.name === "google",
          ) && (
            <LoginWithProvider
              provider="google"
              icon={<IconBrandGoogle />}
              label="Sign in with Google"
            />
          )}

          {providerQuery.data?.find(
            (provider) => provider.name === "outseta",
          ) && (
            <LoginWithProvider
              provider="outseta"
              icon={<IconLogin2 />}
              label="Login"
            />
          )}
        </Stack>
      </Stack>
    </Container>
  );
};
