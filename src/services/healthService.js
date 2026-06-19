import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';
import GoogleFit, { Scopes } from 'react-native-google-fit';
import { useUserStore } from '../store/userStore';

const permissions = {
  permissions: {
    read: [AppleHealthKit.Constants.Permissions.Steps, AppleHealthKit.Constants.Permissions.ActiveEnergyBurned],
    write: [],
  },
};

export const initHealthIntegration = async () => {
  if (Platform.OS === 'ios') {
    AppleHealthKit.initHealthKit(permissions, (error) => {
      if (error) {
        console.log('[Health] Cannot grant permissions!');
      }
    });
  } else if (Platform.OS === 'android') {
    const options = {
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_BODY_READ,
      ],
    };
    GoogleFit.authorize(options)
      .then(authResult => {
        if (authResult.success) {
          console.log('[Health] Google Fit authorized');
        } else {
          console.log('[Health] Google Fit denied');
        }
      })
      .catch((e) => {
        console.log('[Health] Google Fit Error:', e);
      });
  }
};

export const fetchDailyStepsAndCalories = async () => {
  return new Promise((resolve) => {
    const result = { steps: 0, calories: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Platform.OS === 'ios') {
      const options = { date: today.toISOString() };
      AppleHealthKit.getStepCount(options, (err, stepsData) => {
        if (!err && stepsData) result.steps = stepsData.value;
        AppleHealthKit.getActiveEnergyBurned(options, (err, calData) => {
          if (!err && calData && calData.length > 0) {
            result.calories = calData.reduce((acc, curr) => acc + curr.value, 0);
          }
          resolve(result);
        });
      });
    } else {
      const opt = {
        startDate: today.toISOString(),
        endDate: new Date().toISOString(),
      };
      GoogleFit.getDailyStepCountSamples(opt)
        .then((res) => {
          const source = res.find(r => r.source === 'com.google.android.gms:estimated_steps');
          if (source && source.steps.length > 0) {
            result.steps = source.steps[0].value;
          }
          GoogleFit.getDailyCalorieSamples(opt)
            .then((calRes) => {
              if (calRes && calRes.length > 0 && calRes[0].calorie > 0) {
                // Adjust base calories if needed
                result.calories = calRes[0].calorie; 
              }
              resolve(result);
            }).catch(() => resolve(result));
        }).catch(() => resolve(result));
    }
  });
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

    // Also update step history
    const history = await fetchStepHistory(7);
    if (history && history.length > 0) {
      updateStepHistory(history);
    }
  }
};

export const fetchStepHistory = async (days = 7) => {
  return new Promise((resolve) => {
    let history = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1); // +1 to include today as the last day
    startDate.setHours(0, 0, 0, 0);

    if (Platform.OS === 'ios') {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      AppleHealthKit.getDailyStepCountSamples(options, (err, results) => {
        if (!err && results) {
          // results: [{value, startDate, endDate}]
          history = results.map(r => ({
            date: r.startDate,
            steps: r.value
          })).sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        resolve(history);
      });
    } else {
      const opt = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucketUnit: 'DAY',
        bucketInterval: 1,
      };
      GoogleFit.getDailyStepCountSamples(opt)
        .then((res) => {
          const source = res.find(r => r.source === 'com.google.android.gms:estimated_steps');
          if (source && source.steps) {
            history = source.steps.map(s => ({
              date: s.date || s.startDate,
              steps: s.value
            })).sort((a, b) => new Date(a.date) - new Date(b.date));
          }
          resolve(history);
        }).catch(() => resolve(history));
    }
  });
};
