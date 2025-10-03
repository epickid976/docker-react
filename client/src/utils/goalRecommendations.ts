/**
 * Smart Goal Recommendations
 * Calculates personalized water intake goals based on user data
 */

export interface GoalRecommendation {
  recommended_ml: number;
  reason: string;
  factors: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface GoalAdjustment {
  current_goal_ml: number;
  recommended_goal_ml: number;
  difference_ml: number;
  percentage_change: number;
  suggestion: string;
  reasons: string[];
}

/**
 * Calculate recommended daily water intake based on body weight
 * General recommendation: 30-35ml per kg of body weight
 */
export const calculateRecommendedGoalMl = (
  weight_kg: number,
  height_cm: number,
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' = 'moderate'
): GoalRecommendation => {
  const factors: string[] = [];
  let base_ml = 0;

  // Base calculation: 30-35ml per kg
  const weight_factor = activity_level === 'sedentary' ? 30 : 
                       activity_level === 'light' ? 32 : 
                       activity_level === 'moderate' ? 35 : 
                       activity_level === 'active' ? 37 : 40;
  
  base_ml = weight_kg * weight_factor;
  factors.push(`${weight_factor}ml per kg of body weight`);

  // Adjust for height (taller people generally need more water)
  if (height_cm > 180) {
    base_ml *= 1.05;
    factors.push('Adjusted +5% for height over 180cm');
  } else if (height_cm < 160) {
    base_ml *= 0.95;
    factors.push('Adjusted -5% for height under 160cm');
  }

  // Round to nearest 100ml for cleaner numbers
  const recommended_ml = Math.round(base_ml / 100) * 100;

  const reason = `Based on your weight (${weight_kg.toFixed(1)}kg) and ${activity_level} activity level`;

  return {
    recommended_ml,
    reason,
    factors,
    confidence: 'high'
  };
};

/**
 * Analyze current goal and suggest adjustments
 */
export const analyzeGoalAdjustment = (
  current_goal_ml: number,
  weight_kg: number,
  height_cm: number,
  average_intake_ml: number,
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' = 'moderate'
): GoalAdjustment => {
  const recommendation = calculateRecommendedGoalMl(weight_kg, height_cm, activity_level);
  const recommended_goal_ml = recommendation.recommended_ml;
  const difference_ml = recommended_goal_ml - current_goal_ml;
  const percentage_change = (difference_ml / current_goal_ml) * 100;

  const reasons: string[] = [...recommendation.factors];

  // Analyze average intake vs current goal
  const intake_achievement = (average_intake_ml / current_goal_ml) * 100;
  if (intake_achievement < 70) {
    reasons.push('Your average intake is below 70% of your current goal');
  } else if (intake_achievement > 120) {
    reasons.push('You consistently exceed your current goal by 20%+');
  }

  // Generate suggestion
  let suggestion = '';
  if (Math.abs(percentage_change) < 5) {
    suggestion = 'Your current goal is optimal! Keep it up! 🎯';
  } else if (percentage_change > 20) {
    suggestion = `Consider gradually increasing your goal by ${Math.round(difference_ml)}ml to better match your needs.`;
  } else if (percentage_change > 0) {
    suggestion = `Your goal could be slightly higher. Try increasing by ${Math.round(difference_ml)}ml.`;
  } else if (percentage_change < -20) {
    suggestion = `Your goal might be too ambitious. Consider reducing by ${Math.abs(Math.round(difference_ml))}ml.`;
  } else {
    suggestion = `Your goal is slightly high. Consider reducing by ${Math.abs(Math.round(difference_ml))}ml.`;
  }

  return {
    current_goal_ml,
    recommended_goal_ml,
    difference_ml,
    percentage_change,
    suggestion,
    reasons
  };
};

/**
 * Get personalized suggestions based on height and weight
 */
export const getPersonalizedSuggestions = (
  weight_kg: number,
  height_cm: number,
  current_intake_ml: number,
  goal_ml: number
): string[] => {
  const suggestions: string[] = [];
  const bmi = weight_kg / Math.pow(height_cm / 100, 2);

  // BMI-based suggestions
  if (bmi < 18.5) {
    suggestions.push('💡 Staying hydrated helps maintain energy levels and supports healthy metabolism');
  } else if (bmi > 25) {
    suggestions.push('💡 Adequate hydration can help with weight management and metabolism');
  }

  // Intake vs goal
  const achievement = (current_intake_ml / goal_ml) * 100;
  if (achievement < 50) {
    suggestions.push('🎯 Try setting hourly reminders to reach your goal');
  } else if (achievement < 80) {
    suggestions.push('🎯 You\'re making progress! Just a bit more to reach your goal');
  } else if (achievement >= 100) {
    suggestions.push('🎉 Excellent! You\'re meeting your hydration goals');
  }

  // Height-based suggestions
  if (height_cm > 180) {
    suggestions.push('📏 Taller individuals typically need slightly more water for optimal hydration');
  }

  return suggestions;
};

/**
 * Calculate optimal goal adjustment recommendations
 */
export const getGoalAdjustmentRecommendations = (
  current_goal_ml: number,
  average_intake_ml: number,
  achievement_rate: number,
  days_tracked: number
): {
  should_adjust: boolean;
  new_goal_ml: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
} => {
  let should_adjust = false;
  let new_goal_ml = current_goal_ml;
  let reason = 'Your current goal is well-suited to your habits';
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  // Need at least 7 days of data for reliable recommendations
  if (days_tracked < 7) {
    return {
      should_adjust: false,
      new_goal_ml: current_goal_ml,
      reason: 'Track your intake for at least 7 days for personalized recommendations',
      confidence: 'low'
    };
  }

  confidence = days_tracked >= 14 ? 'high' : 'medium';

  // If consistently achieving less than 70%
  if (achievement_rate < 0.70) {
    should_adjust = true;
    new_goal_ml = Math.round(average_intake_ml * 1.15 / 100) * 100; // 15% above average
    reason = 'Your goal seems too high. This adjusted goal is more achievable based on your patterns.';
  }
  // If consistently exceeding by 20%+
  else if (achievement_rate > 1.20) {
    should_adjust = true;
    new_goal_ml = Math.round(average_intake_ml * 1.05 / 100) * 100; // 5% above average
    reason = 'You\'re exceeding your goal consistently! Time to level up with a higher target.';
  }
  // If consistently within 10% of goal (95-110%)
  else if (achievement_rate >= 0.95 && achievement_rate <= 1.10) {
    should_adjust = false;
    reason = 'Perfect! Your goal matches your habits well. Keep up the great work! 🎯';
    confidence = 'high';
  }

  return {
    should_adjust,
    new_goal_ml,
    reason,
    confidence
  };
};

