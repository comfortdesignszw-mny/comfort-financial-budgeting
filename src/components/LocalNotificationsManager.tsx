import React, { useEffect } from 'react';
import { AppData } from '../types';

interface LocalNotificationsManagerProps {
  data: AppData;
}

export function useLocalNotifications(data: AppData) {
  useEffect(() => {
    // Attempt to request notification permissions
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission !== 'granted') return;

    const checkNotifications = () => {
      const now = new Date();
      const notifiedEvents = JSON.parse(localStorage.getItem('notified_events') || '{}');
      const notifiedMonths = JSON.parse(localStorage.getItem('notified_months') || '{}');

      // 1. Check Events
      if (data.events && data.events.length > 0) {
        data.events.forEach(event => {
          if (notifiedEvents[event.id]) return;

          const eventDateTime = new Date(`${event.date}T${event.time}:00`);
          if (now >= eventDateTime) {
            // Trigger Notification
            try {
              new Notification('Reminder: ' + event.title, {
                body: `Your scheduled ${event.category} is due!`,
                icon: '/comfort_logo_brand.jpg' // fallback icon
              });
              notifiedEvents[event.id] = true;
            } catch (err) {
              console.error("Local notification err", err);
            }
          }
        });
        localStorage.setItem('notified_events', JSON.stringify(notifiedEvents));
      }

      // 2. Check End of Month
      const currentYearMonth = `${now.getFullYear()}-${now.getMonth()}`;
      
      // Calculate last day of the month
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const isEndOfMonth = now.getDate() === lastDayOfMonth;

      // Note: We also could check if it's the 1st of the month, or just the very last day
      if (isEndOfMonth && !notifiedMonths[currentYearMonth]) {
        try {
          new Notification('Month-End Rollover Reminder', {
            body: "It's month-end! Review your Report Card, generate your backups, and prepare for a fresh new budgeting month.",
          });
          notifiedMonths[currentYearMonth] = true;
          localStorage.setItem('notified_months', JSON.stringify(notifiedMonths));
        } catch (err) {
          console.error("Month-end notification err", err);
        }
      }
    };

    // Run immediately on mount
    checkNotifications();

    // Set interval to check every minute
    const interval = setInterval(checkNotifications, 60000);

    return () => clearInterval(interval);

  }, [data.events]);
}

export default function LocalNotificationsManager({ data }: LocalNotificationsManagerProps) {
  useLocalNotifications(data);
  return null; // pure logic component
}
