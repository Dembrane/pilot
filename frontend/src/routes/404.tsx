import { Button, Center, Stack, Title } from "@mantine/core";
import { usei18nNavigate } from "@/lib/usei18nNavigate";
import { Trans } from "@lingui/macro";

export const NotFoundRoute = () => {
  const navigate = usei18nNavigate();

  return (
    <Center className="flex h-[60vh] flex-col items-center justify-center">
      <Stack>
        <Title order={1}>
          <Trans>Page not found</Trans>
        </Title>
        <Button onClick={() => navigate("/")}>
          <Trans>Go home</Trans>
        </Button>
      </Stack>
    </Center>
  );
};
