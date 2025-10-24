import { database } from "@/lib/firebase";
import { ref, onValue, update, set, push, remove } from "firebase/database";

export interface Toilet {
  id: string;
  name: string;
  location: string | null;
  status: "available" | "occupied" | "maintenance";
  is_occupied: boolean;
  occupied_since: string | null;
  is_paid: boolean;
  last_payment_time: string | null;
  manual_open_enabled: boolean;
}

export const subscribeToToilets = (callback: (toilets: Toilet[]) => void) => {
  const toiletsRef = ref(database, 'toilets');
  return onValue(toiletsRef, (snapshot) => {
    const data = snapshot.val();
    const toiletsArray: Toilet[] = [];
    if (data) {
      Object.keys(data).forEach((key) => {
        toiletsArray.push({ id: key, ...data[key] });
      });
    }
    callback(toiletsArray);
  });
};

export const updateToilet = async (toiletId: string, updates: Partial<Toilet>) => {
  const toiletRef = ref(database, `toilets/${toiletId}`);
  await update(toiletRef, updates);
};

export const createToilet = async (toilet: Omit<Toilet, 'id'>) => {
  const toiletsRef = ref(database, 'toilets');
  const newToiletRef = push(toiletsRef);
  await set(newToiletRef, toilet);
};

export const deleteToilet = async (toiletId: string) => {
  const toiletRef = ref(database, `toilets/${toiletId}`);
  await remove(toiletRef);
};
