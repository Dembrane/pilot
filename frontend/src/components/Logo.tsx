import { Group, Title } from "@mantine/core";
import logo from "../assets/dembrane-logo.png";

export const Logo = () => (
  <Group gap="sm" h="30px">
    <img src={logo} alt="Dembrane Logo" className="h-full object-contain" />
    <Title order={1} className="text-xl">
      Dembrane
    </Title>
  </Group>
);
