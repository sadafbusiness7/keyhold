import { createContext, useContext, useMemo, useState, type ReactNode, useEffect } from "react";
import { portfolios as seedPortfolios, properties as allProperties, type Portfolio, type Property } from "./mock-data";

type PortfolioCtx = {
  portfolios: Portfolio[];
  activeScope: string; // 'all' | 'p-{id}' | 'portfolio-{id}'
  setActiveScope: (scope: string) => void;
  scopedProperties: Property[];
  scopedPropertyIds: string[];
  scopeLabel: string;
  addPortfolio: (name: string, propertyIds: string[]) => void;
};

const PortfolioContext = createContext<PortfolioCtx | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(seedPortfolios);
  const [activeScope, setActiveScope] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kh_active_scope") || "all";
    }
    return "all";
  });

  useEffect(() => {
    localStorage.setItem("kh_active_scope", activeScope);
  }, [activeScope]);

  const scopedProperties = useMemo(() => {
    if (activeScope === "all") return allProperties;
    if (activeScope.startsWith("p-")) {
      const id = activeScope.replace("p-", "");
      return allProperties.filter((p) => p.id === id);
    }
    if (activeScope.startsWith("portfolio-")) {
      const id = activeScope.replace("portfolio-", "");
      const portfolio = portfolios.find((p) => p.id === id);
      if (!portfolio) return allProperties;
      return allProperties.filter((p) => portfolio.propertyIds.includes(p.id));
    }
    return allProperties;
  }, [activeScope, portfolios]);

  const scopedPropertyIds = useMemo(() => scopedProperties.map((p) => p.id), [scopedProperties]);

  const scopeLabel = useMemo(() => {
    if (activeScope === "all") return "All Properties";
    if (activeScope.startsWith("p-")) {
      const id = activeScope.replace("p-", "");
      return allProperties.find((p) => p.id === id)?.name || "Unknown Property";
    }
    if (activeScope.startsWith("portfolio-")) {
      const id = activeScope.replace("portfolio-", "");
      return portfolios.find((p) => p.id === id)?.name || "Unknown Portfolio";
    }
    return "Filtered Scope";
  }, [activeScope, portfolios]);

  const addPortfolio = (name: string, propertyIds: string[]) => {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    setPortfolios((prev) => [...prev, { id, name, propertyIds }]);
  };

  const value = useMemo(
    () => ({
      portfolios,
      activeScope,
      setActiveScope,
      scopedProperties,
      scopedPropertyIds,
      scopeLabel,
      addPortfolio,
    }),
    [portfolios, activeScope, scopedProperties, scopedPropertyIds, scopeLabel]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used inside <PortfolioProvider>");
  return ctx;
}
