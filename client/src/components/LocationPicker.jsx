import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, TextField, Typography, Paper, Dialog, DialogTitle,
  DialogContent, IconButton, Chip, CircularProgress, Alert
} from '@mui/material';
import {
  LocationOn, MyLocation, Search, Close, CheckCircle
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

const LocationPicker = ({ open, onClose, onSelect, defaultLocation = null }) => {
  const { t } = useTranslation();
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const defaultPos = defaultLocation || { lat: 24.7136, lng: 46.6753 }; // Riyadh

  // Load Google Maps Script
  useEffect(() => { // eslint-disable-next-line react-hooks/exhaustive-deps
    if (open && !scriptLoaded && GOOGLE_MAPS_API_KEY) {
      const existingScript = document.getElementById('google-maps-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=ar`;
        script.async = true;
        script.defer = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => setError(t('company.locationMapLoadError'));
        document.head.appendChild(script);
      } else {
        setScriptLoaded(true);
      }
    }
  }, [open, scriptLoaded, t]);

  // Initialize Map
  useEffect(() => {
    if (scriptLoaded && open && window.google) {
      const mapDiv = document.getElementById('location-map');
      if (mapDiv && !map) {
        const newMap = new window.google.maps.Map(mapDiv, {
          center: defaultPos,
          zoom: 14,
          mapTypeId: 'roadmap',
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        const newMarker = new window.google.maps.Marker({
          position: defaultPos,
          map: newMap,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
        });

        // Click on map to move marker
        newMap.addListener('click', (e) => {
          newMarker.setPosition(e.latLng);
          handleLocationChange(e.latLng.lat(), e.latLng.lng());
        });

        // Drag marker
        newMarker.addListener('dragend', (e) => {
          handleLocationChange(e.latLng.lat(), e.latLng.lng());
        });

        setMap(newMap);
        setMarker(newMarker);

        // Reverse geocode initial position
        handleLocationChange(defaultPos.lat, defaultPos.lng);
      }
    }
  }, [scriptLoaded, open, map]);

  // Reverse Geocoding
  const reverseGeocode = useCallback(async (lat, lng) => {
    if (!window.google) return;
    setLoading(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      if (result.results && result.results.length > 0) {
        setSelectedAddress(result.results[0].formatted_address);
        setSelectedCoords({ lat, lng });
      }
    } catch (err) {
      setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setSelectedCoords({ lat, lng });
    }
    setLoading(false);
  }, []);

  const handleLocationChange = (lat, lng) => {
    reverseGeocode(lat, lng);
  };

  // Search autocomplete
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query || query.length < 3 || !window.google) {
      setPredictions([]);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      { input: query, language: 'ar' },
      (results) => {
        setPredictions(results || []);
      }
    );
  };

  // Select prediction
  const selectPrediction = async (placeId, description) => {
    if (!window.google) return;
    setLoading(true);

    const service = new window.google.maps.places.PlacesService(map);
    service.getDetails({ placeId, fields: ['geometry'] }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        map.setCenter({ lat, lng });
        marker.setPosition({ lat, lng });

        setSelectedAddress(description);
        setSelectedCoords({ lat, lng });
        setSearchQuery(description);
        setPredictions([]);
      }
      setLoading(false);
    });
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (map && marker) {
            map.setCenter({ lat: latitude, lng: longitude });
            marker.setPosition({ lat: latitude, lng: longitude });
            handleLocationChange(latitude, longitude);
          }
          setLoading(false);
        },
        () => {
          setError(t('company.locationPermissionDenied'));
          setLoading(false);
        }
      );
    }
  };

  const handleConfirm = () => {
    if (selectedCoords) {
      onSelect({
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        address: selectedAddress
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          <LocationOn sx={{ mr: 1, color: 'primary.main', verticalAlign: 'middle' }} />
          {t('company.selectLocation')}
        </Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Search Bar */}
        <Box sx={{ mb: 2, position: 'relative' }}>
          <TextField
            fullWidth
            placeholder={t('company.searchLocation')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                <Button
                  size="small"
                  startIcon={<MyLocation />}
                  onClick={getCurrentLocation}
                  disabled={loading}
                >
                  {t('company.myLocation')}
                </Button>
              )
            }}
          />

          {/* Predictions dropdown */}
          {predictions.length > 0 && (
            <Paper sx={{ position: 'absolute', zIndex: 1000, width: '100%', mt: 0.5, maxHeight: 200, overflow: 'auto' }}>
              {predictions.map((pred) => (
                <Box
                  key={pred.place_id}
                  sx={{
                    p: 1.5, cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    borderBottom: '1px solid', borderColor: 'divider'
                  }}
                  onClick={() => selectPrediction(pred.place_id, pred.description)}
                >
                  <Typography variant="body2">{pred.description}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {/* Map */}
        <Box sx={{ position: 'relative' }}>
          <Box
            id="location-map"
            sx={{
              width: '100%',
              height: 400,
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'divider',
              bgcolor: '#e5e5e5'
            }}
          />

          {!scriptLoaded && (
            <Box sx={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.9)'
            }}>
              <CircularProgress />
            </Box>
          )}
        </Box>

        {/* Selected Address */}
        <Paper sx={{ mt: 2, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn />
            <Typography variant="subtitle1" fontWeight="bold">
              {t('company.selectedAddress')}:
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {loading ? <CircularProgress size={20} /> : (selectedAddress || t('company.clickOnMap'))}
          </Typography>
          {selectedCoords && (
            <Chip
              size="small"
              label={`${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`}
              sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)' }}
            />
          )}
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={handleConfirm}
            disabled={!selectedCoords}
          >
            {t('common.confirm')}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPicker;
