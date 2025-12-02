#!/usr/bin/env python3
"""
Weather Data Collector Service
Fetches weather data from Open-Meteo API and sends to Redis queue
"""

import os
import time
import json
import requests
from datetime import datetime
import redis

# Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_QUEUE = os.getenv("REDIS_QUEUE", "weather_queue")
COLLECTION_INTERVAL = int(os.getenv("COLLECTION_INTERVAL", "3600"))  # 1 hour default

# São Paulo coordinates
LATITUDE = -23.5505
LONGITUDE = -46.6333
LOCATION = "São Paulo, BR"

# Open-Meteo API endpoint (free, no API key required)
WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"

def get_redis_client():
    """Create Redis client connection"""
    try:
        client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True,
            socket_connect_timeout=5
        )
        client.ping()
        print(f"✅ Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
        return client
    except Exception as e:
        print(f"❌ Failed to connect to Redis: {e}")
        return None

def fetch_weather_data():
    """Fetch current weather data from Open-Meteo API"""
    try:
        params = {
            "latitude": LATITUDE,
            "longitude": LONGITUDE,
            "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
            "timezone": "America/Sao_Paulo"
        }
        
        response = requests.get(WEATHER_API_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        current = data.get("current", {})
        
        # Map weather codes to conditions
        weather_code = current.get("weather_code", 0)
        condition = map_weather_code(weather_code)
        
        # Calculate precipitation probability (simplified)
        precipitation = current.get("precipitation", 0)
        precip_prob = min(100, precipitation * 10) if precipitation > 0 else 10
        
        weather_data = {
            "timestamp": datetime.now().isoformat(),
            "location": LOCATION,
            "temperature": round(current.get("temperature_2m", 20), 1),
            "humidity": round(current.get("relative_humidity_2m", 50), 1),
            "windSpeed": round(current.get("wind_speed_10m", 10), 1),
            "condition": condition,
            "precipitationProb": round(precip_prob, 1)
        }
        
        print(f"📊 Fetched weather data: {weather_data['temperature']}°C, {weather_data['condition']}")
        return weather_data
        
    except Exception as e:
        print(f"❌ Error fetching weather data: {e}")
        return None

def map_weather_code(code):
    """Map WMO weather codes to simple conditions"""
    if code == 0:
        return "Sunny"
    elif code in [1, 2]:
        return "Partly Cloudy"
    elif code == 3:
        return "Cloudy"
    elif code in range(51, 68):
        return "Rainy"
    elif code in range(80, 100):
        return "Stormy"
    else:
        return "Cloudy"

def send_to_queue(redis_client, data):
    """Send weather data to Redis queue"""
    try:
        message = json.dumps(data)
        redis_client.lpush(REDIS_QUEUE, message)
        print(f"✅ Sent data to queue '{REDIS_QUEUE}'")
        return True
    except Exception as e:
        print(f"❌ Failed to send to queue: {e}")
        return False

def main():
    """Main collector loop"""
    print("🌦️  Weather Collector Service Starting...")
    print(f"📍 Location: {LOCATION}")
    print(f"⏰ Collection interval: {COLLECTION_INTERVAL} seconds")
    
    redis_client = get_redis_client()
    if not redis_client:
        print("❌ Cannot start without Redis connection")
        return
    
    iteration = 0
    while True:
        iteration += 1
        print(f"\n🔄 Collection cycle #{iteration} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        weather_data = fetch_weather_data()
        if weather_data:
            send_to_queue(redis_client, weather_data)
        
        print(f"⏳ Waiting {COLLECTION_INTERVAL} seconds until next collection...")
        time.sleep(COLLECTION_INTERVAL)

if __name__ == "__main__":
    main()
