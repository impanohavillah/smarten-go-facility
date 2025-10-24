import { database } from "@/lib/firebase";
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";

export interface Payment {
  id: string;
  amount: number;
  payment_method: "momo" | "rfid_card";
  payment_reference: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  toilet_id: string;
  toilet_name?: string;
}

export const subscribeToRecentPayments = (callback: (payments: Payment[]) => void) => {
  const paymentsRef = ref(database, 'payments');
  const recentPaymentsQuery = query(
    paymentsRef,
    orderByChild('created_at'),
    limitToLast(10)
  );
  
  return onValue(recentPaymentsQuery, (snapshot) => {
    const data = snapshot.val();
    const paymentsArray: Payment[] = [];
    if (data) {
      Object.keys(data).forEach((key) => {
        paymentsArray.push({ id: key, ...data[key] });
      });
    }
    callback(paymentsArray.reverse());
  });
};
