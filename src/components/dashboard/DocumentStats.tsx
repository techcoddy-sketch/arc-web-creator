import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DocumentStats({ total, expiringSoon, expired, valid }: {
  total: number;
  expiringSoon: number;
  expired: number;
  valid: number;
}) {
  const navigate = useNavigate();

  const handleCardClick = (status: string) => {
    navigate(`/documents?status=${status}`);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div
        className="cursor-pointer rounded-2xl shadow-sm transition-transform duration-200 hover:scale-[1.02]"
        onClick={() => handleCardClick('all')}
        style={{ background: "linear-gradient(145deg, hsl(30 25% 88%), hsl(30 20% 82%), hsl(0 0% 78%))" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Total Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{total}</div>
        </CardContent>
      </div>

      <div
        className="cursor-pointer rounded-2xl shadow-sm transition-transform duration-200 hover:scale-[1.02]"
        onClick={() => handleCardClick('valid')}
        style={{ background: "linear-gradient(145deg, hsl(115 45% 78%), hsl(120 40% 72%), hsl(115 35% 66%))" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-black" />
            Valid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{valid}</div>
        </CardContent>
      </div>

      <div
        className="cursor-pointer rounded-2xl shadow-sm transition-transform duration-200 hover:scale-[1.02]"
        onClick={() => handleCardClick('expiring')}
        style={{ background: "linear-gradient(145deg, hsl(48 80% 78%), hsl(45 75% 70%), hsl(48 60% 62%))" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-black" />
            Expiring Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{expiringSoon}</div>
        </CardContent>
      </div>

      <div
        className="cursor-pointer rounded-2xl shadow-sm transition-transform duration-200 hover:scale-[1.02]"
        onClick={() => handleCardClick('expired')}
        style={{ background: "linear-gradient(145deg, hsl(0 70% 82%), hsl(0 60% 74%), hsl(0 50% 66%))" }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-black" />
            Expired
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{expired}</div>
        </CardContent>
      </div>
    </div>
  );
}
