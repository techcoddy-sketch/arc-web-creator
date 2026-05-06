import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

type StatCard = {
  key: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadow: string;
};

export function DocumentStats({ total, expiringSoon, expired, valid }: {
  total: number;
  expiringSoon: number;
  expired: number;
  valid: number;
}) {
  const navigate = useNavigate();

  const cards: StatCard[] = [
    {
      key: "all",
      label: "Total Documents",
      value: total,
      icon: FileText,
      gradient: "linear-gradient(135deg, #818CF8 0%, #6366F1 100%)",
      shadow: "0 10px 30px -8px rgba(99,102,241,0.45)",
    },
    {
      key: "valid",
      label: "Valid",
      value: valid,
      icon: CheckCircle,
      gradient: "linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)",
      shadow: "0 10px 30px -8px rgba(34,197,94,0.45)",
    },
    {
      key: "expiring",
      label: "Expiring Soon",
      value: expiringSoon,
      icon: Clock,
      gradient: "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)",
      shadow: "0 10px 30px -8px rgba(245,158,11,0.45)",
    },
    {
      key: "expired",
      label: "Expired",
      value: expired,
      icon: AlertTriangle,
      gradient: "linear-gradient(135deg, #FB7185 0%, #EF4444 100%)",
      shadow: "0 10px 30px -8px rgba(239,68,68,0.45)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map(({ key, label, value, icon: Icon, gradient, shadow }) => (
        <div
          key={key}
          onClick={() => navigate(`/documents?status=${key}`)}
          className="group relative cursor-pointer overflow-hidden rounded-[22px] p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:brightness-105"
          style={{
            background: gradient,
            boxShadow: shadow,
          }}
        >
          {/* Glassy highlight overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[22px] opacity-90"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%)",
            }}
          />
          {/* Soft inner light */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-40"
            style={{ background: "rgba(255,255,255,0.55)" }}
          />

          <CardHeader className="relative p-0 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-black tracking-wide">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                <Icon className="h-4 w-4 text-black" />
              </span>
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative p-0">
            <div className="text-3xl font-bold text-black drop-shadow-sm tracking-tight">
              {value}
            </div>
          </CardContent>
        </div>
      ))}
    </div>
  );
}
