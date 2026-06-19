import { Pedometer } from 'expo-sensors';
import { useUserStore } from '../store/userStore';

export const initHealthIntegration = async () => {
  const { status } = await Pedometer.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('[Health] Pedometer permission denied!');
    return false;
  }
  return true;
};

export const fetchDailyStepsAndCalories = async () => {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) return { steps: 0, calories: 0 };

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const stepResult = await Pedometer.getStepCountAsync(start, end);
    const steps = stepResult.steps;
    // Basit bir kalori tahmini (1000 adım ~ 40-50 kalori)
    const calories = steps * 0.045;

    return { steps, calories };
  } catch (error) {
    console.log('Pedometer error:', error);
    return { steps: 0, calories: 0 };
  }
};

export const syncHealthDataToStore = async () => {
  const data = await fetchDailyStepsAndCalories();
  if (data.calories > 0 || data.steps > 0) {
    const { addWorkout, dailyLog, updateStepHistory } = useUserStore.getState();
    const existingSync = dailyLog?.workouts?.find(w => w.name === 'Health Sync');
    if (!existingSync) {
      addWorkout({
        id: Date.now().toString(),
        name: 'Health Sync',
        duration: 0,
        calories: Math.round(data.calories),
        notes: `Steps: ${Math.round(data.steps)}`,
      });
    }

    const history = await fetchStepHistory(7);
    if (history && history.length > 0) {
      updateStepHistory(history);
    }
  }
};

export const fetchStepHistory = async (days = 7) => {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) return [];

    let history = [];
    for (let i = 0; i < days; i++) {
      const end = new Date();
      end.setDate(end.getDate() - i);
      end.setHours(23, 59, 59, 999);

      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const stepResult = await Pedometer.getStepCountAsync(start, end);
      history.push({
        date: start.toISOString().split('T')[0],
        steps: stepResult.steps,
      });
    }

    return history.reverse(); // Eskiden yeniye sıralı
  } catch (error) {
    console.log('Pedometer history error:', error);
    return [];
  }
};
