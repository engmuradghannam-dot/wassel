import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, TextField, Button,
  Divider, Avatar, Switch, FormControlLabel, Tabs, Tab, Alert,
  Snackbar, IconButton, Chip, Card, CardContent, InputAdornment,
  Stepper, Step, StepLabel, StepContent, Fade, Zoom, Badge, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemIcon, ListItemText, ListItemButton, MobileStepper
} from '@mui/material';
import {
  Business, LocationOn, Phone, Email, Language, Receipt,
  Upload, Save, Map, PhotoCamera, Numbers, CheckCircle,
  Edit, Delete, Add, LocationCity, GpsFixed, MyLocation,
  MapOutlined, Public, Store, Assignment, Verified,
  Warning, Info, NavigateNext, NavigateBefore, Flag,
  Person, Groups, CorporateFare
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import LocationPicker from '../../components/LocationPicker';
import axios from 'axios';

const CompanySettings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [company, setCompany] = useState({
    name: '',
    nameEn: '',
    email: '',
    phone: '',
    website: '',
    taxNumber: '',
    commercialRegistration: '',
    crIssueDate: '',
    crExpiryDate: '',
    crAuthority: '',
    address: '',
    city: '',
    country: 'SA',
    zipCode: '',
    location: { lat: 24.7136, lng: 46.6753, address: '' },
    logo: '',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    companyType: 'llc', // llc, sole_proprietorship, partnership, corporation
    industry: '',
    employeeCount: '',
    foundedDate: '',
    pdfSettings: {
      pageSize: 'A4',
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 15,
      marginRight: 15,
      showLogo: true,
      showStamp: false,
      headerText: '',
      footerText: '',
      primaryColor: '#1976d2'
    }
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const res = await axios.get('/api/company');
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setCompany(prev => ({ 
          ...prev, 
          ...data,
          location: data.location || prev.location,
          pdfSettings: { ...prev.pdfSettings, ...data.pdfSettings }
        }));
        if (data.logo) setLogoPreview(data.logo);
      }
    } catch (err) {
      console.log('Using default company settings');
    }
  };

  const handleChange = (field, value) => {
    setCompany(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, company[field]);
  };

  const validateField = (field, value) => {
    let error = null;
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) error = t('validation.nameRequired');
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = t('validation.invalidEmail');
        break;
      case 'commercialRegistration':
        if (value && !/^\d{10}$/.test(value.replace(/\D/g, ''))) error = t('validation.invalidCR');
        break;
      case 'taxNumber':
        if (value && !/^3\d{13}$/.test(value.replace(/\D/g, ''))) error = t('validation.invalidTax');
        break;
      case 'phone':
        if (value && !/^\+?[\d\s-]{8,}$/.test(value)) error = t('validation.invalidPhone');
        break;
      default:
        break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handlePdfChange = (field, value) => {
    setCompany(prev => ({
      ...prev,
      pdfSettings: { ...prev.pdfSettings, [field]: value }
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: t('company.logoTooLarge'), severity: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await axios.post('/api/company/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setCompany(prev => ({ ...prev, logo: res.data.data.logo }));
        setSnackbar({ open: true, message: t('company.logoUploaded'), severity: 'success' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: t('company.logoUploadError'), severity: 'error' });
    }
  };

  const handleLocationSelect = (locationData) => {
    setCompany(prev => ({
      ...prev,
      location: locationData,
      address: locationData.address || prev.address
    }));
    setSnackbar({ open: true, message: t('company.locationSelected'), severity: 'success' });
  };

  const validateAll = () => {
    const fields = ['name', 'email', 'commercialRegistration', 'taxNumber', 'phone'];
    let isValid = true;
    fields.forEach(field => {
      if (!validateField(field, company[field])) isValid = false;
    });
    return isValid;
  };

  const handleSave = async () => {
    if (!validateAll()) {
      setSnackbar({ open: true, message: t('validation.fixErrors'), severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put('/api/company', company);
      if (res.data.success) {
        setSnackbar({ open: true, message: t('company.saved'), severity: 'success' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || t('common.error'), severity: 'error' });
    }
    setLoading(false);
  };

  const handleReset = () => {
    setConfirmDialog({
      open: true,
      title: t('company.resetConfirmTitle'),
      message: t('company.resetConfirmMessage'),
      onConfirm: () => {
        fetchCompany();
        setConfirmDialog({ ...confirmDialog, open: false });
        setSnackbar({ open: true, message: t('company.resetSuccess'), severity: 'info' });
      }
    });
  };

  // Company Type Options
  const companyTypes = [
    { value: 'llc', label: t('company.types.llc'), icon: <Business /> },
    { value: 'sole_proprietorship', label: t('company.types.sole'), icon: <Person /> },
    { value: 'partnership', label: t('company.types.partnership'), icon: <Groups /> },
    { value: 'corporation', label: t('company.types.corporation'), icon: <CorporateFare /> },
  ];

  const steps = [
    t('company.steps.basic'),
    t('company.steps.legal'),
    t('company.steps.location'),
    t('company.steps.pdf')
  ];

  const renderBasicInfoStep = () => (
    <Fade in={true}>
      <Grid container spacing={3}>
        {/* Logo Upload */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {t('company.logo')}
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Tooltip title={t('company.changeLogo')}>
                    <IconButton
                      component="label"
                      sx={{
                        bgcolor: 'primary.main', color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        width: 40, height: 40
                      }}
                    >
                      <PhotoCamera fontSize="small" />
                      <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                    </IconButton>
                  </Tooltip>
                }
              >
                <Avatar
                  src={logoPreview || '/default-logo.png'}
                  sx={{ 
                    width: 150, height: 150, 
                    border: '3px solid', 
                    borderColor: 'primary.main',
                    bgcolor: 'grey.100'
                  }}
                />
              </Badge>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              {t('company.logoHint')}
            </Typography>
            <Chip 
              size="small" 
              label={company.logo ? t('company.logoSet') : t('company.noLogo')} 
              color={company.logo ? 'success' : 'default'}
              icon={company.logo ? <CheckCircle fontSize="small" /> : <Info fontSize="small" />}
            />
          </Paper>
        </Grid>

        {/* Company Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              <Business sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
              {t('company.generalInfo')}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.name')}
                  value={company.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  error={!!fieldErrors.name && touched.name}
                  helperText={touched.name && fieldErrors.name}
                  required
                  InputProps={{ 
                    startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} /> 
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.nameEn')}
                  value={company.nameEn}
                  onChange={(e) => handleChange('nameEn', e.target.value)}
                  InputProps={{ 
                    startAdornment: <Language sx={{ mr: 1, color: 'text.secondary' }} /> 
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.email')}
                  type="email"
                  value={company.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  error={!!fieldErrors.email && touched.email}
                  helperText={touched.email && fieldErrors.email}
                  InputProps={{ 
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} /> 
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.phone')}
                  value={company.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  error={!!fieldErrors.phone && touched.phone}
                  helperText={touched.phone && fieldErrors.phone}
                  placeholder="+966 50 123 4567"
                  InputProps={{ 
                    startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} /> 
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.website')}
                  value={company.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://www.company.com"
                  InputProps={{ 
                    startAdornment: <Language sx={{ mr: 1, color: 'text.secondary' }} /> 
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.currency')}
                  value={company.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  select
                  SelectProps={{ native: true }}
                >
                  <option value="SAR">🇸🇦 SAR - ريال سعودي</option>
                  <option value="USD">🇺🇸 USD - دولار أمريكي</option>
                  <option value="EUR">🇪🇺 EUR - يورو</option>
                  <option value="AED">🇦🇪 AED - درهم إماراتي</option>
                  <option value="KWD">🇰🇼 KWD - دينار كويتي</option>
                  <option value="QAR">🇶🇦 QAR - ريال قطري</option>
                  <option value="BHD">🇧🇭 BHD - دينار بحريني</option>
                  <option value="OMR">🇴🇲 OMR - ريال عماني</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.industry')}
                  value={company.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  placeholder={t('company.industryPlaceholder')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('company.employeeCount')}
                  value={company.employeeCount}
                  onChange={(e) => handleChange('employeeCount', e.target.value)}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Fade>
  );

  const renderLegalStep = () => (
    <Fade in={true}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Verified sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold">
                {t('company.legalInfo')}
              </Typography>
              <Chip 
                size="small" 
                label={t('company.legalRequired')} 
                color="warning" 
                sx={{ ml: 2 }}
                icon={<Warning fontSize="small" />}
              />
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Commercial Registration */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'primary.main', borderWidth: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary.main">
                      <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {t('company.commercialRegistration')}
                    </Typography>
                    <TextField
                      fullWidth
                      label={t('company.crNumber')}
                      value={company.commercialRegistration}
                      onChange={(e) => handleChange('commercialRegistration', e.target.value)}
                      onBlur={() => handleBlur('commercialRegistration')}
                      error={!!fieldErrors.commercialRegistration && touched.commercialRegistration}
                      helperText={touched.commercialRegistration && fieldErrors.commercialRegistration || t('company.crFormat')}
                      placeholder="1010123456"
                      InputProps={{ 
                        startAdornment: <Numbers sx={{ mr: 1, color: 'primary.main' }} /> 
                      }}
                      sx={{ mb: 2 }}
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label={t('company.crIssueDate')}
                          value={company.crIssueDate}
                          onChange={(e) => handleChange('crIssueDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label={t('company.crExpiryDate')}
                          value={company.crExpiryDate}
                          onChange={(e) => handleChange('crExpiryDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      fullWidth
                      label={t('company.crAuthority')}
                      value={company.crAuthority}
                      onChange={(e) => handleChange('crAuthority', e.target.value)}
                      placeholder={t('company.crAuthorityPlaceholder')}
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Tax Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'success.main', borderWidth: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="success.main">
                      <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {t('company.taxInfo')}
                    </Typography>
                    <TextField
                      fullWidth
                      label={t('company.taxNumber')}
                      value={company.taxNumber}
                      onChange={(e) => handleChange('taxNumber', e.target.value)}
                      onBlur={() => handleBlur('taxNumber')}
                      error={!!fieldErrors.taxNumber && touched.taxNumber}
                      helperText={touched.taxNumber && fieldErrors.taxNumber || t('company.taxFormat')}
                      placeholder="300123456700003"
                      InputProps={{ 
                        startAdornment: <Receipt sx={{ mr: 1, color: 'success.main' }} /> 
                      }}
                    />
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="caption" color="success.contrastText">
                        <Info sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {t('company.taxHint')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Company Type */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {t('company.companyType')}
                </Typography>
                <Grid container spacing={2}>
                  {companyTypes.map((type) => (
                    <Grid item xs={6} sm={3} key={type.value}>
                      <Card
                        variant={company.companyType === type.value ? 'elevation' : 'outlined'}
                        elevation={company.companyType === type.value ? 4 : 0}
                        sx={{
                          cursor: 'pointer',
                          borderColor: company.companyType === type.value ? 'primary.main' : 'divider',
                          borderWidth: company.companyType === type.value ? 2 : 1,
                          bgcolor: company.companyType === type.value ? 'primary.light' : 'background.paper',
                          transition: 'all 0.3s',
                          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                        }}
                        onClick={() => handleChange('companyType', type.value)}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Box sx={{ color: company.companyType === type.value ? 'primary.main' : 'text.secondary', mb: 1 }}>
                            {type.icon}
                          </Box>
                          <Typography variant="body2" fontWeight={company.companyType === type.value ? 'bold' : 'normal'}>
                            {type.label}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Fade>
  );

  const renderLocationStep = () => (
    <Fade in={true}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationOn sx={{ mr: 1, color: 'error.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold">
                {t('company.location')}
              </Typography>
              {company.location?.address && (
                <Chip 
                  size="small" 
                  label={t('company.locationSet')} 
                  color="success" 
                  sx={{ ml: 2 }}
                  icon={<CheckCircle fontSize="small" />}
                />
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Address Fields */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('company.address')}
                      value={company.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      multiline
                      rows={2}
                      placeholder={t('company.addressPlaceholder')}
                      InputProps={{ 
                        startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} /> 
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('company.city')}
                      value={company.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder={t('company.cityPlaceholder')}
                      InputProps={{ 
                        startAdornment: <LocationCity sx={{ mr: 1, color: 'text.secondary' }} /> 
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('company.country')}
                      value={company.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      select
                      SelectProps={{ native: true }}
                    >
                      <option value="SA">🇸🇦 السعودية</option>
                      <option value="AE">🇦🇪 الإمارات</option>
                      <option value="KW">🇰🇼 الكويت</option>
                      <option value="QA">🇶🇦 قطر</option>
                      <option value="BH">🇧🇭 البحرين</option>
                      <option value="OM">🇴🇲 عمان</option>
                      <option value="EG">🇪🇬 مصر</option>
                      <option value="JO">🇯🇴 الأردن</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('company.zipCode')}
                      value={company.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                      placeholder="12345"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Map Selection */}
              <Grid item xs={12} md={4}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderColor: company.location?.address ? 'success.main' : 'warning.main',
                    borderWidth: 2
                  }}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      <GpsFixed sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                      {t('company.mapLocation')}
                    </Typography>

                    {company.location?.address ? (
                      <Box sx={{ mb: 2 }}>
                        <Alert severity="success" sx={{ mb: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {t('company.selectedAddress')}
                          </Typography>
                          <Typography variant="caption">
                            {company.location.address}
                          </Typography>
                        </Alert>
                        <Chip
                          size="small"
                          icon={<MyLocation fontSize="small" />}
                          label={`${company.location.lat?.toFixed(6)}, ${company.location.lng?.toFixed(6)}`}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    ) : (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        {t('company.noLocationSelected')}
                      </Alert>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<Map />}
                      onClick={() => setLocationPickerOpen(true)}
                      sx={{ mt: 'auto' }}
                    >
                      {company.location?.address ? t('company.changeLocation') : t('company.selectOnMap')}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Static Map Preview */}
            {company.location?.lat && (
              <Box sx={{ mt: 3, borderRadius: 2, overflow: 'hidden', border: '2px solid', borderColor: 'divider' }}>
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${company.location.lat},${company.location.lng}&zoom=15&size=1200x300&markers=color:red%7Clabel:C%7C${company.location.lat},${company.location.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}`}
                  alt="Company Location"
                  style={{ width: '100%', height: 250, objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Fade>
  );

  const renderPdfStep = () => (
    <Fade in={true}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {t('company.pdfSettings')}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.pageSize')}
                  value={company.pdfSettings.pageSize}
                  onChange={(e) => handlePdfChange('pageSize', e.target.value)}
                  select
                  SelectProps={{ native: true }}
                >
                  <option value="A4">A4 (210×297 mm)</option>
                  <option value="Letter">Letter (216×279 mm)</option>
                  <option value="Legal">Legal (216×356 mm)</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('company.headerText')}
                  value={company.pdfSettings.headerText}
                  onChange={(e) => handlePdfChange('headerText', e.target.value)}
                  placeholder={t('company.headerPlaceholder')}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('company.marginTop')}
                  value={company.pdfSettings.marginTop}
                  onChange={(e) => handlePdfChange('marginTop', parseInt(e.target.value))}
                  InputProps={{ endAdornment: <Typography variant="caption">mm</Typography> }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('company.marginBottom')}
                  value={company.pdfSettings.marginBottom}
                  onChange={(e) => handlePdfChange('marginBottom', parseInt(e.target.value))}
                  InputProps={{ endAdornment: <Typography variant="caption">mm</Typography> }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('company.marginLeft')}
                  value={company.pdfSettings.marginLeft}
                  onChange={(e) => handlePdfChange('marginLeft', parseInt(e.target.value))}
                  InputProps={{ endAdornment: <Typography variant="caption">mm</Typography> }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('company.marginRight')}
                  value={company.pdfSettings.marginRight}
                  onChange={(e) => handlePdfChange('marginRight', parseInt(e.target.value))}
                  InputProps={{ endAdornment: <Typography variant="caption">mm</Typography> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={company.pdfSettings.showLogo}
                      onChange={(e) => handlePdfChange('showLogo', e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {t('company.showLogoOnPdf')}
                      {company.pdfSettings.showLogo && (
                        <CheckCircle sx={{ ml: 1, color: 'success.main', fontSize: 18 }} />
                      )}
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={company.pdfSettings.showStamp}
                      onChange={(e) => handlePdfChange('showStamp', e.target.checked)}
                    />
                  }
                  label={t('company.showStamp')}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Fade>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0: return renderBasicInfoStep();
      case 1: return renderLegalStep();
      case 2: return renderLocationStep();
      case 3: return renderPdfStep();
      default: return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          <Business sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
          {t('company.settings')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('company.settingsDescription')}
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={index < activeStep}>
              <StepLabel 
                onClick={() => setActiveStep(index)}
                sx={{ cursor: 'pointer' }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Box sx={{ mb: 3 }}>
        {getStepContent(activeStep)}
      </Box>

      {/* Navigation Buttons */}
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button
            variant="outlined"
            onClick={handleReset}
            startIcon={<Delete />}
            color="error"
            sx={{ mr: 1 }}
          >
            {t('common.reset')}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            startIcon={<NavigateBefore />}
          >
            {t('common.previous')}
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              size="large"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={loading}
              color="success"
            >
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
              endIcon={<NavigateNext />}
            >
              {t('common.next')}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Location Picker Dialog */}
      <LocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={handleLocationSelect}
        defaultLocation={company.location}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirmDialog.onConfirm} color="error" variant="contained">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CompanySettings;
