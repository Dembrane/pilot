import { Anchor, Breadcrumbs as MantineBreadcrumbs, Text } from "@mantine/core";
import React from "react";
import { Link } from "react-router-dom";
import { I18nLink } from "@/components/common/i18nLink";

interface BreadcrumbItem {
  label: React.ReactNode;
  link?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <MantineBreadcrumbs className="flex-wrap">
      {items.map((item, index) => {
        if (item.link) {
          return (
            <I18nLink to={item.link} key={index}>
              <Anchor className="text-2xl font-semibold" c="gray">
                {item.label}
              </Anchor>
            </I18nLink>
          );
        }

        return (
          <Text key={index} className="text-2xl font-semibold">
            {item.label}
          </Text>
        );
      })}
    </MantineBreadcrumbs>
  );
};
