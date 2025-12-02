import type { WeatherLog, Insight } from "@shared/schema";

interface InsightData {
  type: "alert" | "info" | "prediction";
  title: string;
  description: string;
  severity?: "low" | "medium" | "high";
}

export class InsightsGenerator {
  generateInsights(weatherLogs: WeatherLog[]): InsightData[] {
    if (weatherLogs.length === 0) return [];

    const insights: InsightData[] = [];
    const recent = weatherLogs.slice(0, 24); // Last 24 hours

    // Temperature Analysis
    const avgTemp = recent.reduce((sum, log) => sum + log.temperature, 0) / recent.length;
    const maxTemp = Math.max(...recent.map(log => log.temperature));
    const minTemp = Math.min(...recent.map(log => log.temperature));

    if (maxTemp > 35) {
      insights.push({
        type: "alert",
        title: "Extreme Heat Warning",
        description: `Temperature reached ${maxTemp.toFixed(1)}°C. Consider cooling systems for solar panels to maintain efficiency.`,
        severity: "high"
      });
    } else if (maxTemp > 30) {
      insights.push({
        type: "info",
        title: "High Temperature Detected",
        description: `Peak temperature of ${maxTemp.toFixed(1)}°C. Panel efficiency may decrease by 10-15%.`,
        severity: "medium"
      });
    }

    // Precipitation Analysis
    const avgRain = recent.reduce((sum, log) => sum + log.precipitationProb, 0) / recent.length;
    if (avgRain > 70) {
      insights.push({
        type: "alert",
        title: "High Rain Probability",
        description: `${avgRain.toFixed(0)}% average rain probability. Expected 30-50% reduction in solar generation.`,
        severity: "high"
      });
    }

    // Wind Analysis
    const avgWind = recent.reduce((sum, log) => sum + log.windSpeed, 0) / recent.length;
    if (avgWind > 40) {
      insights.push({
        type: "alert",
        title: "Strong Wind Alert",
        description: `Wind speeds averaging ${avgWind.toFixed(1)} km/h. Secure loose equipment and check panel mounting.`,
        severity: "high"
      });
    }

    // Humidity Analysis
    const avgHumidity = recent.reduce((sum, log) => sum + log.humidity, 0) / recent.length;
    if (avgHumidity > 80) {
      insights.push({
        type: "info",
        title: "High Humidity Levels",
        description: `Average humidity at ${avgHumidity.toFixed(0)}%. Monitor for condensation on electrical components.`,
        severity: "medium"
      });
    }

    // Positive Prediction
    const clearConditions = recent.filter(log => 
      log.condition === "Sunny" || log.condition === "Partly Cloudy"
    ).length;

    if (clearConditions > recent.length * 0.7) {
      insights.push({
        type: "prediction",
        title: "Optimal Generation Conditions",
        description: `${Math.round(clearConditions / recent.length * 100)}% clear skies detected. Solar production estimated to exceed baseline by 15-20%.`,
        severity: "low"
      });
    }

    // Weekly Summary
    if (weatherLogs.length >= 24) {
      const tempChange = avgTemp - (weatherLogs.slice(24, 48).reduce((sum, log) => sum + log.temperature, 0) / 24);
      insights.push({
        type: "info",
        title: "24-Hour Summary",
        description: `Average temperature: ${avgTemp.toFixed(1)}°C (${tempChange > 0 ? '+' : ''}${tempChange.toFixed(1)}°C from previous day). Humidity: ${avgHumidity.toFixed(0)}%.`,
        severity: "low"
      });
    }

    return insights.slice(0, 5); // Return top 5 insights
  }

  analyzeEnergyEfficiency(weatherLogs: WeatherLog[]): {
    score: number;
    factors: string[];
  } {
    if (weatherLogs.length === 0) return { score: 50, factors: [] };

    const recent = weatherLogs.slice(0, 24);
    const factors: string[] = [];
    let score = 100;

    // Temperature impact
    const avgTemp = recent.reduce((sum, log) => sum + log.temperature, 0) / recent.length;
    if (avgTemp > 30) {
      score -= 15;
      factors.push("High temperature reduces panel efficiency");
    } else if (avgTemp < 15) {
      score -= 5;
      factors.push("Low temperature slightly reduces efficiency");
    } else {
      factors.push("Optimal temperature range for solar generation");
    }

    // Cloud cover impact
    const cloudyDays = recent.filter(log => 
      log.condition === "Cloudy" || log.condition === "Rainy"
    ).length;
    
    const cloudImpact = (cloudyDays / recent.length) * 40;
    score -= cloudImpact;
    if (cloudImpact > 20) {
      factors.push("Significant cloud cover reducing output");
    }

    // Precipitation impact
    const avgRain = recent.reduce((sum, log) => sum + log.precipitationProb, 0) / recent.length;
    if (avgRain > 50) {
      score -= 20;
      factors.push("High precipitation probability");
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      factors
    };
  }
}

export const insightsGenerator = new InsightsGenerator();
