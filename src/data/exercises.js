export const EXERCISE_DATABASE = [
  // --- GÖĞÜS (Chest) ---
  { id: 'c1', name: 'Barbell Flat Bench Press', muscleGroup: 'Göğüs', subGroup: 'Orta Göğüs', category: 'Gym', defaultSets: 4, defaultReps: 10, burnedCalsPerSet: 15 },
  { id: 'c2', name: 'Incline Dumbbell Press', muscleGroup: 'Göğüs', subGroup: 'Üst Göğüs', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 12 },
  { id: 'c3', name: 'Decline Bench Press', muscleGroup: 'Göğüs', subGroup: 'Alt Göğüs', category: 'Gym', defaultSets: 3, defaultReps: 12, burnedCalsPerSet: 12 },
  { id: 'c4', name: 'Cable Crossover', muscleGroup: 'Göğüs', subGroup: 'Alt Göğüs / İç Göğüs', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 10 },
  { id: 'c5', name: 'Pec Deck Machine (Butterfly)', muscleGroup: 'Göğüs', subGroup: 'İç Göğüs', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 8 },
  { id: 'c6', name: 'Dumbbell Pullover', muscleGroup: 'Göğüs', subGroup: 'Göğüs Kafesi / Kanat', category: 'Gym', defaultSets: 3, defaultReps: 12, burnedCalsPerSet: 10 },

  // --- SIRT (Back) ---
  { id: 'b1', name: 'Barbell Deadlift', muscleGroup: 'Sırt', subGroup: 'Alt Sırt / Bel', category: 'Gym', defaultSets: 4, defaultReps: 8, burnedCalsPerSet: 25 },
  { id: 'b2', name: 'Wide-Grip Lat Pulldown', muscleGroup: 'Sırt', subGroup: 'Dış Kanat', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 12 },
  { id: 'b3', name: 'Close-Grip Lat Pulldown', muscleGroup: 'Sırt', subGroup: 'İç Sırt', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 12 },
  { id: 'b4', name: 'Barbell Bent-Over Row', muscleGroup: 'Sırt', subGroup: 'Orta Sırt', category: 'Gym', defaultSets: 4, defaultReps: 10, burnedCalsPerSet: 15 },
  { id: 'b5', name: 'Seated Cable Row', muscleGroup: 'Sırt', subGroup: 'Orta Sırt', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 12 },
  { id: 'b6', name: 'Single-Arm Dumbbell Row', muscleGroup: 'Sırt', subGroup: 'Dış Kanat / Orta Sırt', category: 'Gym', defaultSets: 3, defaultReps: 12, burnedCalsPerSet: 10 },
  { id: 'b7', name: 'T-Bar Row', muscleGroup: 'Sırt', subGroup: 'İç Sırt', category: 'Gym', defaultSets: 4, defaultReps: 10, burnedCalsPerSet: 14 },
  { id: 'b8', name: 'Face Pull', muscleGroup: 'Sırt', subGroup: 'Arka Omuz / Üst Sırt', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 8 },

  // --- OMUZ (Shoulder) ---
  { id: 's1', name: 'Overhead Barbell Press', muscleGroup: 'Omuz', subGroup: 'Ön Omuz', category: 'Gym', defaultSets: 4, defaultReps: 10, burnedCalsPerSet: 14 },
  { id: 's2', name: 'Seated Dumbbell Press', muscleGroup: 'Omuz', subGroup: 'Ön Omuz', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 12 },
  { id: 's3', name: 'Dumbbell Lateral Raise', muscleGroup: 'Omuz', subGroup: 'Yan Omuz', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 8 },
  { id: 's4', name: 'Dumbbell Front Raise', muscleGroup: 'Omuz', subGroup: 'Ön Omuz', category: 'Gym', defaultSets: 3, defaultReps: 12, burnedCalsPerSet: 8 },
  { id: 's5', name: 'Arnold Press', muscleGroup: 'Omuz', subGroup: 'Ön / Yan Omuz', category: 'Gym', defaultSets: 3, defaultReps: 10, burnedCalsPerSet: 12 },
  { id: 's6', name: 'Reverse Pec Deck', muscleGroup: 'Omuz', subGroup: 'Arka Omuz', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 8 },
  { id: 's7', name: 'Upright Row', muscleGroup: 'Omuz', subGroup: 'Yan Omuz / Trapez', category: 'Gym', defaultSets: 3, defaultReps: 12, burnedCalsPerSet: 10 },
  { id: 's8', name: 'Dumbbell Shrug', muscleGroup: 'Omuz', subGroup: 'Trapez', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 10 },

  // --- KOLLAR (Arms - Biceps & Triceps) ---
  { id: 'arm1', name: 'Barbell Biceps Curl', muscleGroup: 'Kollar', subGroup: 'Ön Kol (Biceps)', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 10 },
  { id: 'arm2', name: 'Dumbbell Hammer Curl', muscleGroup: 'Kollar', subGroup: 'Brachialis / Ön Kol', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 9 },
  { id: 'arm3', name: 'EZ-Bar Preacher Curl', muscleGroup: 'Kollar', subGroup: 'Kısa Baş (İç Biceps)', category: 'Gym', defaultSets: 3, defaultReps: 12, burnedCalsPerSet: 8 },
  { id: 'arm4', name: 'Incline Dumbbell Curl', muscleGroup: 'Kollar', subGroup: 'Uzun Baş (Dış Biceps)', category: 'Gym', defaultSets: 3, defaultReps: 12, burnedCalsPerSet: 8 },
  { id: 'arm5', name: 'Cable Triceps Pushdown', muscleGroup: 'Kollar', subGroup: 'Arka Kol (Triceps)', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 8 },
  { id: 'arm6', name: 'Overhead Triceps Extension', muscleGroup: 'Kollar', subGroup: 'Uzun Baş (Triceps)', category: 'Gym', defaultSets: 3, defaultReps: 12, burnedCalsPerSet: 9 },
  { id: 'arm7', name: 'Skullcrusher (EZ-Bar)', muscleGroup: 'Kollar', subGroup: 'Triceps', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 10 },
  { id: 'arm8', name: 'Triceps Kickback', muscleGroup: 'Kollar', subGroup: 'Arka Kol (Triceps)', category: 'Gym', defaultSets: 3, defaultReps: 12, burnedCalsPerSet: 7 },

  // --- BACAK (Legs) ---
  { id: 'l1', name: 'Barbell Back Squat', muscleGroup: 'Bacak', subGroup: 'Ön Bacak / Kalça', category: 'Gym', defaultSets: 4, defaultReps: 10, burnedCalsPerSet: 20 },
  { id: 'l2', name: 'Leg Press Machine', muscleGroup: 'Bacak', subGroup: 'Ön Bacak (Quad)', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 18 },
  { id: 'l3', name: 'Romanian Deadlift (RDL)', muscleGroup: 'Bacak', subGroup: 'Arka Bacak (Hamstring)', category: 'Gym', defaultSets: 4, defaultReps: 10, burnedCalsPerSet: 16 },
  { id: 'l4', name: 'Walking Lunges', muscleGroup: 'Bacak', subGroup: 'Tüm Bacak', category: 'Gym', defaultSets: 3, defaultReps: 20, burnedCalsPerSet: 15 },
  { id: 'l5', name: 'Leg Extension Machine', muscleGroup: 'Bacak', subGroup: 'Ön Bacak (Quad İzole)', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 12 },
  { id: 'l6', name: 'Lying Leg Curl', muscleGroup: 'Bacak', subGroup: 'Arka Bacak (Hamstring)', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 12 },
  { id: 'l7', name: 'Standing Calf Raise', muscleGroup: 'Bacak', subGroup: 'Kalf (Alt Bacak)', category: 'Gym', defaultSets: 4, defaultReps: 20, burnedCalsPerSet: 8 },
  { id: 'l8', name: 'Seated Calf Raise', muscleGroup: 'Bacak', subGroup: 'Soleus (Kalf Altı)', category: 'Gym', defaultSets: 4, defaultReps: 20, burnedCalsPerSet: 8 },

  // --- KARIN (Abs) ---
  { id: 'a1', name: 'Machine Crunch', muscleGroup: 'Karın', subGroup: 'Üst Karın', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 8 },
  { id: 'a2', name: 'Cable Woodchopper', muscleGroup: 'Karın', subGroup: 'Yan Karın (Oblique)', category: 'Gym', defaultSets: 3, defaultReps: 15, burnedCalsPerSet: 10 },
  { id: 'a3', name: 'Hanging Leg Raise', muscleGroup: 'Karın', subGroup: 'Alt Karın', category: 'Gym', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 10 },
  { id: 'a4', name: 'Decline Crunch', muscleGroup: 'Karın', subGroup: 'Tüm Karın', category: 'Gym', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 8 },
  { id: 'a5', name: 'Ab Wheel Rollout', muscleGroup: 'Karın', subGroup: 'Core / Tüm Karın', category: 'Gym', defaultSets: 3, defaultReps: 10, burnedCalsPerSet: 12 },

  // --- CALISTHENICS ---
  { id: 'cal1', name: 'Strict Pull-up (Barfiks)', muscleGroup: 'Sırt', subGroup: 'Dış Kanat', category: 'Calisthenics', defaultSets: 4, defaultReps: 10, burnedCalsPerSet: 15 },
  { id: 'cal2', name: 'Chin-up', muscleGroup: 'Kollar', subGroup: 'Biceps / Sırt', category: 'Calisthenics', defaultSets: 4, defaultReps: 10, burnedCalsPerSet: 14 },
  { id: 'cal3', name: 'Standard Push-up (Şınav)', muscleGroup: 'Göğüs', subGroup: 'Orta Göğüs', category: 'Calisthenics', defaultSets: 4, defaultReps: 20, burnedCalsPerSet: 12 },
  { id: 'cal4', name: 'Diamond Push-up', muscleGroup: 'Kollar', subGroup: 'Triceps / İç Göğüs', category: 'Calisthenics', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 12 },
  { id: 'cal5', name: 'Parallel Bar Dips', muscleGroup: 'Göğüs', subGroup: 'Alt Göğüs / Triceps', category: 'Calisthenics', defaultSets: 4, defaultReps: 12, burnedCalsPerSet: 14 },
  { id: 'cal6', name: 'Muscle-up', muscleGroup: 'Full Body', subGroup: 'Sırt ve Arka Kol', category: 'Calisthenics', defaultSets: 3, defaultReps: 5, burnedCalsPerSet: 18 },
  { id: 'cal7', name: 'Pistol Squat (Tek Bacak)', muscleGroup: 'Bacak', subGroup: 'Ön Bacak / Denge', category: 'Calisthenics', defaultSets: 3, defaultReps: 8, burnedCalsPerSet: 15 },
  { id: 'cal8', name: 'L-Sit Hold (Saniye)', muscleGroup: 'Karın', subGroup: 'Core / Alt Karın', category: 'Calisthenics', defaultSets: 3, defaultReps: 20, burnedCalsPerSet: 10 },
  { id: 'cal9', name: 'Front Lever Hold (Saniye)', muscleGroup: 'Sırt', subGroup: 'Core / Sırt', category: 'Calisthenics', defaultSets: 3, defaultReps: 10, burnedCalsPerSet: 15 },

  // --- EVDE ANTRENMAN (Home Workout) ---
  { id: 'hw1', name: 'Jumping Jacks', muscleGroup: 'Full Body', subGroup: 'Kardiyo', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 40, burnedCalsPerSet: 15 },
  { id: 'hw2', name: 'Burpees', muscleGroup: 'Full Body', subGroup: 'Tüm Vücut / Kardiyo', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 25 },
  { id: 'hw3', name: 'Bodyweight Squat', muscleGroup: 'Bacak', subGroup: 'Ön Bacak / Kalça', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 25, burnedCalsPerSet: 12 },
  { id: 'hw4', name: 'Jump Squat', muscleGroup: 'Bacak', subGroup: 'Patlayıcı Güç', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 18 },
  { id: 'hw5', name: 'Chair Dips (Arka Kol)', muscleGroup: 'Kollar', subGroup: 'Triceps', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 15, burnedCalsPerSet: 10 },
  { id: 'hw6', name: 'High Knees (Saniye)', muscleGroup: 'Full Body', subGroup: 'Kardiyo', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 45, burnedCalsPerSet: 18 },
  { id: 'hw7', name: 'Knee Push-ups', muscleGroup: 'Göğüs', subGroup: 'Orta Göğüs', category: 'Evde Antrenman', defaultSets: 3, defaultReps: 15, burnedCalsPerSet: 10 },
  { id: 'hw8', name: 'Plank Hold (Saniye)', muscleGroup: 'Karın', subGroup: 'Core', category: 'Evde Antrenman', defaultSets: 3, defaultReps: 60, burnedCalsPerSet: 10 },
  { id: 'hw9', name: 'Forward Lunges', muscleGroup: 'Bacak', subGroup: 'Ön Bacak', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 20, burnedCalsPerSet: 14 },
  { id: 'hw10', name: 'Mountain Climber', muscleGroup: 'Karın', subGroup: 'Alt Karın / Kardiyo', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 30, burnedCalsPerSet: 16 },
  { id: 'hw11', name: 'Bicycle Crunches', muscleGroup: 'Karın', subGroup: 'Yan Karın (Oblique)', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 30, burnedCalsPerSet: 12 },
  { id: 'hw12', name: 'Glute Bridge', muscleGroup: 'Bacak', subGroup: 'Kalça', category: 'Evde Antrenman', defaultSets: 4, defaultReps: 20, burnedCalsPerSet: 12 }
];
