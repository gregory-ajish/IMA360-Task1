// WeatherPage.jsx
// ============================================================================
// PURPOSE:
//   Redux-connected Weather tracking dashboard page matching reference UI layout.
//   Connected to Redux Toolkit / Redux Thunk (weatherSlice.js) for state management.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Material-UI Components
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  TextField,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  Skeleton,
} from '@mui/material';

// Material-UI Icons
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Thermostat as ThermostatIcon,
  Opacity as HumidityIcon,
  Air as WindIcon,
  WaterDrop as RainIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';

// Theme tokens & Context
import { blcColors } from '../theme';
import { useAuth } from '../context/AuthContext';

// Common Components
import { Navbar } from '../components/dashboard/Navbar';

// Redux Actions & Thunks
import {
  fetchWeatherThunk,
  setUnit,
  setCity,
  setDemoFallback,
} from '../store/weatherSlice';

/**
 * Formats epoch timestamp (seconds) into full date string (e.g. "Tuesday, Aug 5, 2025")
 */
const formatDateFull = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Fallback generator for realistic mock data when OpenWeather API key is activating (401)
 */
const generateFallbackDemoData = (cityName = 'Berlin', unit = 'metric') => {
  const isMetric = unit === 'metric';
  const now = Math.floor(Date.now() / 1000);

  const currentWeather = {
    name: cityName,
    sys: { country: 'DE', sunrise: now - 21600, sunset: now + 21600 },
    dt: now,
    timezone: 0,
    main: {
      temp: isMetric ? 20 : 68,
      feels_like: isMetric ? 18 : 64,
      temp_min: 14,
      temp_max: 24,
      humidity: 46,
      pressure: 1014,
    },
    wind: { speed: isMetric ? 14 : 9 },
    rain: { '1h': 0 },
    weather: [
      {
        id: 800,
        main: 'Clear',
        description: 'clear sky',
        icon: '01d',
      },
    ],
  };

  const list = [];
  for (let i = 0; i < 40; i++) {
    const timeOffset = (i + 1) * 3 * 3600;
    const targetDate = new Date((now + timeOffset) * 1000);
    const dateStr = targetDate.toISOString().replace('T', ' ').slice(0, 19);

    list.push({
      dt: now + timeOffset,
      dt_txt: dateStr,
      main: {
        temp: isMetric ? 17 + (i % 6) : 62 + (i % 10),
        temp_min: isMetric ? 14 : 57,
        temp_max: isMetric ? 24 : 75,
        humidity: 40 + (i % 20),
      },
      weather: [
        {
          id: 800,
          main: i % 3 === 0 ? 'Clear' : i % 3 === 1 ? 'Clouds' : 'Rain',
          description: i % 3 === 0 ? 'clear sky' : i % 3 === 1 ? 'few clouds' : 'light rain',
          icon: i % 3 === 0 ? '01d' : i % 3 === 1 ? '02d' : '10d',
        },
      ],
      pop: (i % 5) * 0.1,
      rain: { '3h': i % 4 === 0 ? 0.5 : 0 },
    });
  }

  return { currentWeather, forecast: { list } };
};

export const WeatherPage = ({ mode, toggleMode }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser, logout } = useAuth();
  const isDark = mode === 'dark';

  // Redux Selectors
  const {
    currentWeather,
    dailyForecast,
    city,
    unit,
    loading,
  } = useSelector((state) => state.weather);

  // Local state for search input
  const [searchInput, setSearchInput] = useState('');

  // Initial load
  useEffect(() => {
    dispatch(fetchWeatherThunk({ city: city || 'Berlin', unit }))
      .unwrap()
      .catch((err) => {
        if (err?.status === 401) {
          const fallback = generateFallbackDemoData(city || 'Berlin', unit);
          dispatch(setDemoFallback(fallback));
          toast.info('🔑 API key is activating. Displaying demo data.', { toastId: 'demo-fallback' });
        }
      });
  }, []);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const queryCity = searchInput.trim();
    dispatch(setCity(queryCity));
    dispatch(fetchWeatherThunk({ city: queryCity, unit }))
      .unwrap()
      .then(() => setSearchInput(''))
      .catch((err) => {
        if (err?.status === 401) {
          const fallback = generateFallbackDemoData(queryCity, unit);
          dispatch(setDemoFallback(fallback));
          toast.info('🔑 API key is activating. Displaying demo data.', { toastId: 'demo-fallback' });
        } else if (err?.status === 404) {
          toast.error(`City "${queryCity}" not found. Please check spelling.`);
        }
      });
  };

  // Handle Unit toggle dropdown change
  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    dispatch(setUnit(newUnit));
    dispatch(fetchWeatherThunk({ city, unit: newUnit }))
      .unwrap()
      .catch((err) => {
        if (err?.status === 401) {
          const fallback = generateFallbackDemoData(city, newUnit);
          dispatch(setDemoFallback(fallback));
        }
      });
  };

  const speedSymbol = unit === 'metric' ? 'km/h' : 'mph';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: isDark ? '#0b0e1b' : blcColors.cream,
        color: isDark ? '#f8fafc' : blcColors.textDark,
        pb: 4,
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Top Navbar */}
      <Navbar
        mode={mode}
        toggleMode={toggleMode}
        currentUser={currentUser}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      {/* Main Container */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 1.5, maxWidth: 1400, mx: 'auto' }}>
        
        {/* Compact Header Bar: Navigation & Units Toggle Dropdown */}
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
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                color: isDark ? '#e2e8f0' : '#374151',
                p: 0.5,
              }}
              size="small"
              aria-label="Back to dashboard"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>

            <Breadcrumbs
              separator="/"
              sx={{
                fontSize: '0.82rem',
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
                  fontSize: '0.82rem',
                }}
              >
                Weather
              </Typography>
            </Breadcrumbs>
          </Box>

          {/* Refresh Button & Units Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => dispatch(fetchWeatherThunk({ city, unit }))}
              disabled={loading}
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                color: isDark ? '#e2e8f0' : '#374151',
                p: 0.5,
              }}
              size="small"
            >
              <RefreshIcon fontSize="small" sx={{ animation: loading ? 'spin 1s linear infinite' : 'none', fontSize: 16 }} />
            </IconButton>

            {/* Units Selector Dropdown */}
            <FormControl size="small">
              <Select
                value={unit}
                onChange={handleUnitChange}
                sx={{
                  height: 32,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#1e293b',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'}`,
                  '& .MuiSelect-select': { py: 0.5, px: 1.5 },
                  '& fieldset': { border: 'none' },
                }}
              >
                <MenuItem value="metric" sx={{ fontSize: '0.78rem' }}>Units: °C</MenuItem>
                <MenuItem value="imperial" sx={{ fontSize: '0.78rem' }}>Units: °F</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Compact Search Section */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <Paper
            component="form"
            onSubmit={handleSearchSubmit}
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: 540,
              p: '2px 4px 2px 12px',
              borderRadius: '12px',
              bgcolor: isDark ? '#14172b' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.04)',
            }}
          >
            <SearchIcon sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 18, mr: 1 }} />
            <TextField
              fullWidth
              size="small"
              variant="standard"
              placeholder="Search for a place..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: '0.84rem',
                  color: isDark ? '#f8fafc' : '#0f172a',
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={loading || !searchInput.trim()}
              sx={{
                px: 2.2,
                py: 0.5,
                borderRadius: '8px',
                bgcolor: '#4f46e5',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.78rem',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#4338ca' },
              }}
            >
              Search
            </Button>
          </Paper>
        </Box>

        {/* Loading Skeleton */}
        {loading && !currentWeather && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: '16px', mb: 2 }} />
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '16px' }} />
            </Grid>
            <Grid item xs={12} md={5}>
              <Skeleton variant="rectangular" height={360} sx={{ borderRadius: '16px' }} />
            </Grid>
          </Grid>
        )}

        {/* Main Content Layout Grid */}
        {currentWeather && (
          <Grid container spacing={2}>
            
            {/* Left Column: Hero Weather Card + 4 Metrics */}
            <Grid item xs={12} md={7}>
              
              {/* 1. Hero Weather Card */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: '16px',
                  background: isDark
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 40%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                  mb: 2,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {currentWeather.name}, {currentWeather.sys?.country}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.78rem',
                        color: 'rgba(255,255,255,0.8)',
                        mt: 0.25,
                      }}
                    >
                      {formatDateFull(currentWeather.dt)}
                    </Typography>
                  </Box>

                  {/* Temperature & Icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {currentWeather.weather?.[0]?.icon && (
                      <Box
                        component="img"
                        src={`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`}
                        alt={currentWeather.weather[0].description}
                        sx={{
                          width: { xs: 52, sm: 64 },
                          height: { xs: 52, sm: 64 },
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                        }}
                      />
                    )}
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '2.5rem', sm: '3.2rem' },
                        lineHeight: 1,
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {Math.round(currentWeather.main.temp)}°
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* 2. Four Metric Cards Grid (2x2 on mobile, 4 in a row on desktop) */}
              <Grid container spacing={1.5}>
                {[
                  {
                    label: 'Feels Like',
                    value: `${Math.round(currentWeather.main.feels_like)}°`,
                    icon: <ThermostatIcon sx={{ fontSize: 18, color: '#818cf8' }} />,
                  },
                  {
                    label: 'Humidity',
                    value: `${currentWeather.main.humidity}%`,
                    icon: <HumidityIcon sx={{ fontSize: 18, color: '#38bdf8' }} />,
                  },
                  {
                    label: 'Wind',
                    value: `${Math.round(currentWeather.wind?.speed || 0)} ${speedSymbol}`,
                    icon: <WindIcon sx={{ fontSize: 18, color: '#34d399' }} />,
                  },
                  {
                    label: 'Precipitation',
                    value: `${currentWeather.rain?.['1h'] || 0} mm`,
                    icon: <RainIcon sx={{ fontSize: 18, color: '#f472b6' }} />,
                  },
                ].map(({ label, value, icon }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.75,
                        borderRadius: '12px',
                        bgcolor: isDark ? '#14172b' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                        textAlign: 'left',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                        {icon}
                        <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                          {label}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                        {value}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

            </Grid>

            {/* Right Column: Weekly Forecast Panel (Horizontal Layout) */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  bgcolor: isDark ? '#14172b' : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                }}
              >
                {/* Panel Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <CalendarIcon sx={{ fontSize: 18, color: '#4f46e5' }} />
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                    Weekly forecast
                  </Typography>
                </Box>

                {/* Horizontal Weekly Cards (7 Days side-by-side) */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flex: 1,
                    alignItems: 'stretch',
                    overflowX: 'auto',
                    pb: 0.5,
                    '&::-webkit-scrollbar': { height: '5px' },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1',
                      borderRadius: '3px',
                    },
                  }}
                >
                  {dailyForecast.map((day, idx) => (
                    <Paper
                      key={day.dateKey || idx}
                      elevation={0}
                      sx={{
                        flex: 1,
                        minWidth: 62,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.25,
                        borderRadius: '12px',
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: '#4f46e5',
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                        },
                      }}
                    >
                      {/* Day Name & Date */}
                      <Box>
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                          {day.dayName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.66rem', color: isDark ? '#94a3b8' : '#64748b', mt: 0.2 }}>
                          {day.fullDate}
                        </Typography>
                      </Box>

                      {/* Weather Icon */}
                      <Box
                        component="img"
                        src={`https://openweathermap.org/img/wn/${day.weather?.icon || '01d'}.png`}
                        alt={day.weather?.description || 'weather'}
                        sx={{
                          width: 36,
                          height: 36,
                          my: 0.5,
                          filter: isDark ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
                        }}
                      />

                      {/* Condition Description */}
                      <Typography
                        sx={{
                          fontSize: '0.66rem',
                          color: isDark ? '#cbd5e1' : '#64748b',
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 68,
                        }}
                      >
                        {day.weather?.main || 'Clear'}
                      </Typography>

                      {/* Max / Min Temperatures */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                          {Math.round(day.tempMax)}°
                        </Typography>
                        <Typography sx={{ fontSize: '0.74rem', color: isDark ? '#64748b' : '#9ca3af' }}>
                          {Math.round(day.tempMin)}°
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Paper>
            </Grid>

          </Grid>
        )}

      </Box>
    </Box>
  );
};

export default WeatherPage;
