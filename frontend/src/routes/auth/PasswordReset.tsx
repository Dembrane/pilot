import { useResetPasswordMutation } from "@/lib/query";
import {
  Alert,
  Button,
  Container,
  PasswordInput,
  Stack,
  Title,
} from "@mantine/core";
import { useDocumentTitle } from "@mantine/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

export const PasswordResetRoute = () => {
  useDocumentTitle("Reset Password | Dembrane");
  const [search, _] = useSearchParams();
  const { register, handleSubmit } = useForm<{
    password: string;
    confirmPassword: string;
  }>();
  const [error, setError] = useState("");

  const resetPasswordMutation = useResetPasswordMutation();

  const onSubmit = handleSubmit(async (data) => {
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!search.get("token") || search.get("token") === "") {
      setError("Invalid code. Please request a new one.");
      return;
    }

    resetPasswordMutation.mutate({
      token: search.get("token")!,
      password: data.password,
    });
  });

  return (
    <Container size="sm" className="!h-full">
      <Stack className="h-full">
        <Stack className="flex-grow">
          <Title order={1}>Reset Password</Title>

          <form onSubmit={onSubmit}>
            <Stack>
              {error && <Alert color="red">{error}</Alert>}
              <PasswordInput
                label="New Password"
                size="lg"
                {...register("password")}
                placeholder="New Password"
                required
              />
              <PasswordInput
                label="Confirm New Password"
                size="lg"
                {...register("confirmPassword")}
                placeholder="Confirm New Password"
                required
              />
              <Button
                size="lg"
                type="submit"
                loading={resetPasswordMutation.isPending}
              >
                Reset Password
              </Button>
            </Stack>
          </form>
        </Stack>
      </Stack>
    </Container>
  );
};
