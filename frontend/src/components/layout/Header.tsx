import {
  Paper,
  Group,
  Menu,
  UnstyledButton,
  Avatar,
  Text,
  Stack,
} from "@mantine/core";
import { Logo } from "../common/Logo";
import { IconLogout, IconSettings, IconChevronDown } from "@tabler/icons-react";
import { useLogoutMutation, useCurrentUser } from "@/lib/query";
import { useAuthenticated } from "@/lib/useAuthenticated";
import { forwardRef } from "react";
import { I18nLink } from "@/components/common/i18nLink";
import { LanguagePicker } from "../language/LanguagePicker";
import { t, Trans } from "@lingui/macro";

const UserButton = forwardRef<
  HTMLButtonElement,
  {
    image: string;
    name: string;
    email: string;
    icon?: React.ReactNode;
  }
>(({ image, name, email, icon, ...others }, ref) => (
  <UnstyledButton
    ref={ref}
    style={{
      color: "var(--mantine-color-text)",
      borderRadius: "var(--mantine-radius-sm)",
    }}
    {...others}
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

      {icon || <IconChevronDown size="1rem" className="hidden md:block" />}
    </Group>
  </UnstyledButton>
));

export const Header = () => {
  const logoutMutation = useLogoutMutation();
  const { loading, isAuthenticated } = useAuthenticated();
  const { data: user } = useCurrentUser(); // Assuming this hook provides user data

  const handleLogout = async () => {
    await logoutMutation.mutateAsync({
      doRedirect: true,
    });
  };

  const handleSettingsClick = () => {
    alert("Coming Soon!");
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
              <UserButton
                image={typeof user.avatar === "string" ? user.avatar : ""}
                name={t`Hi, ${user.first_name}`}
                email={user.email || ""}
              />
            </Menu.Target>
            <Menu.Dropdown>
              <Stack gap="xs">
                <LanguagePicker />
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconSettings color="gray" />}
                  onClick={handleSettingsClick}
                >
                  <Trans>Settings</Trans>
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconLogout color="gray" />}
                  onClick={handleLogout}
                >
                  <Trans>Logout</Trans>
                </Menu.Item>
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
