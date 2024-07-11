import { Text, Container, Stack, Title } from "@mantine/core";

export const CheckYourEmailRoute = () => {
  return (
    <Container size="sm">
      <Stack>
        <Title order={1}>Check your email</Title>
        <Text>
          We have sent you an email with next steps. If you don't see it, check
          your spam folder.
        </Text>
      </Stack>
    </Container>
  );
};
