import { Trans } from "@lingui/react/macro";
import { Button, Center, Stack, Title } from "@mantine/core";
import { useI18nNavigate } from "@/hooks/useI18nNavigate";
import { BaseLayout } from "@/components/layout/BaseLayout";

export const NotFoundRoute = () => {
  const navigate = useI18nNavigate();

  return (
    <BaseLayout>
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
    </BaseLayout>
  );
};
