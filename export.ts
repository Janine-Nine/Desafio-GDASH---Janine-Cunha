import * as XLSX from "xlsx";
import type { WeatherLog } from "@shared/schema";

export function generateCSV(weatherLogs: WeatherLog[]): string {
  const headers = ["ID", "Timestamp", "Location", "Temperature (°C)", "Humidity (%)", "Wind Speed (km/h)", "Condition", "Precipitation (%)"];
  
  const rows = weatherLogs.map(log => [
    log.id,
    new Date(log.timestamp).toISOString(),
    log.location,
    log.temperature,
    log.humidity,
    log.windSpeed,
    log.condition,
    log.precipitationProb
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  return csvContent;
}

export function generateXLSX(weatherLogs: WeatherLog[]): Buffer {
  const data = weatherLogs.map(log => ({
    "ID": log.id,
    "Timestamp": new Date(log.timestamp).toISOString(),
    "Location": log.location,
    "Temperature (°C)": log.temperature,
    "Humidity (%)": log.humidity,
    "Wind Speed (km/h)": log.windSpeed,
    "Condition": log.condition,
    "Precipitation (%)": log.precipitationProb
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Weather Data");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}
