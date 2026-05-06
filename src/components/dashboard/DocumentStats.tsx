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
        style={{
          background: "linear-gradient(135deg, #b5a99a 0%, #8c7d6e 100%)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 8px 32px rgba(140,125,110,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
          borderRadius: "1rem",
        }}
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
        style={{
          background: "linear-gradient(135deg, #6abf7b 0%, #3a9e52 100%)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 8px 32px rgba(58,158,82,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
          borderRadius: "1rem",
        }}
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
        style={{
          background: "linear-gradient(135deg, #d4b84a 0%, #b8962e 100%)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 8px 32px rgba(184,150,46,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
          borderRadius: "1rem",
        }}
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
        style={{
          background: "linear-gradient(135deg, #e07070 0%, #c0404a 100%)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 8px 32px rgba(192,64,74,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
          borderRadius: "1rem",
        }}
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
