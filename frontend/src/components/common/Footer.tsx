import { PRIVACY_POLICY_URL } from "@/config";
import { Trans } from "@lingui/macro";
import { Stack, Anchor, Text } from "@mantine/core";

export const Footer = () => (
  <Stack gap="xs" justify="center" align="center">
    <Anchor size="sm" target="_blank" href={PRIVACY_POLICY_URL}>
      <Trans>Privacy Statements</Trans>
    </Anchor>
    <Text size="sm">Dembrane B.V. 2024, all rights reserved.</Text>
  </Stack>
);
