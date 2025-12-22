/**
 * Transform AI forecast data to UI-compatible format
 */

/**
 * Transform donation trends from AI response
 */
export const transformDonationTrends = (forecastData) => {
  if (!forecastData?.forecasted_demands) return [];
  
  const demands = forecastData.forecasted_demands;
  const weeklyData = [];
  
  // Group by weeks (assuming daily predictions)
  for (let i = 0; i < demands.length; i += 7) {
    const weekDemands = demands.slice(i, i + 7);
    const avgDemand = weekDemands.reduce((sum, d) => sum + (d.predicted_demand || 0), 0) / weekDemands.length;
    
    weeklyData.push({
      period: `Week ${Math.floor(i / 7) + 1}`,
      predicted_donations: Math.round(avgDemand),
      confidence: 85, // Use model confidence if available from AI
      insight: generateInsight(avgDemand, i)
    });
  }
  
  return weeklyData;
};

/**
 * Transform seasonal trends to category forecasts
 */
export const transformCategoryData = (seasonalData, forecastData) => {
  if (!seasonalData?.seasonal_patterns) return [];
  
  const patterns = seasonalData.seasonal_patterns;
  const totalDemand = Object.values(patterns).reduce((sum, val) => sum + val, 0);
  
  return Object.entries(patterns).map(([season, demand]) => ({
    category: season.replace(/_/g, ' '),
    predicted_demand: Math.round(demand),
    demand_percentage: totalDemand > 0 ? Math.round((demand / totalDemand) * 100) : 0,
    trend: calculateSeasonTrend(seasonalData, season)
  }));
};

/**
 * Transform supply gap data to location insights
 */
export const transformLocationData = (supplyGapData, forecastData) => {
  if (!supplyGapData) return [];
  
  const avgDemand = supplyGapData.forecasted_demands?.length > 0
    ? Math.round(
        supplyGapData.forecasted_demands.reduce((sum, d) => sum + d.predicted_demand, 0) / 
        supplyGapData.forecasted_demands.length
      )
    : 0;
  
  const hasGap = avgDemand > (supplyGapData.current_supply || 0);
  const gapAmount = Math.abs(avgDemand - (supplyGapData.current_supply || 0));
  
  return [{
    city: supplyGapData.city || 'Bangalore',
    state: 'Karnataka', // You can enhance this with a city-to-state mapping
    predicted_donations: supplyGapData.current_supply || 0,
    predicted_demand: avgDemand,
    top_category: (supplyGapData.clothing_type || 'winter_wear').replace(/_/g, ' '),
    activity_score: calculateActivityScore(supplyGapData),
    alert: hasGap 
      ? `Additional ${gapAmount} items needed to meet demand`
      : `Surplus of ${gapAmount} items available`
  }];
};

/**
 * Calculate summary statistics
 */
export const calculateSummary = (data) => {
  const forecast = data.forecast || {};
  const trends = data.seasonal_trends || {};
  const gap = data.supply_gap || {};
  
  // Calculate total predicted donations
  const predictedDonations = forecast.forecasted_demands?.length > 0
    ? Math.round(
        forecast.forecasted_demands.reduce((sum, d) => sum + d.predicted_demand, 0)
      )
    : 0;
  
  // Calculate expected demand
  const expectedDemand = gap.forecasted_demands?.length > 0
    ? Math.round(
        gap.forecasted_demands.reduce((sum, d) => sum + d.predicted_demand, 0)
      )
    : 0;
  
  // Find top category
  const topCategory = trends.peak_season 
    ? trends.peak_season.replace(/_/g, ' ')
    : 'winter wear';
  
  // Calculate trends (placeholder - enhance with historical data)
  const donationTrend = 12; // Positive growth
  const demandTrend = 8;
  
  return {
    predicted_donations: predictedDonations,
    donation_trend: donationTrend,
    expected_demand: expectedDemand,
    demand_trend: demandTrend,
    top_category: topCategory,
    confidence_score: 87 // Use model confidence if available
  };
};

/**
 * Generate insight text for a week
 */
const generateInsight = (avgDemand, weekIndex) => {
  if (avgDemand > 100) {
    return 'High donation activity expected this week';
  } else if (avgDemand > 50) {
    return 'Moderate donation activity expected';
  } else if (avgDemand > 20) {
    return 'Low donation activity expected';
  }
  return 'Minimal activity expected - consider outreach campaigns';
};

/**
 * Calculate season trend
 */
const calculateSeasonTrend = (seasonalData, season) => {
  // This is a placeholder - you can enhance with historical comparison
  const patterns = seasonalData.seasonal_patterns || {};
  const currentDemand = patterns[season] || 0;
  const avgDemand = Object.values(patterns).reduce((sum, val) => sum + val, 0) / Object.keys(patterns).length;
  
  if (currentDemand > avgDemand * 1.2) return 15;
  if (currentDemand > avgDemand) return 5;
  if (currentDemand < avgDemand * 0.8) return -15;
  return -5;
};

/**
 * Calculate activity score for a location
 */
const calculateActivityScore = (supplyGapData) => {
  const currentSupply = supplyGapData.current_supply || 0;
  const avgDemand = supplyGapData.forecasted_demands?.length > 0
    ? supplyGapData.forecasted_demands.reduce((sum, d) => sum + d.predicted_demand, 0) / 
      supplyGapData.forecasted_demands.length
    : 0;
  
  if (avgDemand === 0) return 0;
  
  const supplyRatio = currentSupply / avgDemand;
  return Math.min(Math.round(supplyRatio * 100), 100);
};

/**
 * Get city-to-state mapping (you can expand this)
 */
export const getCityState = (city) => {
  const cityStateMap = {
    'Bangalore': 'Karnataka',
    'Bengaluru': 'Karnataka',
    'Mumbai': 'Maharashtra',
    'Delhi': 'Delhi',
    'Chennai': 'Tamil Nadu',
    'Kolkata': 'West Bengal',
    'Hyderabad': 'Telangana',
    'Pune': 'Maharashtra',
    'Ahmedabad': 'Gujarat',
    'Mysuru': 'Karnataka',
    'Mysore': 'Karnataka'
  };
  
  return cityStateMap[city] || 'India';
};
