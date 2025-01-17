import { Trans } from "@lingui/react/macro";
import { Stack, Paper, SimpleGrid, Text, Group, Pill } from "@mantine/core";

export const DummyViews = () => {
  return (
    <Stack>
      <Text c="gray">
        <Trans>
          These are your default view templates. Once you create your library
          these will be your first two views.
        </Trans>
      </Text>
      <Paper p="md">
        <SimpleGrid cols={3}>
          <Paper bg="white" p="md">
            <Text className="font-xl pb-2 font-semibold">
              <Trans>Topics</Trans>
            </Text>
            <Group>
              <Pill>
                <Trans>0 Aspects</Trans>
              </Pill>
            </Group>
          </Paper>
          <Paper bg="white" p="md">
            <Text className="font-xl pb-2 font-semibold">
              <Trans>Sentiment</Trans>
            </Text>
            <Group>
              <Pill>
                <Trans>0 Aspects</Trans>
              </Pill>
            </Group>
          </Paper>
        </SimpleGrid>
      </Paper>
    </Stack>
  );
};
