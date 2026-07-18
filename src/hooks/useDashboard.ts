"use client";

import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "@/lib/services/dashboard.service";
import type { DashboardData } from "@/types/dashboard";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getDashboardData();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("An unknown error occurred while fetching dashboard data"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refresh, lastUpdated };
}