import { activeWorkoutAtom, tickTimerAction } from "@/store/activeWorkout";
import { useAtom } from "jotai";
import { useEffect } from "react";

interface WorkoutTimerProviderProps {
  children: React.ReactNode;
}

export const WorkoutTimerProvider = ({
  children,
}: WorkoutTimerProviderProps) => {
  const [activeWorkout] = useAtom(activeWorkoutAtom);
  const [, tickTimer] = useAtom(tickTimerAction);

  // Global timer that runs whenever there's an active workout
  useEffect(() => {
    if (!activeWorkout.isActive) {
      return;
    }

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout.isActive, tickTimer]);

  return <>{children}</>;
};
