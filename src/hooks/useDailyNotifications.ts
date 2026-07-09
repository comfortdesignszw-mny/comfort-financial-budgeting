import { useEffect } from 'react';
import { AppData } from '../types';

export function useDailyNotifications(data: AppData) {
  useEffect(() => {
    // Request permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkTimeAndNotify = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // We only want to notify once per scheduled time. 
      // Checking if we are at exactly minute 0.
      if (minutes !== 0) return;

      const todayStr = now.toISOString().split('T')[0];

      // Check if user logged any transaction today
      const hasTransactionsToday = 
        data.businessTransactions.some(tx => tx.date.startsWith(todayStr)) ||
        data.transactions.some(tx => tx.date.startsWith(todayStr));

      const hasExpensesToday = 
        data.businessTransactions.some(tx => tx.date.startsWith(todayStr) && tx.type === 'expense') ||
        data.transactions.some(tx => tx.date.startsWith(todayStr) && tx.type === 'expense');

      // We use a simple localStorage flag to prevent multiple notifications in the same hour
      const lastNotifiedHour = localStorage.getItem('last_notified_hour');
      const currentHourStr = `${todayStr}-${hours}`;

      if (lastNotifiedHour === currentHourStr) return;

      if (hours === 16 || hours === 18) {
        new Notification("Daily Log Reminder", {
          body: "Heading towards the end of the day, just a reminder for you to log in your income and expense logs of the day",
          icon: "/icon.png"
        });
        localStorage.setItem('last_notified_hour', currentHourStr);
      } else if (hours === 20 && !hasExpensesToday) {
        new Notification("Daily Log Reminder", {
          body: "Haven't logged your daily income and expenses? Log in and call it a day!",
          icon: "/icon.png"
        });
        localStorage.setItem('last_notified_hour', currentHourStr);
      }
    };

    // Check every minute
    const interval = setInterval(checkTimeAndNotify, 60000);
    
    // Check immediately on mount just in case
    checkTimeAndNotify();

    return () => clearInterval(interval);
  }, [data]);
}
