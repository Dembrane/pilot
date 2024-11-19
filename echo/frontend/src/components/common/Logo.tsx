import { Group, GroupProps, Title } from "@mantine/core";
import logo from "@/assets/dembrane-logo-hq.png";

type LogoProps = {
  hideLogo?: boolean;
  hideTitle?: boolean;
} & GroupProps;

export const Logo = ({ hideLogo, hideTitle, ...props }: LogoProps) => (
  <Group gap="sm" h="30px" {...props}>
    {!hideLogo && (
      <img src={logo} alt="Dembrane Logo" className="h-full object-contain" />
    )}
    {!hideTitle && (
      <Title order={1} className="text-xl">
        Dembrane
      </Title>
    )}
  </Group>
);
