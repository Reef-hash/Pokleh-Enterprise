import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResponsiveColumn {
  header: string;
  className?: string;
}

interface ResponsiveTableProps {
  columns: ResponsiveColumn[];
  children: ReactNode;
  cardView?: boolean;
}

export const ResponsiveTable = ({ columns, children, cardView = false }: ResponsiveTableProps) => (
  <>
    {/* Desktop: standard table, hidden on small screens */}
    <div className={cn("hidden md:block overflow-x-auto", cardView && "md:block")}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i} className={col.className}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {children}
        </TableBody>
      </Table>
    </div>
    {/* Mobile: card view, hidden on md+ */}
    <div className={cn("block md:hidden space-y-3", !cardView && "md:hidden")}>
      {children}
    </div>
  </>
);

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveCard = ({ children, className }: ResponsiveCardProps) => (
  <Card className={cn("md:hidden", className)}>
    <CardContent className="p-4 space-y-2">
      {children}
    </CardContent>
  </Card>
);

interface ResponsiveRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export const ResponsiveRow = ({ label, children, className }: ResponsiveRowProps) => (
  <div className={cn("flex justify-between items-center text-sm", className)}>
    <span className="text-muted-foreground font-medium">{label}</span>
    <span className="text-right ml-2">{children}</span>
  </div>
);
