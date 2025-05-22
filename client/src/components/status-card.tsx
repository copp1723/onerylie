import { Card } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  value: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  progressValue?: number;
  progressColor?: string;
  progressLabel?: string;
  trend?: {
    value: string;
    direction: "up" | "down";
    label: string;
  };
}

export default function StatusCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  progressValue,
  progressColor,
  progressLabel,
  trend,
}: StatusCardProps) {
  return (
    <Card className="p-4 bg-white shadow hover:shadow-md transition-shadow card">
      <div className="flex items-center">
        <div className={`p-2 ${iconBgColor} rounded-full`}>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="text-xl font-medium">{value}</p>
        </div>
      </div>
      
      <div className="mt-4">
        {progressValue !== undefined && (
          <>
            <div className="w-full h-2 bg-neutral-100 rounded-full">
              <div 
                className={`h-2 ${progressColor} rounded-full`} 
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
            {progressLabel && <p className="mt-1 text-xs text-neutral-500">{progressLabel}</p>}
          </>
        )}
        
        {trend && (
          <>
            <div className="flex items-center">
              <span className={`material-icons text-${trend.direction === 'up' ? 'success' : 'error'} text-sm`}>
                trending_{trend.direction}
              </span>
              <span className={`ml-1 text-xs text-${trend.direction === 'up' ? 'success' : 'error'}`}>
                {trend.value}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{trend.label}</p>
          </>
        )}
      </div>
    </Card>
  );
}
