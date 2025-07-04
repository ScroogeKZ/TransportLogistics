import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResponsiveCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export function ResponsiveCard({ title, children, className = "", headerAction }: ResponsiveCardProps) {
  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {title && (
        <CardHeader className="pb-3 sm:pb-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </CardHeader>
      )}
      <CardContent className="p-4 sm:p-6">
        {children}
      </CardContent>
    </Card>
  );
}