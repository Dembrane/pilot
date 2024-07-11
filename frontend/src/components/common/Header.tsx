import { Paper, Group, ActionIcon } from "@mantine/core";
import { Logo } from "../Logo";
import { IconLogout } from "@tabler/icons-react";
import { useLogoutMutation } from "@/lib/query";
import { useAuthenticated } from "@/lib/useAuthenticated";

export const Header = () => {
  const logoutMutation = useLogoutMutation();
  const { loading, isAuthenticated } = useAuthenticated();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync({
      doRedirect: true,
    });
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
        {!loading && isAuthenticated && (
          <ActionIcon
            size="lg"
            c="gray"
            variant="transparent"
            loading={logoutMutation.isPending}
            onClick={handleLogout}
          >
            <IconLogout />
          </ActionIcon>
        )}
      </Group>
    </Paper>
  );
};
