import { useState } from "react";
import { Card } from "@/components/ui/card";

interface PersonaData {
  name: string;
  value: number;
  percentage: string;
}

interface PersonaChartProps {
  data: PersonaData[];
}

export default function PersonaChart({ data }: PersonaChartProps) {
  const [metricType, setMetricType] = useState("conversion");

  return (
    <Card className="bg-white rounded-lg shadow card">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-medium">Persona Performance</h2>
        <div className="relative">
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
            className="block w-full px-3 py-1.5 pr-8 text-sm border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="conversion">Conversion Rate</option>
            <option value="response">Response Time</option>
            <option value="satisfaction">Customer Satisfaction</option>
          </select>
          <span className="absolute top-2 right-2 material-icons text-neutral-400 text-sm pointer-events-none">
            arrow_drop_down
          </span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-sm text-neutral-500">{item.percentage}</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${item.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <a
          href="#"
          className="block px-4 py-2 text-sm font-medium text-center text-primary bg-primary/5 rounded-md hover:bg-primary/10"
        >
          View All Personas
        </a>
      </div>
    </Card>
  );
}
