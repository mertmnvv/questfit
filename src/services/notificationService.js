import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../locales/i18n';

// Bildirimlerin uygulamadayken de gözükmesi için ayar
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Bildirim izni verilmedi!');
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#40C057',
    });
  }

  return true;
};

// Günlük Su İçme Hatırlatıcıları
export const scheduleWaterReminders = async () => {
  const times = [
    { hour: 10, minute: 0 },
    { hour: 14, minute: 0 },
    { hour: 18, minute: 0 },
  ];

  for (let i = 0; i < times.length; i++) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.waterTitle'),
        body: i18n.t('notifications.waterBody'),
        data: { type: 'water' },
      },
      trigger: {
        hour: times[i].hour,
        minute: times[i].minute,
        repeats: true,
      },
    });
  }
};

// Antrenman Serisi Hatırlatıcısı
export const scheduleWorkoutReminder = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifications.workoutTitle'),
      body: i18n.t('notifications.workoutBody'),
      data: { type: 'workout' },
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
};

// Diyet Planına Göre Öğün Hatırlatıcıları
export const scheduleDietReminders = async (dietPlan = 'standard') => {
  const plan = typeof dietPlan === 'object' ? dietPlan.timing : dietPlan;
  const safePlan = typeof plan === 'string' ? plan.toLowerCase() : 'standard';

  if (safePlan === 'if' || safePlan === 'if168' || safePlan === 'if_16_8') {
    // Aralıklı Oruç Bildirimleri (12:00 İlk öğün, 20:00 Son öğün/Oruç başlar)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.ifStartTitle'),
        body: i18n.t('notifications.ifStartBody'),
        data: { type: 'diet' },
      },
      trigger: { hour: 12, minute: 0, repeats: true },
    });
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.ifEndTitle'),
        body: i18n.t('notifications.ifEndBody'),
        data: { type: 'diet' },
      },
      trigger: { hour: 20, minute: 0, repeats: true },
    });
  } else if (safePlan === 'omad') {
    // Tek Öğün (18:00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.omadTitle'),
        body: i18n.t('notifications.omadBody'),
        data: { type: 'diet' },
      },
      trigger: { hour: 18, minute: 0, repeats: true },
    });
  } else {
    // Standart (08:30, 13:00, 19:30)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.classicBreakfastTitle'),
        body: i18n.t('notifications.classicBreakfastBody'),
        data: { type: 'diet' },
      },
      trigger: { hour: 8, minute: 30, repeats: true },
    });
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.classicLunchTitle'),
        body: i18n.t('notifications.classicLunchBody'),
        data: { type: 'diet' },
      },
      trigger: { hour: 13, minute: 0, repeats: true },
    });
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.classicDinnerTitle'),
        body: i18n.t('notifications.classicDinnerBody'),
        data: { type: 'diet' },
      },
      trigger: { hour: 19, minute: 30, repeats: true },
    });
  }
};

export const initNotifications = async (dietPlan) => {
  const hasPermission = await requestNotificationPermissions();
  if (hasPermission) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await scheduleWaterReminders();
    await scheduleWorkoutReminder();
    await scheduleDietReminders(dietPlan);
  }
};
