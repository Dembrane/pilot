import { I18nLink } from "@/components/common/i18nLink";
import { ADMIN_BASE_URL } from "@/config";
import { useRegisterMutation } from "@/lib/query";
import {
  Alert,
  Button,
  Container,
  Divider,
  PasswordInput,
  SimpleGrid,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

export const RegisterRoute = () => {
  useDocumentTitle("Register | Dembrane");
  const { register, handleSubmit } = useForm<{
    email: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
  }>();

  const [error, setError] = useState("");

  const registerMutation = useRegisterMutation();

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    registerMutation.mutate([
      data.email,
      data.password,
      {
        first_name: data.first_name,
        last_name: data.last_name,
        verification_url: `${ADMIN_BASE_URL}/verify-email`,
      },
    ]);
  });

  return (
    <Container size="sm" className="!h-full">
      <Stack className="h-full">
        <Stack className="flex-grow">
          <Title order={1}>Create an Account</Title>

          <form onSubmit={onSubmit}>
            <Stack>
              {error && <Alert color="red">{error}</Alert>}
              {registerMutation.error && (
                <Alert color="red">{registerMutation.error.message}</Alert>
              )}
              <SimpleGrid
                cols={{
                  xs: 1,
                  sm: 2,
                }}
                spacing="md"
              >
                <TextInput
                  size="lg"
                  label="First Name"
                  {...register("first_name")}
                  placeholder="First Name"
                  required
                />
                <TextInput
                  size="lg"
                  label="Last Name"
                  {...register("last_name")}
                  placeholder="Last Name"
                  required
                />
              </SimpleGrid>
              <TextInput
                size="lg"
                label="Email"
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
              <PasswordInput
                label="Confirm Password"
                size="lg"
                {...register("confirmPassword")}
                placeholder="Confirm Password"
                required
              />
              <Button
                size="lg"
                type="submit"
                loading={registerMutation.isPending}
              >
                Register
              </Button>
            </Stack>
          </form>

          <Divider variant="dashed" label="or" labelPosition="center" />

          <I18nLink to="/login">
            <Button size="lg" variant="outline" fullWidth>
              Login as an existing user
            </Button>
          </I18nLink>
        </Stack>
      </Stack>
    </Container>
  );
};
