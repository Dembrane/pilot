import { Group, GroupProps, Title } from "@mantine/core";
import logo from "../assets/dembrane-logo-hq.png";

type LogoProps = {
  hideTitle?: boolean;
} & GroupProps;

export const Logo = (props: LogoProps) => (
  <Group gap="sm" h="30px" {...props}>
    <img src={logo} alt="Dembrane Logo" className="h-full object-contain" />
    {!props.hideTitle && (
      <Title order={1} className="text-xl">
        Dembrane
      </Title>
    )}
  </Group>
);
