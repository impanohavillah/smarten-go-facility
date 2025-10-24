import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { database } from "@/lib/firebase";
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";
import { CreditCard, Clock, CheckCircle2 } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  payment_method: "momo" | "rfid_card";
  payment_reference: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  toilet_id: string;
  toilet_name?: string;
}

const PaymentMessages = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const paymentsRef = ref(database, 'payments');
      const paymentsQuery = query(paymentsRef, orderByChild('created_at'), limitToLast(10));
      
      onValue(paymentsQuery, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const paymentsArray = await Promise.all(
            Object.keys(data).map(async (key) => {
              const payment = { id: key, ...data[key] };
              
              // Fetch toilet name
              if (payment.toilet_id) {
                const toiletRef = ref(database, `toilets/${payment.toilet_id}`);
                const toiletSnapshot = await new Promise((resolve) => {
                  onValue(toiletRef, (snap) => resolve(snap), { onlyOnce: true });
                });
                const toiletData = (toiletSnapshot as any).val();
                payment.toilet_name = toiletData?.name || "Unknown Toilet";
              }
              
              return payment;
            })
          );
          setPayments(paymentsArray.reverse());
        } else {
          setPayments([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-RW", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-white">Completed</Badge>;
      case "pending":
        return <Badge className="bg-warning text-white">Pending</Badge>;
      case "failed":
        return <Badge className="bg-destructive text-white">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    return method === "momo" ? "Mobile Money" : "RFID Card";
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payment records yet
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {payment.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Clock className="w-5 h-5 text-warning" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {payment.toilet_name || "Unknown Toilet"}
                      </p>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        <span className="font-medium">{payment.amount} Frw</span> via{" "}
                        {getPaymentMethodLabel(payment.payment_method)}
                      </p>
                      <p>Ref: {payment.payment_reference}</p>
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMessages;
