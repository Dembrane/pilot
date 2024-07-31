import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { directus } from "@/lib/directus";
import { useLogoutMutation } from "@/lib/query";

export const useAuthenticated = (doRedirect = false) => {
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  const checkAuth = async () => {
    try {
      await directus.refresh();
      setIsAuthenticated(true);
    } catch (e) {
      setIsAuthenticated(false);
      await logoutMutation.mutateAsync({
        next: location.pathname,
        doRedirect,
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    checkAuth().finally(() => {
      setLoading(false);
    });
  }, []);

  return { loading, isAuthenticated };
};
