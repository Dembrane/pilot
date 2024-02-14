import { Group, Title } from "@mantine/core";
import logo from "../assets/dembrane-logo.png";

export const Logo = () => (
  <Group gap="sm">
    <img
      src={logo}
      alt="Dembrane Logo"
      style={{ height: "100%", width: "auto" }}
    />
    <Title order={1}>Dembrane</Title>
  </Group>
);
