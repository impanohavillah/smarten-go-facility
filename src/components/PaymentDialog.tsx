import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toiletId: string;
  toiletName: string;
}

const PaymentDialog = ({ open, onOpenChange, toiletId, toiletName }: PaymentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "200",
    payment_method: "momo" as "momo" | "rfid_card",
    payment_reference: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseInt(formData.amount);
      if (amount < 200) {
        throw new Error("Minimum payment amount is 200 Frw");
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            toilet_id: toiletId,
            amount,
            payment_method: formData.payment_method,
            payment_reference: formData.payment_reference,
            status: "completed",
          },
        ])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update toilet status
      const { error: updateError } = await supabase
        .from("toilets")
        .update({
          is_paid: true,
          last_payment_time: new Date().toISOString(),
        })
        .eq("id", toiletId);

      if (updateError) throw updateError;

      // Create access log
      await supabase.from("access_logs").insert([
        {
          toilet_id: toiletId,
          payment_id: payment.id,
        },
      ]);

      toast({
        title: "Payment Verified",
        description: `Payment of ${amount} Frw confirmed for ${toiletName}.`,
      });

      onOpenChange(false);
      setFormData({
        amount: "200",
        payment_method: "momo",
        payment_reference: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Payment - {toiletName}</DialogTitle>
          <DialogDescription>
            Minimum payment amount is 200 Frw
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Frw)</Label>
            <Input
              id="amount"
              type="number"
              min="200"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="200"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: "momo" | "rfid_card") =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="momo">Mobile Money (MoMo)</SelectItem>
                <SelectItem value="rfid_card">RFID Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Payment Reference</Label>
            <Input
              id="reference"
              value={formData.payment_reference}
              onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
              placeholder="e.g., Transaction ID or Card Number"
              required
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Verifying..." : "Verify Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
