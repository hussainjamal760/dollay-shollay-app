import { getWorkoutLogsLocally, getWorkoutsLocally } from '../database/db';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const calculateProgressStats = async () => {
  const allLogs = await getWorkoutLogsLocally();
  const allWorkouts = await getWorkoutsLocally();
  
  const activePlan = allWorkouts.find((w: any) => w.is_active === 1);
  let workoutDaysMap: { [day: string]: boolean } = {}; 
  
  if (activePlan && activePlan.days) {
    try {
      const parsedDays = typeof activePlan.days === 'string' ? JSON.parse(activePlan.days) : activePlan.days;
      parsedDays.forEach((d: any) => {
        if (d.exercises && d.exercises.length > 0) {
          workoutDaysMap[d.dayOfWeek] = true;
        }
      });
    } catch (e) {}
  }

  const uniqueDates = new Set<string>();
  let totalVolume = 0;

  allLogs.forEach((log: any) => {
    const d = new Date(log.date);
    const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    uniqueDates.add(dateStr);
    
    let exList = [];
    try {
      exList = JSON.parse(log.exercises);
    } catch(e) {}
    
    exList.forEach((ex: any) => {
       if (ex.setsData) {
         ex.setsData.forEach((s: any) => {
           totalVolume += ((parseFloat(s.weightLifted) || 0) * (parseInt(s.reps) || 0));
         });
       }
    });
  });

  const totalWorkouts = uniqueDates.size;

  let currentStreak = 0;
  let d = new Date();
  
  const formatKey = (dateObj: Date) => `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;
  
  const workedOutDatesMap: { [key: string]: boolean } = {};
  uniqueDates.forEach(k => workedOutDatesMap[k] = true);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date();
    checkDate.setDate(d.getDate() - i);
    const key = formatKey(checkDate);
    const dayName = DAYS[checkDate.getDay()];
    
    if (workedOutDatesMap[key]) {
      currentStreak++;
    } else {
      if (i === 0) {
         if (!workoutDaysMap[dayName]) {
           currentStreak++;
         }
      } else {
         if (!workoutDaysMap[dayName]) {
            currentStreak++;
         } else {
            break;
         }
      }
    }
  }

  return {
    totalVolume,
    totalWorkouts,
    currentStreak
  };
};
