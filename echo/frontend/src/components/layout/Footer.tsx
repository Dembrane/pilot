import { Trans } from "@lingui/react/macro";
import { PRIVACY_POLICY_URL } from "@/config";
import { Anchor, Group, Stack, Text } from "@mantine/core";

export const Footer = () => (
  <Stack gap="xs" justify="center" align="center">
    <Group>
      <Anchor size="sm" target="_blank" href={PRIVACY_POLICY_URL}>
        <Trans>Privacy Statements</Trans>
      </Anchor>
    </Group>
    <Text size="sm">Dembrane B.V. 2024, all rights reserved.</Text>
  </Stack>
);
