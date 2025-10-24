import { database } from "@/lib/firebase";
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";

export interface AccessLog {
  id: string;
  entry_time: string;
  exit_time: string | null;
  duration_minutes: number | null;
  security_alert: boolean;
  alert_reason: string | null;
  toilet_id: string;
  payment_id: string;
  toilet_name?: string;
}

export const subscribeToRecentAccessLogs = (callback: (logs: AccessLog[]) => void) => {
  const logsRef = ref(database, 'access_logs');
  const recentLogsQuery = query(
    logsRef,
    orderByChild('entry_time'),
    limitToLast(20)
  );
  
  return onValue(recentLogsQuery, (snapshot) => {
    const data = snapshot.val();
    const logsArray: AccessLog[] = [];
    if (data) {
      Object.keys(data).forEach((key) => {
        logsArray.push({ id: key, ...data[key] });
      });
    }
    callback(logsArray.reverse());
  });
};
