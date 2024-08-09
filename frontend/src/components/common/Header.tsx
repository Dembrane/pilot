import {
  Paper,
  Group,
  ActionIcon,
  Menu,
  UnstyledButton,
  Avatar,
  Text,
  VisuallyHidden,
} from "@mantine/core";
import { Logo } from "./Logo";
import {
  IconLogout,
  IconChevronRight,
  IconSettings,
  IconChevronDown,
} from "@tabler/icons-react";
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
      bg="white"
      component="header"
      p="xs"
      shadow="xs"
      className="h-full w-full rounded-none"
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
