import { lazy, Suspense } from "react";
import { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { Skeleton } from "@mantine/core";

const fallback = <Skeleton variant="circular" width={24} height={24} />;

interface IconProps extends Omit<LucideProps, "ref"> {
  name: keyof typeof dynamicIconImports;
}

export const DynamicLucideIcon = ({ name, ...props }: IconProps) => {
  const LucideIcon = lazy(dynamicIconImports[name]);

  return (
    <Suspense fallback={fallback}>
      <LucideIcon {...props} />
    </Suspense>
  );
};
