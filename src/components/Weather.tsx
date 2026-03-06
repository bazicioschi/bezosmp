import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer, Search, MapPin } from 'lucide-react';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  city: string;
  country: string;
}

const WEATHER_ICONS: Record<string, typeof Sun> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudRain,
  Snow: CloudSnow,
  Thunderstorm: CloudLightning,
};

export function Weather() {
  const [city, setCity] = useState('Bucharest');
  const [searchInput, setSearchInput] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError(null);
    try {
      // Using Open-Meteo (free, no API key needed)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found');
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
      );
      const weatherData = await weatherRes.json();

      const current = weatherData.current;
      const wmoDescription = getWMODescription(current.weather_code);

      setWeather({
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        description: wmoDescription.text,
        icon: wmoDescription.category,
        city: name,
        country: country,
      });

      const dailyForecast = weatherData.daily.time.slice(1, 5).map((date: string, i: number) => ({
        date,
        maxTemp: Math.round(weatherData.daily.temperature_2m_max[i + 1]),
        minTemp: Math.round(weatherData.daily.temperature_2m_min[i + 1]),
        icon: getWMODescription(weatherData.daily.weather_code[i + 1]).category,
        description: getWMODescription(weatherData.daily.weather_code[i + 1]).text,
      }));

      setForecast(dailyForecast);
      setCity(name);
    } catch (e: any) {
      setError(e.message || 'Could not load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchWeather(searchInput.trim());
      setSearchInput('');
    }
  };

  const getWeatherIcon = (category: string) => {
    const Icon = WEATHER_ICONS[category] || Cloud;
    return Icon;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="minecraft-card minecraft-border p-6 animate-pulse">
          <div className="h-8 bg-secondary rounded w-1/2 mb-4" />
          <div className="h-16 bg-secondary rounded w-1/3 mb-4" />
          <div className="h-4 bg-secondary rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="minecraft-card minecraft-border p-6 text-center">
          <Cloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground mc-text">Could not load weather</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <form onSubmit={handleSearch} className="mt-3 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Try another city..."
              className="flex-1 bg-secondary/30 border border-border rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mc-text"
            />
            <button type="submit" className="mc-btn-primary px-3 py-2 rounded text-xs mc-text">
              Search
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.icon);

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="minecraft-card minecraft-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search city..."
            className="w-full bg-secondary/30 border border-border rounded pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mc-text"
          />
        </div>
      </form>

      {/* Current Weather */}
      <div className="minecraft-card minecraft-border p-5">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <MapPin className="h-3.5 w-3.5" />
          <span className="mc-text text-sm">{weather.city}, {weather.country}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-end gap-1">
              <span className="mc-text text-5xl text-foreground leading-none">{weather.temperature}°</span>
              <span className="mc-text text-lg text-muted-foreground mb-1">C</span>
            </div>
            <p className="mc-text text-sm text-primary mt-1 capitalize">{weather.description}</p>
          </div>
          <WeatherIcon className="h-16 w-16 text-primary opacity-80" />
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="mc-slot p-2 text-center">
            <Thermometer className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
            <p className="mc-text text-[10px] text-muted-foreground">FEELS LIKE</p>
            <p className="mc-text text-sm text-foreground">{weather.feelsLike}°</p>
          </div>
          <div className="mc-slot p-2 text-center">
            <Droplets className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
            <p className="mc-text text-[10px] text-muted-foreground">HUMIDITY</p>
            <p className="mc-text text-sm text-foreground">{weather.humidity}%</p>
          </div>
          <div className="mc-slot p-2 text-center">
            <Wind className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
            <p className="mc-text text-[10px] text-muted-foreground">WIND</p>
            <p className="mc-text text-sm text-foreground">{weather.windSpeed} km/h</p>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="minecraft-card minecraft-border p-4">
        <h3 className="mc-text text-sm text-foreground mb-3">4-DAY FORECAST</h3>
        <div className="space-y-2">
          {forecast.map((day, i) => {
            const DayIcon = getWeatherIcon(day.icon);
            return (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="mc-text text-xs text-muted-foreground w-12">{getDayName(day.date)}</span>
                <DayIcon className="h-4 w-4 text-primary" />
                <span className="mc-text text-xs text-muted-foreground flex-1 ml-2 truncate">{day.description}</span>
                <div className="flex gap-2">
                  <span className="mc-text text-xs text-foreground">{day.maxTemp}°</span>
                  <span className="mc-text text-xs text-muted-foreground">{day.minTemp}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getWMODescription(code: number): { text: string; category: string } {
  const map: Record<number, { text: string; category: string }> = {
    0: { text: 'Clear sky', category: 'Clear' },
    1: { text: 'Mainly clear', category: 'Clear' },
    2: { text: 'Partly cloudy', category: 'Clouds' },
    3: { text: 'Overcast', category: 'Clouds' },
    45: { text: 'Foggy', category: 'Clouds' },
    48: { text: 'Depositing rime fog', category: 'Clouds' },
    51: { text: 'Light drizzle', category: 'Drizzle' },
    53: { text: 'Moderate drizzle', category: 'Drizzle' },
    55: { text: 'Dense drizzle', category: 'Drizzle' },
    61: { text: 'Slight rain', category: 'Rain' },
    63: { text: 'Moderate rain', category: 'Rain' },
    65: { text: 'Heavy rain', category: 'Rain' },
    71: { text: 'Slight snow', category: 'Snow' },
    73: { text: 'Moderate snow', category: 'Snow' },
    75: { text: 'Heavy snow', category: 'Snow' },
    77: { text: 'Snow grains', category: 'Snow' },
    80: { text: 'Slight rain showers', category: 'Rain' },
    81: { text: 'Moderate rain showers', category: 'Rain' },
    82: { text: 'Violent rain showers', category: 'Rain' },
    85: { text: 'Slight snow showers', category: 'Snow' },
    86: { text: 'Heavy snow showers', category: 'Snow' },
    95: { text: 'Thunderstorm', category: 'Thunderstorm' },
    96: { text: 'Thunderstorm with hail', category: 'Thunderstorm' },
    99: { text: 'Thunderstorm with heavy hail', category: 'Thunderstorm' },
  };
  return map[code] || { text: 'Unknown', category: 'Clouds' };
}
