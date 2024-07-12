import { DIRECTUS_PUBLIC_URL } from "@/config";
import { directus } from "@/lib/directus";
import { useLoginMutation } from "@/lib/query";
import { useAuthenticated } from "@/lib/useAuthenticated";
import { readProviders } from "@directus/sdk";
import {
  Alert,
  Anchor,
  Button,
  Container,
  Divider,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { IconBrandGoogle, IconLogin2 } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

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
  const { register, reset, handleSubmit } = useForm<{
    email: string;
    password: string;
  }>();

  const [searchParams, setSearchParams] = useSearchParams();

  const providerQuery = useQuery({
    queryKey: ["auth-providers"],
    queryFn: () => directus.request(readProviders()),
  });

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthenticated(false);

  const [error, setError] = useState("");
  const loginMutation = useLoginMutation();

  const onSubmit = handleSubmit(async (data) => {
    try {
      setError("");
      await loginMutation.mutateAsync([data.email, data.password]);
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
        <Stack className="flex-grow">
          <Title order={1}>Welcome!</Title>

          <form onSubmit={onSubmit}>
            <Stack>
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
              {/* <Link to="/reset-password"> */}
              <Anchor
                ta="right"
                variant="outline"
                onClick={() => alert("Please contact support.")}
              >
                Forgot your password?
              </Anchor>
              {/* </Link> */}
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
