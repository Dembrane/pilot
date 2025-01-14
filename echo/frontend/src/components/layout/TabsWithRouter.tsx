import { Stack, Tabs } from "@mantine/core";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { useI18nNavigate } from "@/hooks/useI18nNavigate";

export const TabsWithRouter = ({
  basePath,
  tabs,
  loading = false,
}: {
  basePath: string;
  tabs: { value: string; label: string }[];
  loading?: boolean;
}) => {
  const navigate = useI18nNavigate();
  const location = useLocation();
  const params = useParams();

  const determineInitialTab = () => {
    return (
      tabs.find((tab) => location.pathname.includes(`/${tab.value}`))?.value ||
      tabs[0].value
    );
  };

  const [activeTab, setActiveTab] = useState(determineInitialTab());

  useEffect(() => {
    setActiveTab(determineInitialTab());
  }, [location.pathname]);

  const handleTabChange = (value: string | null) => {
    const path = basePath.replace(/:(\w+)/g, (_, param) => params[param] || "");
    navigate(`${path}/${value}`);
    setActiveTab(value ?? "");
  };

  return (
    <Stack className="relative">
      <Tabs value={activeTab} onChange={handleTabChange} variant="default">
        <Tabs.List grow justify="space-between">
          {tabs.map((tab) => (
            <Tabs.Tab disabled={loading} key={tab.value} value={tab.value}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <Outlet />
    </Stack>
  );
};
