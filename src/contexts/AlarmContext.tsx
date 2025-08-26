"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlarmObject } from '@/components/Alarms/Alarms';

interface AlarmContextType {
  sharedAlarm: AlarmObject | null;
  setSharedAlarm: (alarm: AlarmObject | null) => void;
  clearSharedAlarm: () => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export function AlarmProvider({ children }: { children: ReactNode }) {
  const [sharedAlarm, setSharedAlarm] = useState<AlarmObject | null>(null);

  const clearSharedAlarm = () => {
    setSharedAlarm(null);
  };

  return (
    <AlarmContext.Provider value={{ sharedAlarm, setSharedAlarm, clearSharedAlarm }}>
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarmContext() {
  const context = useContext(AlarmContext);
  if (context === undefined) {
    throw new Error('useAlarmContext must be used within an AlarmProvider');
  }
  return context;
} 