import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc } from '../utils/firebase';
import { RULES } from '../utils/constants';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  const [shifts, setShifts] = useState({});
  const [requests, setRequests] = useState({});
  const [memos, setMemos] = useState({});
  const [staff, setStaff] = useState([]); // Array of { id, name }
  const [loading, setLoading] = useState(true);

  // Load staff configuration and monthly data
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "global", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setStaff(docSnap.data().staff || []);
      } else {
        // Initialize with default staff if empty
        const defaultStaff = Array.from({ length: 5 }, (_, i) => ({
          id: `user${i + 1}`,
          name: `スタッフ ${i + 1}`
        }));
        setStaff(defaultStaff);
        setDoc(doc(db, "global", "config"), { staff: defaultStaff });
      }
    });

    const unsubData = onSnapshot(doc(db, "global", "current_month"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setShifts(data?.shifts || {});
        setRequests(data?.requests || {});
        setMemos(data?.memos || {});
      } else {
        setShifts({});
        setRequests({});
        setMemos({});
      }
      setLoading(false);
    }, (error) => {
      console.error("Shift data error:", error);
      setLoading(false); // Stop loading even on error to prevent infinite spinner
    });

    return () => {
      unsubConfig();
      unsubData();
    };
  }, []);

  const updateGlobalShifts = async (newShifts, newRequests, newMemos) => {
    await setDoc(doc(db, "global", "current_month"), {
      shifts: newShifts || shifts,
      requests: newRequests || requests,
      memos: newMemos || memos,
    }, { merge: true });
  };

  const updateStaffConfig = async (newStaff) => {
    await setDoc(doc(db, "global", "config"), { staff: newStaff });
  };

  return (
    <ShiftContext.Provider value={{ shifts, requests, memos, staff, loading, updateGlobalShifts, updateStaffConfig }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShifts = () => useContext(ShiftContext);
