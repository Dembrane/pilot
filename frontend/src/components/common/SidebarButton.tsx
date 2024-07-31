import {
  UnstyledButtonProps,
  UnstyledButton,
  Text,
  Group,
  PolymorphicComponentProps,
} from "@mantine/core";
import { PropsWithChildren } from "react";

type SidebarButtonProps = {
  icon?: React.ReactNode;
} & PolymorphicComponentProps<"a" | "button", UnstyledButtonProps>;

export const SidebarButton = ({
  children,
  icon,
  ...props
}: PropsWithChildren<SidebarButtonProps>) => {
  return (
    <UnstyledButton {...props}>
      <Group className="shadow-sm w-full justify-between px-4 py-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
        <Text size="lg" className="font-semibold">
          {children}
        </Text>
        {!!icon && icon}
      </Group>
    </UnstyledButton>
  );
};
