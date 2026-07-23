import type { Metadata } from "next";
import { CrmDashboard } from "./crm-dashboard";

export const metadata: Metadata = {
  title: "Платформа M&K — управление лидами",
  description: "Лиды, офферы, команды, выплаты и аналитика в одном окне.",
};

export default function Home() {
  return <CrmDashboard />;
}
