import {
  Paper,
  Group,
  Menu,
  UnstyledButton,
  Avatar,
  Text,
} from "@mantine/core";
import { Logo } from "./Logo";
import { IconLogout, IconSettings, IconChevronDown } from "@tabler/icons-react";
import { useLogoutMutation, useCurrentUser } from "@/lib/query";
import { useAuthenticated } from "@/lib/useAuthenticated";
import { forwardRef } from "react";

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
      p="xs"
      shadow="xs"
      className="z-30 h-full w-full"
      bg={{ dark: "dark.8", light: "white" }}
    >
      <Group justify="space-between" align="center" className="h-full w-full">
        <Group gap="md">
          <Logo />
        </Group>
        {!loading && isAuthenticated && user && (
          <Menu withArrow arrowPosition="center">
            <Menu.Target>
              <UserButton
                image={typeof user.avatar === "string" ? user.avatar : ""}
                name={`Hi, ${user.first_name}`}
                email={user.email || ""}
              />
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconSettings color="gray" />}
                onClick={handleSettingsClick}
              >
                Settings
              </Menu.Item>
              <Menu.Item
                leftSection={<IconLogout color="gray" />}
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Paper>
  );
};
