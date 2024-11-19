import {
  ActionIcon,
  Avatar,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { Logo } from "../common/Logo";
import { IconBug, IconLogout, IconSettings } from "@tabler/icons-react";
import { useCurrentUser, useLogoutMutation } from "@/lib/query";
import { useAuthenticated } from "@/lib/useAuthenticated";
import { I18nLink } from "@/components/common/i18nLink";
import { LanguagePicker } from "../language/LanguagePicker";
import { Trans, t } from "@lingui/macro";
import { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";

const User = ({
  image,
  name,
  email,
}: {
  image: string;
  name: string;
  email: string;
}) => (
  <div
    style={{
      color: "var(--mantine-color-text)",
      borderRadius: "var(--mantine-radius-sm)",
    }}
  >
    <Group gap="sm">
      <Avatar src={image} radius="xl" />

      <div style={{ flex: 1 }} className="hidden md:block">
        <Text size="sm" fw={500}>
          {name}
        </Text>

        <Text c="dimmed" size="xs">
          {email}
        </Text>
      </div>
    </Group>
  </div>
);

function CreateFeedbackButton() {
  const feedback = Sentry.getFeedback();

  if (!feedback) {
    return null;
  }

  return (
    <Menu.Item
      leftSection={<IconBug color="gray" />}
      onClick={async () => {
        const form = await feedback?.createForm();
        if (form) {
          form.appendToDom();
          form.open();
        }
      }}
    >
      <Trans>Report an issue</Trans>
    </Menu.Item>
  );
}

export const Header = () => {
  const logoutMutation = useLogoutMutation();
  const { loading, isAuthenticated } = useAuthenticated();
  const { data: user } = useCurrentUser(); // Assuming this hook provides user data

  const handleLogout = async () => {
    await logoutMutation.mutateAsync({
      doRedirect: true,
    });
  };

  return (
    <Paper
      component="header"
      shadow="xs"
      radius="0"
      className="z-30 h-full w-full px-4"
      bg={{ dark: "dark.8", light: "white" }}
    >
      <Group
        justify="space-between"
        align="center"
        className="h-full min-h-[58px] w-full"
      >
        <Group gap="md">
          <I18nLink to="/projects">
            <Logo />
          </I18nLink>
        </Group>

        {!loading && isAuthenticated && user ? (
          <Menu withArrow arrowPosition="center">
            <Menu.Target>
              <ActionIcon color="gray" variant="transparent">
                <IconSettings />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown className="py-4">
              <Stack gap="xs" className="px-2">
                <User
                  image={typeof user.avatar === "string" ? user.avatar : ""}
                  name={t`Hi, ${user.first_name}`}
                  email={user.email || ""}
                />

                <Menu.Item
                  leftSection={<IconLogout color="gray" />}
                  onClick={handleLogout}
                >
                  <Trans>Logout</Trans>
                </Menu.Item>

                <CreateFeedbackButton />

                <Menu.Divider />

                <LanguagePicker />
              </Stack>
            </Menu.Dropdown>
          </Menu>
        ) : (
          <Group>
            <LanguagePicker />
          </Group>
        )}
      </Group>
    </Paper>
  );
};
