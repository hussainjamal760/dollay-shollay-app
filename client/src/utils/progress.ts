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

  const maxWeightMap: { [exName: string]: number } = {};
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let lastMonth = currentMonth - 1;
  let lastMonthYear = currentYear;
  if (lastMonth < 0) {
    lastMonth = 11;
    lastMonthYear--;
  }

  const thisMonthDates = new Set<string>();
  const lastMonthDates = new Set<string>();

  allLogs.forEach((log: any) => {
    const d = new Date(log.date);
    const m = d.getMonth();
    const y = d.getFullYear();
    const dateStr = `${y}-${m}-${d.getDate()}`;
    uniqueDates.add(dateStr);

    if (m === currentMonth && y === currentYear) thisMonthDates.add(dateStr);
    if (m === lastMonth && y === lastMonthYear) lastMonthDates.add(dateStr);
    
    let exList = [];
    try {
      exList = JSON.parse(log.exercises);
    } catch(e) {}
    
    exList.forEach((ex: any) => {
       if (ex.setsData) {
         ex.setsData.forEach((s: any) => {
           const weight = parseFloat(s.weightLifted) || 0;
           totalVolume += (weight * (parseInt(s.reps) || 0));
           
           if (!maxWeightMap[ex.name] || weight > maxWeightMap[ex.name]) {
             maxWeightMap[ex.name] = weight;
           }
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

  const hasActivePlan = Object.keys(workoutDaysMap).length > 0;

  if (totalWorkouts === 0) {
    currentStreak = 0;
  } else {
    const dates = Array.from(uniqueDates).map(d => new Date(d).setHours(0,0,0,0));
    const firstWorkoutTime = Math.min(...dates);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date();
      checkDate.setDate(d.getDate() - i);
      checkDate.setHours(0,0,0,0);
      
      const key = formatKey(checkDate);
      const dayName = DAYS[checkDate.getDay()];
      
      if (checkDate.getTime() < firstWorkoutTime) {
        break; // Don't count days before the first ever workout
      }
      
      if (workedOutDatesMap[key]) {
        currentStreak++;
      } else {
        if (hasActivePlan) {
          if (!workoutDaysMap[dayName]) {
            currentStreak++; // Keep streak alive on rest days
          } else {
            if (i === 0) {
              // Missed today (workout day), but the day isn't over yet
            } else {
              break; // Missed a scheduled workout day in the past
            }
          }
        } else {
          // No active plan: every day counts
          if (i === 0) {
            // Missed today, day isn't over
          } else {
            break; // Missed yesterday, streak broken
          }
        }
      }
    }
  }

  const prs = Object.keys(maxWeightMap)
    .map(name => ({ name, weight: maxWeightMap[name] }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);

  const monthlyStats = {
    thisMonth: thisMonthDates.size,
    lastMonth: lastMonthDates.size
  };

  return {
    totalVolume,
    totalWorkouts,
    currentStreak,
    prs,
    monthlyStats
  };
};
