import { cn } from "@/lib/utils";
import {
  UnstyledButtonProps,
  UnstyledButton,
  Text,
  Group,
  PolymorphicComponentProps,
} from "@mantine/core";
import { PropsWithChildren } from "react";

type Props = {
  rightSection?: React.ReactNode;
  active?: boolean;
} & PolymorphicComponentProps<"a" | "button", UnstyledButtonProps>;

export const NavigationButton = ({
  children,
  rightSection,
  active,
  ...props
}: PropsWithChildren<Props>) => {
  return (
    <UnstyledButton {...props} aria-selected={active}>
      <Group
        className={cn(
          "w-full justify-between rounded-md border border-gray-200 bg-white px-4 py-2 shadow-sm transition-colors hover:border-primary-500",
          active ? "border-primary-500" : "",
        )}
      >
        <Text size="lg" className="font-semibold">
          {children}
        </Text>
        {!!rightSection && rightSection}
      </Group>
    </UnstyledButton>
  );
};
