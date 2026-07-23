import type { Metadata } from "next";
import { CrmDashboard } from "./crm-dashboard";

export const metadata: Metadata = {
  title: "M8 CRM — управление лидами",
  description: "Лиды, офферы, команды, выплаты и аналитика в одном окне.",
};

export default function Home() {
  return <CrmDashboard />;
}
