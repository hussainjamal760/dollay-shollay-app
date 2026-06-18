export const calculateMacroGoals = (user: any) => {
  if (!user || !user.weight) {
    return { calories: 2000, protein: 150, carbs: 200, fat: 65 };
  }

  const weightKg = parseFloat(user.weight);
  const weightLbs = weightKg * 2.20462;
  
  // Activity multiplier
  let multiplier = 14.5; // Default lightly active
  const act = (user.activityLevel || '').toLowerCase();
  if (act.includes('sedentary') || act.includes('beginner')) multiplier = 13;
  if (act.includes('intermediate') || act.includes('moderate')) multiplier = 16;
  if (act.includes('advanced') || act.includes('very active')) multiplier = 17.5;

  let maintenanceCals = weightLbs * multiplier;
  
  // Adjust for goals
  let targetCals = maintenanceCals;
  const goalsStr = JSON.stringify(user.goals || []).toLowerCase();
  
  if (goalsStr.includes('lose') || goalsStr.includes('fat')) {
    targetCals -= 500;
  } else if (goalsStr.includes('build') || goalsStr.includes('muscle') || goalsStr.includes('bulk')) {
    targetCals += 300;
  }

  // Calculate Macros
  // Protein: ~2g per kg (or ~1g per lb for muscle building)
  let targetProtein = weightKg * 2.2;
  
  // Fat: ~0.8g per kg
  let targetFat = weightKg * 0.8;

  // Carbs: Remaining calories
  let proteinCals = targetProtein * 4;
  let fatCals = targetFat * 9;
  
  let remainingCals = targetCals - proteinCals - fatCals;
  if (remainingCals < 0) remainingCals = 0;
  
  let targetCarbs = remainingCals / 4;

  return {
    calories: Math.round(targetCals),
    protein: Math.round(targetProtein),
    carbs: Math.round(targetCarbs),
    fat: Math.round(targetFat)
  };
};
