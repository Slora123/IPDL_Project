import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Clock } from "lucide-react";

export default function LoanAlert() {
  const loans = [
    { id: 1, lender: "SBI", amount: 25000, dueDate: "2025-10-05" },
    { id: 2, lender: "HDFC", amount: 12000, dueDate: "2025-10-12" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Loan Alerts</h1>
        <Button variant="outline">
          <Bell className="h-4 w-4 mr-2" /> Enable Reminders
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loans.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{l.lender}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Due: {l.dueDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{l.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                    <Clock className="h-3 w-3" /> Reminder off
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


