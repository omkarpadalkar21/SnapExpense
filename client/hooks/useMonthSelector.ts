"use client";

import { useState, useCallback } from "react";

export function useMonthSelector(initialDate?: Date) {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());

  const month = selectedDate.toLocaleString("en-IN", { month: "long" });
  const year = selectedDate.getFullYear();
  const monthYear = `${month} ${year}`;

  const goToPreviousMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    month,
    year,
    monthYear,
    goToPreviousMonth,
    goToNextMonth,
  };
}
