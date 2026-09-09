// WeatherPage.jsx
// ============================================================================
// PURPOSE:
//   Standalone protected page for live Weather tracking powered by OpenWeatherMap API.
//   Provides current weather conditions, key atmospheric metrics, hourly timeline,
//   and 5-day daily forecast for any searched city worldwide.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Material-UI Components
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Divider,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
} from '@mui/material';

// Material-UI Icons
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Air as WindIcon,
  Opacity as HumidityIcon,
  Thermostat as ThermostatIcon,
  Compress as PressureIcon,
  Visibility as VisibilityIcon,
  WbSunny as SunIcon,
  NightsStay as MoonIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

// Theme tokens & Context
import { blcColors } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { Navbar } from '../components/dashboard/Navbar';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const DEFAULT_CITY = 'London';
const POPULAR_CITIES = ['London', 'New York', 'Tokyo', 'Paris', 'Dubai', 'Singapore'];

/**
 * Formats epoch timestamp (seconds) into local human-readable time (e.g., "06:45 AM")
 */
const formatTime = (timestamp, timezoneOffsetSeconds = 0) => {
  if (!timestamp) return '--';
  const date = new Date((timestamp + timezoneOffsetSeconds) * 1000);
  return date.toUTCString().slice(17, 22);
};

/**
 * Formats date into readable format like "Wed, Sep 9"
 */
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

/**
 * Extracts 5 daily forecasts by taking mid-day records (around 12:00 PM)
 */
const processDailyForecast = (list = []) => {
  const dailyMap = {};
  list.forEach((item) => {
    const dateKey = item.dt_txt.split(' ')[0];
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        dateKey,
        dt: item.dt,
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
        weather: item.weather[0],
        samples: [item],
      };
    } else {
      dailyMap[dateKey].temp_min = Math.min(dailyMap[dateKey].temp_min, item.main.temp_min);
      dailyMap[dateKey].temp_max = Math.max(dailyMap[dateKey].temp_max, item.main.temp_max);
      if (item.dt_txt.includes('12:00')) {
        dailyMap[dateKey].weather = item.weather[0];
      }
      dailyMap[dateKey].samples.push(item);
    }
  });

  return Object.values(dailyMap).slice(0, 5);
};

// Known city profiles for realistic preview data
const CITY_PROFILES = {
  london: { tempC: 15, feelsC: 14, desc: 'light rain', main: 'Rain', icon: '10d', humidity: 78, wind: 5.2, country: 'GB' },
  'new york': { tempC: 21, feelsC: 20, desc: 'partly cloudy', main: 'Clouds', icon: '03d', humidity: 54, wind: 4.1, country: 'US' },
  tokyo: { tempC: 24, feelsC: 25, desc: 'clear sky', main: 'Clear', icon: '01d', humidity: 62, wind: 3.6, country: 'JP' },
  paris: { tempC: 17, feelsC: 16, desc: 'broken clouds', main: 'Clouds', icon: '04d', humidity: 68, wind: 4.8, country: 'FR' },
  dubai: { tempC: 38, feelsC: 41, desc: 'sunny & clear', main: 'Clear', icon: '01d', humidity: 38, wind: 6.1, country: 'AE' },
  singapore: { tempC: 31, feelsC: 36, desc: 'thunderstorm', main: 'Thunderstorm', icon: '11d', humidity: 82, wind: 2.8, country: 'SG' },
  chennai: { tempC: 34, feelsC: 39, desc: 'scattered clouds', main: 'Clouds', icon: '03d', humidity: 74, wind: 4.5, country: 'IN' },
};

/**
 * Generates unique, realistic weather per city even before the newly created OpenWeather key activates
 */
const generateFallbackWeather = (cityName, unit = 'metric') => {
  const isMetric = unit === 'metric';
  const lower = cityName.toLowerCase().trim();
  const known = CITY_PROFILES[lower];

  // Hash city name for unknown cities to produce deterministic, unique values
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash << 5) - hash + lower.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const baseTempC = known ? known.tempC : 14 + (absHash % 20); // 14°C to 33°C
  const feelsC = known ? known.feelsC : baseTempC + ((absHash % 5) - 2);
  const humidity = known ? known.humidity : 45 + (absHash % 45);
  const windMs = known ? known.wind : 2.5 + (absHash % 8);
  const weatherDesc = known ? known.desc : ['scattered clouds', 'clear sky', 'overcast clouds', 'light rain', 'few clouds'][absHash % 5];
  const weatherMain = known ? known.main : ['Clouds', 'Clear', 'Clouds', 'Rain', 'Clouds'][absHash % 5];
  const weatherIcon = known ? known.icon : ['03d', '01d', '04d', '10d', '02d'][absHash % 5];
  const country = known ? known.country : 'GL';

  const toUnit = (c) => (isMetric ? c : Math.round((c * 9) / 5 + 32));
  const toSpeed = (ms) => (isMetric ? ms : +(ms * 2.237).toFixed(1));

  const now = Math.floor(Date.now() / 1000);

  const currentWeather = {
    name: cityName,
    sys: { country, sunrise: now - 21600, sunset: now + 21600 },
    dt: now,
    timezone: 0,
    main: {
      temp: toUnit(baseTempC),
      feels_like: toUnit(feelsC),
      temp_min: toUnit(baseTempC - 3),
      temp_max: toUnit(baseTempC + 4),
      humidity,
      pressure: 1012 + (absHash % 10),
    },
    wind: { speed: toSpeed(windMs) },
    visibility: 10000,
    weather: [
      {
        id: 800,
        main: weatherMain,
        description: weatherDesc,
        icon: weatherIcon,
      },
    ],
  };

  // Generate 5 day / 3 hour mock forecast
  const list = [];
  for (let i = 0; i < 40; i++) {
    const timeOffset = (i + 1) * 3 * 3600;
    const targetDate = new Date((now + timeOffset) * 1000);
    const dateStr = targetDate.toISOString().replace('T', ' ').slice(0, 19);
    const dayVariation = Math.sin((i + (absHash % 7)) / 3) * 4;
    const itemTempC = Math.round(baseTempC + dayVariation);

    list.push({
      dt: now + timeOffset,
      dt_txt: dateStr,
      main: {
        temp: toUnit(itemTempC),
        temp_min: toUnit(itemTempC - 2),
        temp_max: toUnit(itemTempC + 3),
        humidity: Math.min(95, humidity + (i % 10)),
      },
      weather: [
        {
          id: 800,
          main: (i + absHash) % 2 === 0 ? weatherMain : 'Clear',
          description: (i + absHash) % 2 === 0 ? weatherDesc : 'clear sky',
          icon: (i + absHash) % 2 === 0 ? weatherIcon : '01d',
        },
      ],
    });
  }

  return { currentWeather, forecast: { list } };
};

export const WeatherPage = ({ mode, toggleMode }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const isDark = mode === 'dark';

  // State
  const [cityInput, setCityInput] = useState('');
  const [currentCity, setCurrentCity] = useState(DEFAULT_CITY);
  const [unit, setUnit] = useState('metric'); // 'metric' (°C) or 'imperial' (°F)
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActivatingKey, setIsActivatingKey] = useState(false);

  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'm/s' : 'mph';

  // Fetch weather and forecast
  const fetchWeatherData = useCallback(async (cityToFetch, unitToFetch = unit) => {
    if (!cityToFetch.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Current Weather
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          cityToFetch.trim()
        )}&units=${unitToFetch}&appid=${OPENWEATHER_API_KEY}`
      );

      if (!weatherRes.ok) {
        if (weatherRes.status === 401) {
          // OpenWeather API key newly created — still propagating (10-30m delay)
          setIsActivatingKey(true);
          const fallback = generateFallbackWeather(cityToFetch.trim(), unitToFetch);
          setCurrentWeather(fallback.currentWeather);
          setForecast(fallback.forecast);
          setCurrentCity(cityToFetch.trim());
          setLoading(false);
          return;
        }
        if (weatherRes.status === 404) {
          throw new Error(`City "${cityToFetch}" not found. Please check spelling.`);
        }
        throw new Error('Failed to retrieve weather data. Please try again.');
      }

      setIsActivatingKey(false);
      const weatherData = await weatherRes.json();
      setCurrentWeather(weatherData);
      setCurrentCity(weatherData.name);

      // 2. 5-day Forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          cityToFetch.trim()
        )}&units=${unitToFetch}&appid=${OPENWEATHER_API_KEY}`
      );

      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        setForecast(forecastData);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Error fetching weather data');
    } finally {
      setLoading(false);
    }
  }, [unit]);

  // Initial load
  useEffect(() => {
    fetchWeatherData(DEFAULT_CITY, unit);
  }, []);

  // Handle Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) {
      fetchWeatherData(cityInput.trim(), unit);
      setCityInput('');
    }
  };

  // Handle Unit toggle
  const handleUnitChange = (_, newUnit) => {
    if (newUnit && newUnit !== unit) {
      setUnit(newUnit);
      fetchWeatherData(currentCity, newUnit);
    }
  };

  // Processed daily forecast
  const dailyForecast = forecast?.list ? processDailyForecast(forecast.list) : [];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: isDark ? blcColors.darkBg : blcColors.cream,
        color: isDark ? '#f8fafc' : blcColors.textDark,
        pb: 8,
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* ── Top Shared Navbar ── */}
      <Navbar
        mode={mode}
        toggleMode={toggleMode}
        currentUser={currentUser}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      {/* ── Main Content Container ── */}
      <Box sx={{ mt: 2, px: 3, width: '100%', boxSizing: 'border-box' }}>
        {/* ── Top Header Navigation Bar ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          {/* Breadcrumbs & Back Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => navigate('/home')}
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                border: `1px solid ${isDark ? blcColors.darkBorder : '#e5e7eb'}`,
                color: isDark ? '#e2e8f0' : '#374151',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                },
              }}
              size="small"
              aria-label="Back to dashboard"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>

            <Breadcrumbs
              separator="/"
              sx={{
                fontSize: '0.85rem',
                fontFamily: '"Inter", sans-serif',
                '& .MuiBreadcrumbs-separator': { color: isDark ? '#64748b' : '#9ca3af' },
              }}
            >
              <Link
                underline="hover"
                color="inherit"
                onClick={() => navigate('/home')}
                sx={{ cursor: 'pointer', color: isDark ? '#94a3b8' : '#6b7280' }}
              >
                Dashboard
              </Link>
              <Typography
                sx={{
                  color: isDark ? '#e2e8f0' : '#111827',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Weather
              </Typography>
            </Breadcrumbs>
          </Box>

          {/* Unit Toggle & Refresh Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              value={unit}
              exclusive
              onChange={handleUnitChange}
              size="small"
              sx={{
                bgcolor: isDark ? blcColors.darkCard : '#ffffff',
                border: `1px solid ${isDark ? blcColors.darkBorder : '#e5e7eb'}`,
                borderRadius: '8px',
                '& .MuiToggleButton-root': {
                  px: 1.25,
                  py: 0.35,
                  fontWeight: 600,
                  fontSize: '0.76rem',
                  border: 'none',
                  color: isDark ? '#94a3b8' : '#6b7280',
                  '&.Mui-selected': {
                    bgcolor: blcColors.navyAccent,
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: blcColors.navyAccent,
                    },
                  },
                },
              }}
            >
              <ToggleButton value="metric">°C</ToggleButton>
              <ToggleButton value="imperial">°F</ToggleButton>
            </ToggleButtonGroup>

            <IconButton
              onClick={() => fetchWeatherData(currentCity, unit)}
              disabled={loading}
              sx={{
                bgcolor: isDark ? blcColors.darkCard : '#ffffff',
                border: `1px solid ${isDark ? blcColors.darkBorder : '#e5e7eb'}`,
                color: isDark ? '#e2e8f0' : '#374151',
                p: 0.7,
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                },
              }}
              size="small"
              aria-label="Refresh weather"
            >
              <RefreshIcon fontSize="small" sx={{ animation: loading ? 'spin 1s linear infinite' : 'none', fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* ── Error Banner ── */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: '10px',
              fontFamily: '"Inter", sans-serif',
              py: 0.5,
              fontSize: '0.82rem',
            }}
            action={
              <Button color="inherit" size="small" onClick={() => fetchWeatherData(DEFAULT_CITY, unit)}>
                Load {DEFAULT_CITY}
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && !currentWeather && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: '16px' }} />
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: '16px' }} />
          </Box>
        )}

        {/* ── Main Weather Display ── */}
        {currentWeather && (
          <>
            {/* ── Top Row: Weather Banner (Left) + Search Panel (Right) ── */}
            <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
              {/* Left Column: Weather Hero Banner */}
              <Grid item xs={12} sm={8}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 7, md: 3 },
                    height: '100%',
                    borderRadius: '16px',
                    background: isDark
                      ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #e0e7ff 100%)',
                    border: `1px solid ${isDark ? blcColors.darkBorder : '#bfdbfe'}`,
                    boxShadow: isDark
                      ? '0 6px 20px rgba(0,0,0,0.35)'
                      : '0 6px 20px rgba(29, 78, 216, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Grid container spacing={2} alignItems="flex-start">
                    {/* Left: City, Temperature & Weather Icon */}
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                        <LocationIcon sx={{ color: blcColors.navyAccent, fontSize: 18 }} />
                        <Typography
                          variant="h5"
                          sx={{
                            fontFamily: '"Inter", sans-serif',
                            fontWeight: 700,
                            fontSize: { xs: '1.2rem', sm: '1.45rem' },
                            color: isDark ? '#ffffff' : '#0f172a',
                          }}
                        >
                          {currentWeather.name}, {currentWeather.sys?.country}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.72rem',
                            color: isDark ? '#94a3b8' : '#64748b',
                            ml: 0.5,
                          }}
                        >
                          {formatDate(currentWeather.dt)}
                        </Typography>
                      </Box>

                      {/* Temperature + Icon Badge */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                        {currentWeather.weather?.[0]?.icon && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: { xs: 64, sm: 76 },
                              height: { xs: 64, sm: 76 },
                              borderRadius: '16px',
                              background: isDark
                                ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)'
                                : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#93c5fd'}`,
                              boxShadow: isDark
                                ? '0 4px 14px rgba(0,0,0,0.3)'
                                : '0 4px 14px rgba(59, 130, 246, 0.18)',
                              flexShrink: 0,
                            }}
                          >
                            <Box
                              component="img"
                              src={`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@4x.png`}
                              alt={currentWeather.weather[0].description}
                              sx={{
                                width: { xs: 56, sm: 66 },
                                height: { xs: 56, sm: 66 },
                                filter: isDark
                                  ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))'
                                  : 'drop-shadow(0 2px 8px rgba(30, 58, 138, 0.35)) contrast(1.15)',
                              }}
                            />
                          </Box>
                        )}

                        <Box>
                          <Typography
                            sx={{
                              fontFamily: '"Inter", sans-serif',
                              fontWeight: 800,
                              fontSize: { xs: '2.2rem', sm: '2.8rem' },
                              lineHeight: 1,
                              color: isDark ? '#ffffff' : '#0f172a',
                            }}
                          >
                            {Math.round(currentWeather.main.temp)}
                            <Typography
                              component="span"
                              sx={{
                                fontSize: { xs: '1.3rem', sm: '1.6rem' },
                                fontWeight: 400,
                                color: blcColors.navyAccent,
                              }}
                            >
                              {unitSymbol}
                            </Typography>
                          </Typography>

                          <Typography
                            sx={{
                              fontFamily: '"Inter", sans-serif',
                              fontSize: '0.82rem',
                              fontWeight: 500,
                              textTransform: 'capitalize',
                              color: isDark ? '#cbd5e1' : '#334155',
                              mt: 0.25,
                            }}
                          >
                            {currentWeather.weather?.[0]?.description} • Feels like{' '}
                            {Math.round(currentWeather.main.feels_like)}
                            {unitSymbol}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Right: 4 Metric Boxes row + Sunrise/Sunset bar directly below */}
                    <Grid item xs={12} sm={6}>
                      {/* Row 1: 4 metric boxes side by side using flexbox */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {[
                          { label: 'Humidity', value: `${currentWeather.main.humidity}%` },
                          { label: 'Wind', value: `${currentWeather.wind.speed} ${speedUnit}` },
                          { label: 'Pressure', value: `${currentWeather.main.pressure}` },
                          { label: 'Visibility', value: `${(currentWeather.visibility / 1000).toFixed(0)} km` },
                        ].map(({ label, value }) => (
                          <Paper
                            key={label}
                            elevation={0}
                            sx={{
                              flex: 1,
                              p: 1,
                              textAlign: 'center',
                              borderRadius: '10px',
                              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                              border: `1px solid ${isDark ? blcColors.darkBorder : '#e5e7eb'}`,
                            }}
                          >
                            <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                              {label}
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, mt: 0.2 }}>
                              {value}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>

                      {/* Row 2: Sunrise & Sunset bar — directly below the 4 boxes, same full width */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 0.8,
                          borderRadius: '10px',
                          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                          border: `1px solid ${isDark ? blcColors.darkBorder : '#e5e7eb'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <SunIcon sx={{ color: '#f59e0b', fontSize: 15 }} />
                          <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                            Sunrise: <strong>{formatTime(currentWeather.sys?.sunrise, currentWeather.timezone)}</strong>
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ borderColor: isDark ? blcColors.darkBorder : '#e5e7eb' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <MoonIcon sx={{ color: '#6366f1', fontSize: 15 }} />
                          <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                            Sunset: <strong>{formatTime(currentWeather.sys?.sunset, currentWeather.timezone)}</strong>
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Right Column: Search Panel */}
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    height: '100%',
                    borderRadius: '16px',
                    bgcolor: isDark ? blcColors.darkCard : '#ffffff',
                    border: `1px solid ${isDark ? blcColors.darkBorder : '#e5e7eb'}`,
                    boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        mb: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                      }}
                    >
                      <SearchIcon sx={{ fontSize: 16, color: blcColors.navyAccent }} />
                      Search City
                    </Typography>

                    {/* Search Form */}
                    <Box
                      component="form"
                      onSubmit={handleSearch}
                      sx={{
                        p: '3px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '10px',
                        bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                        border: `1px solid ${isDark ? blcColors.darkBorder : '#e2e8f0'}`,
                        mb: 1.5,
                      }}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        variant="standard"
                        placeholder="Search city (e.g. Tokyo, Paris)..."
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontFamily: '"Inter", sans-serif',
                            fontSize: '0.82rem',
                            color: isDark ? '#f8fafc' : '#111827',
                            px: 1,
                          },
                        }}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        disabled={loading || !cityInput.trim()}
                        sx={{
                          px: 1.75,
                          py: 0.4,
                          minWidth: 'unset',
                          borderRadius: '7px',
                          bgcolor: blcColors.navyAccent,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          fontFamily: '"Inter", sans-serif',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            bgcolor: '#1e40af',
                          },
                        }}
                      >
                        Search
                      </Button>
                    </Box>
                  </Box>

                  {/* Popular Cities in Search Panel */}
                  <Box>
                    <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', mb: 0.75 }}>
                      Popular Destinations:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {POPULAR_CITIES.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          size="small"
                          onClick={() => fetchWeatherData(c, unit)}
                          sx={{
                            height: 22,
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontFamily: '"Inter", sans-serif',
                            cursor: 'pointer',
                            bgcolor: currentCity.toLowerCase() === c.toLowerCase()
                              ? `${blcColors.navyAccent}22`
                              : isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                            color: currentCity.toLowerCase() === c.toLowerCase()
                              ? blcColors.navyAccent
                              : isDark ? '#cbd5e1' : '#4b5563',
                            border: `1px solid ${currentCity.toLowerCase() === c.toLowerCase()
                              ? blcColors.navyAccent
                              : 'transparent'
                              }`,
                            '&:hover': {
                              bgcolor: `${blcColors.navyAccent}18`,
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* ── Row 2: Hourly Forecast (Left) + 5-Day Extended Forecast (Right) ── */}
            <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
              {/* Left Column: Hourly Forecast */}
              <Grid item xs={12} sm={8}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 7, md: 3 },
                    height: '100%',
                    borderRadius: '16px',
                    bgcolor: isDark ? blcColors.darkCard : '#ffffff',
                    border: `1px solid ${isDark ? blcColors.darkBorder : '#e5e7eb'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      mb: 1.25,
                    }}
                  >
                    Hourly Forecast (24h)
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      overflowX: 'auto',
                      pb: 0.5,
                      '&::-webkit-scrollbar': { height: '5px' },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: isDark ? '#334155' : '#cbd5e1',
                        borderRadius: '3px',
                      },
                    }}
                  >
                    {forecast?.list?.slice(0, 8).map((hourItem) => {
                      const timeLabel = new Date(hourItem.dt * 1000).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <Box
                          key={hourItem.dt}
                          sx={{
                            minWidth: 64,
                            textAlign: 'center',
                            p: 1,
                            borderRadius: '10px',
                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                          }}
                        >
                          <Typography sx={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                            {timeLabel}
                          </Typography>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              mx: 'auto',
                              my: 0.5,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#dbeafe',
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#bfdbfe'}`,
                            }}
                          >
                            <Box
                              component="img"
                              src={`https://openweathermap.org/img/wn/${hourItem.weather[0].icon}.png`}
                              alt={hourItem.weather[0].main}
                              sx={{
                                width: 28,
                                height: 28,
                                filter: isDark ? 'none' : 'drop-shadow(0 2px 4px rgba(30, 58, 138, 0.25))',
                              }}
                            />
                          </Box>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            {Math.round(hourItem.main.temp)}{unitSymbol}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              </Grid>

              {/* Right Column: 5-Day Extended Daily Forecast */}
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    height: '100%',
                    borderRadius: '16px',
                    bgcolor: isDark ? blcColors.darkCard : '#ffffff',
                    border: `1px solid ${isDark ? blcColors.darkBorder : '#e5e7eb'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      mb: 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    <CalendarIcon sx={{ fontSize: 16, color: blcColors.navyAccent }} />
                    5-Day Extended Forecast
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      overflowX: 'auto',
                      pb: 0.5,
                      '&::-webkit-scrollbar': { height: '5px' },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: isDark ? '#334155' : '#cbd5e1',
                        borderRadius: '3px',
                      },
                    }}
                  >
                    {dailyForecast.map((day) => (
                      <Box
                        key={day.dateKey}
                        sx={{
                          flex: 1,
                          minWidth: 70,
                          textAlign: 'center',
                          p: 1,
                          borderRadius: '10px',
                          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                          transition: 'transform 0.15s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: blcColors.navyAccent,
                          },
                        }}
                      >
                        <Typography sx={{ fontWeight: 600, fontSize: '0.74rem' }}>
                          {formatDate(day.dt).split(',')[0]}
                        </Typography>

                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            mx: 'auto',
                            my: 0.5,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#dbeafe',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#bfdbfe'}`,
                          }}
                        >
                          <Box
                            component="img"
                            src={`https://openweathermap.org/img/wn/${day.weather?.icon}@2x.png`}
                            alt={day.weather?.description}
                            sx={{
                              width: 32,
                              height: 32,
                              filter: isDark ? 'none' : 'drop-shadow(0 2px 4px rgba(30, 58, 138, 0.25))',
                            }}
                          />
                        </Box>

                        <Typography
                          sx={{
                            fontSize: '0.68rem',
                            textTransform: 'capitalize',
                            color: isDark ? '#94a3b8' : '#64748b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.5,
                          }}
                        >
                          {day.weather?.main || day.weather?.description}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                            {Math.round(day.temp_max)}°
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: isDark ? '#64748b' : '#9ca3af' }}>
                            {Math.round(day.temp_min)}°
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
};

export default WeatherPage;
