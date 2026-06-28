import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Grid, Paper, Typography, TextField, Button,
  IconButton, Avatar, Badge, Divider, List, ListItem, ListItemAvatar,
  ListItemText, ListItemButton, AppBar, Toolbar, InputAdornment,
  SpeedDial, SpeedDialAction, SpeedDialIcon, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Tooltip, Fade, Zoom,
  Menu, MenuItem, Snackbar, Alert, CircularProgress, Drawer,
  useMediaQuery, useTheme, Fab, Card, CardContent
} from '@mui/material';
import {
  Send, AttachFile, EmojiEmotions, MoreVert, Search,
  VideoCall, Call, Phone, Videocam, VideocamOff, Mic, MicOff,
  CallEnd, ScreenShare, StopScreenShare, People, Chat as ChatIcon,
  ArrowBack, Add, Delete, Archive, Block, Report, Settings,
  Close, Fullscreen, FullscreenExit, VolumeUp, VolumeOff,
  PushPin, Reply, Forward, ContentCopy, Edit, CheckCircle,
  RadioButtonUnchecked, DoneAll, AccessTime, Image, InsertDriveFile,
  AudioFile, VideoFile, LocationOn, ContactPhone, Speed,
  KeyboardVoice, PhotoCamera, Screenshot, StickyNote2, Poll,
  CalendarToday, TaskAlt, Notifications, NotificationsOff,
  MarkChatRead, MarkChatUnread, ExitToApp, PersonAdd,
  GroupAdd, Info, Warning, Error as ErrorIcon, Refresh,
  CloudUpload, CloudDone, CloudOff, SignalCellular4Bar,
  SignalCellularConnectedNoInternet0Bar, Wifi, WifiOff,
  BatteryFull, BatteryAlert, Thermostat, WaterDrop, Air,
  LightMode, DarkMode, Contrast, Brightness4, Brightness7,
  Palette, FormatColorFill, TextFormat, FontDownload,
  Translate, Language, Public, Globe, Map, Explore,
  MyLocation, Navigation, Directions, Route, Traffic,
  LocalShipping, DeliveryDining, LocalMall, Storefront,
  Business, Home, Apartment, LocationCity, Villa, Cottage,
  Hotel, Restaurant, LocalCafe, LocalBar, LocalDining,
  Fastfood, LunchDining, DinnerDining, BrunchDining,
  BakeryDining, RamenDining, SetMeal, EggAlt, Icecream,
  LocalPizza, LocalFlorist, LocalGroceryStore, LocalConvenienceStore,
  LocalPharmacy, LocalHospital, LocalPolice, FireTruck,
  LocalFireDepartment, LocalActivity, LocalAtm, LocalBank,
  LocalGasStation, LocalCarWash, LocalParking, LocalTaxi,
  DirectionsCar, DirectionsBus, DirectionsRailway, DirectionsBoat,
  Flight, Train, Subway, Tram, ElectricScooter, ElectricBike,
  PedalBike, Motorcycle, ElectricCar, LocalShippingOutlined,
  Inventory, Warehouse, Factory, PrecisionManufacturing,
  Engineering, Construction, Handyman, Plumbing, ElectricalServices,
  Carpentry, Roofing, Fence, Deck, Yard, Grass, Park, Forest,
  Nature, NaturePeople, Eco, Recycling, Water, OilBarrel,
  SolarPower, WindPower, BatteryChargingFull, Power,
  FlashOn, OfflineBolt, ElectricalServicesOutlined,
  Build, BuildCircle, HandymanOutlined, Architecture,
  DesignServices, FormatPaint, ColorLens, Brush, PaletteOutlined,
  Gradient, Opacity, InvertColors, Tonality, FilterBAndW,
  FilterHdr, FilterVintage, FilterDrama, FilterFrames,
  FilterNone, FilterTiltShift, FilterCenterFocus, BlurOn,
  BlurCircular, BlurLinear, Dehaze, Flare, Looks, Looks3,
  Looks4, Looks5, Looks6, LooksOne, LooksTwo, Crop, CropFree,
  CropDin, CropLandscape, CropPortrait, CropSquare, Crop169,
  Crop32, Crop75, Crop54, Crop16_9, Panorama, PanoramaFishEye,
  PanoramaHorizontal, PanoramaVertical, PanoramaWideAngle,
  Photo, PhotoAlbum, PhotoCamera, PhotoCameraBack, PhotoCameraFront,
  PhotoFilter, PhotoLibrary, PhotoSizeSelectActual, PhotoSizeSelectLarge,
  PhotoSizeSelectSmall, PictureAsPdf, Portrait, RawOff, RawOn,
  ShutterSpeed, Slideshow, SwitchCamera, SwitchVideo, TagFaces,
  Texture, Timelapse, Timer, Timer10, Timer3, TimerOff, Toys,
  Transform, Tune, ViewComfy, ViewCompact, Vignette, WbAuto,
  WbCloudy, WbIncandescent, WbIridescent, WbShade, WbSunny,
  WbTwilight, WbTwilightOutlined, WbTwilightRounded,
  WbTwilightSharp, WbTwilightTwoTone, WbTwilightOutlined,
  AddAPhoto, AddPhotoAlternate, Collections, CollectionsBookmark,
  Filter, Filter1, Filter2, Filter3, Filter4, Filter5, Filter6,
  Filter7, Filter8, Filter9, Filter9Plus, FilterBAndWOutlined,
  FilterCenterFocusOutlined, FilterDramaOutlined, FilterFramesOutlined,
  FilterHdrOutlined, FilterList, FilterListOff, FilterNoneOutlined,
  FilterTiltShiftOutlined, FilterVintageOutlined, FlareOutlined,
  GradientOutlined, Grain, GridOff, GridOn, HdrOff, HdrOn,
  HdrPlus, HdrStrong, HdrWeak, Hevc, HideImage, ImageAspectRatio,
  ImageNotSupported, ImageSearch, Iso, Landscape, LeakAdd,
  LeakRemove, Lens, LinkedCamera, Looks3Outlined, Looks4Outlined,
  Looks5Outlined, Looks6Outlined, LooksOneOutlined, LooksTwoOutlined,
  LooksOutlined, Loupe, MicExternalOff, MicExternalOn, MonochromePhotos,
  MotionPhotosAuto, MotionPhotosOff, MotionPhotosOn, MotionPhotosPause,
  Movie, MovieCreation, MovieFilter, Mp, MusicNote, MusicOff,
  NatureOutlined, NaturePeopleOutlined, NavigateBefore, NavigateNext,
  PaletteOutlined, PanoramaOutlined, PanoramaFishEyeOutlined,
  PanoramaHorizontalOutlined, PanoramaVerticalOutlined,
  PanoramaWideAngleOutlined, PartyMode, PermCameraMic, PermMedia,
  PhotoAlbumOutlined, PhotoCameraBackOutlined, PhotoCameraFrontOutlined,
  PhotoCameraOutlined, PhotoFilterOutlined, PhotoLibraryOutlined,
  PhotoOutlined, PhotoSizeSelectActualOutlined, PhotoSizeSelectLargeOutlined,
  PhotoSizeSelectSmallOutlined, PictureAsPdfOutlined, PortraitOutlined,
  ProductImage, ReceiptLong, RemoveRedEye, Rotate90DegreesCcw,
  RotateLeft, RotateRight, ShutterSpeedOutlined, SlideshowOutlined,
  Straighten, Style, SubdirectoryArrowLeft, SubdirectoryArrowRight,
  SwitchCameraOutlined, SwitchVideoOutlined, TagFacesOutlined,
  TextureOutlined, ThermostatOutlined, TimelapseOutlined,
  Timer10Outlined, Timer3Outlined, TimerOffOutlined, TimerOutlined,
  ToysOutlined, TransformOutlined, TuneOutlined, Tungsten,
  ViewComfyOutlined, ViewCompactOutlined, VignetteOutlined,
  Vrpano, WbAutoOutlined, WbCloudyOutlined, WbIncandescentOutlined,
  WbIridescentOutlined, WbShadeOutlined, WbSunnyOutlined,
  WbTwilightOutlined, WbTwilightRoundedOutlined, WbTwilightSharpOutlined,
  WbTwilightTwoToneOutlined, AddAPhotoOutlined, AddPhotoAlternateOutlined,
  CollectionsOutlined, CollectionsBookmarkOutlined, FilterOutlined,
  Filter1Outlined, Filter2Outlined, Filter3Outlined, Filter4Outlined,
  Filter5Outlined, Filter6Outlined, Filter7Outlined, Filter8Outlined,
  Filter9Outlined, Filter9PlusOutlined, FilterBAndWOutlinedOutlined,
  FilterCenterFocusOutlinedOutlined, FilterDramaOutlinedOutlined,
  FilterFramesOutlinedOutlined, FilterHdrOutlinedOutlined,
  FilterListOutlined, FilterListOffOutlined, FilterNoneOutlinedOutlined,
  FilterTiltShiftOutlinedOutlined, FilterVintageOutlinedOutlined,
  FlareOutlinedOutlined, GradientOutlinedOutlined, GrainOutlined,
  GridOffOutlined, GridOnOutlined, HdrOffOutlined, HdrOnOutlined,
  HdrPlusOutlined, HdrStrongOutlined, HdrWeakOutlined, HevcOutlined,
  HideImageOutlined, ImageAspectRatioOutlined, ImageNotSupportedOutlined,
  ImageSearchOutlined, IsoOutlined, LandscapeOutlined, LeakAddOutlined,
  LeakRemoveOutlined, LensOutlined, LinkedCameraOutlined,
  Looks3OutlinedOutlined, Looks4OutlinedOutlined, Looks5OutlinedOutlined,
  Looks6OutlinedOutlined, LooksOneOutlinedOutlined, LooksTwoOutlinedOutlined,
  LooksOutlinedOutlined, LoupeOutlined, MicExternalOffOutlined,
  MicExternalOnOutlined, MonochromePhotosOutlined, MotionPhotosAutoOutlined,
  MotionPhotosOffOutlined, MotionPhotosOnOutlined, MotionPhotosPauseOutlined,
  MovieOutlined, MovieCreationOutlined, MovieFilterOutlined, MpOutlined,
  MusicNoteOutlined, MusicOffOutlined, NatureOutlinedOutlined,
  NaturePeopleOutlinedOutlined, NavigateBeforeOutlined, NavigateNextOutlined,
  PaletteOutlinedOutlined, PanoramaOutlinedOutlined, PanoramaFishEyeOutlinedOutlined,
  PanoramaHorizontalOutlinedOutlined, PanoramaVerticalOutlinedOutlined,
  PanoramaWideAngleOutlinedOutlined, PartyModeOutlined, PermCameraMicOutlined,
  PermMediaOutlined, PhotoAlbumOutlinedOutlined, PhotoCameraBackOutlinedOutlined,
  PhotoCameraFrontOutlinedOutlined, PhotoCameraOutlinedOutlined,
  PhotoFilterOutlinedOutlined, PhotoLibraryOutlinedOutlined,
  PhotoOutlinedOutlined, PhotoSizeSelectActualOutlinedOutlined,
  PhotoSizeSelectLargeOutlinedOutlined, PhotoSizeSelectSmallOutlinedOutlined,
  PictureAsPdfOutlinedOutlined, PortraitOutlinedOutlined, ProductImageOutlined,
  ReceiptLongOutlined, RemoveRedEyeOutlined, Rotate90DegreesCcwOutlined,
  RotateLeftOutlined, RotateRightOutlined, ShutterSpeedOutlinedOutlined,
  SlideshowOutlinedOutlined, StraightenOutlined, StyleOutlined,
  SubdirectoryArrowLeftOutlined, SubdirectoryArrowRightOutlined,
  SwitchCameraOutlinedOutlined, SwitchVideoOutlinedOutlined,
  TagFacesOutlinedOutlined, TextureOutlinedOutlined, ThermostatOutlinedOutlined,
  TimelapseOutlinedOutlined, Timer10OutlinedOutlined, Timer3OutlinedOutlined,
  TimerOffOutlinedOutlined, TimerOutlinedOutlined, ToysOutlinedOutlined,
  TransformOutlinedOutlined, TuneOutlinedOutlined, TungstenOutlined,
  ViewComfyOutlinedOutlined, ViewCompactOutlinedOutlined,
  VignetteOutlinedOutlined, VrpanoOutlined, WbAutoOutlinedOutlined,
  WbCloudyOutlinedOutlined, WbIncandescentOutlinedOutlined,
  WbIridescentOutlinedOutlined, WbShadeOutlinedOutlined,
  WbSunnyOutlinedOutlined, WbTwilightOutlinedOutlined,
  WbTwilightRoundedOutlinedOutlined, WbTwilightSharpOutlinedOutlined,
  WbTwilightTwoToneOutlinedOutlined
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import VideoCall from '../../components/VideoCall';
import axios from 'axios';

// Sample chat data
const sampleChats = [
  {
    id: 1,
    name: 'أحمد محمد',
    nameEn: 'Ahmed Mohammed',
    avatar: '/avatars/ahmed.jpg',
    lastMessage: 'مرحباً، كيف حالك؟',
    lastMessageTime: '10:30',
    unreadCount: 2,
    isOnline: true,
    isTyping: false,
    status: 'online'
  },
  {
    id: 2,
    name: 'سارة علي',
    nameEn: 'Sara Ali',
    avatar: '/avatars/sara.jpg',
    lastMessage: 'تم إرسال الملف',
    lastMessageTime: '09:15',
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    status: 'offline',
    lastSeen: 'منذ ساعة'
  },
  {
    id: 3,
    name: 'خالد عبدالله',
    nameEn: 'Khaled Abdullah',
    avatar: '/avatars/khaled.jpg',
    lastMessage: 'نلتقي غداً إن شاء الله',
    lastMessageTime: 'أمس',
    unreadCount: 1,
    isOnline: true,
    isTyping: true,
    status: 'online'
  },
  {
    id: 4,
    name: 'فريق المبيعات',
    nameEn: 'Sales Team',
    avatar: '/avatars/team.jpg',
    lastMessage: 'محمد: تم إغلاق الصفقة!',
    lastMessageTime: '08:45',
    unreadCount: 5,
    isOnline: true,
    isTyping: false,
    status: 'online',
    isGroup: true,
    members: 8
  },
  {
    id: 5,
    name: 'منى سعيد',
    nameEn: 'Mona Saeed',
    avatar: '/avatars/mona.jpg',
    lastMessage: 'شكراً جزيلاً',
    lastMessageTime: 'الإثنين',
    unreadCount: 0,
    isOnline: false,
    isTyping: false,
    status: 'offline',
    lastSeen: 'منذ يومين'
  }
];

// Sample messages
const sampleMessages = [
  {
    id: 1,
    senderId: 1,
    text: 'مرحباً، كيف حالك؟',
    time: '10:30',
    date: '2026-06-28',
    isRead: true,
    type: 'text',
    status: 'read'
  },
  {
    id: 2,
    senderId: 'me',
    text: 'أهلاً أحمد، بخير الحمد لله. وأنت؟',
    time: '10:31',
    date: '2026-06-28',
    isRead: true,
    type: 'text',
    status: 'read'
  },
  {
    id: 3,
    senderId: 1,
    text: 'بخير، هل يمكننا إجراء مكالمة فيديو لمناقشة المشروع؟',
    time: '10:32',
    date: '2026-06-28',
    isRead: false,
    type: 'text',
    status: 'delivered'
  }
];

const ChatPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [chats, setChats] = useState(sampleChats);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState(sampleMessages);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);
  const [callRoomName, setCallRoomName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatInfoOpen, setChatInfoOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recordingInterval = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(prev => {
        const statuses = ['connected', 'connected', 'connected', 'slow', 'connected'];
        return statuses[Math.floor(Math.random() * statuses.length)];
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle typing indicator
  useEffect(() => {
    if (newMessage.length > 0) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [newMessage]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    if (isMobile) setDrawerOpen(false);

    // Mark messages as read
    setChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    const message = {
      id: Date.now(),
      senderId: 'me',
      text: newMessage,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      isRead: false,
      type: selectedFiles.length > 0 ? 'file' : 'text',
      files: selectedFiles,
      replyTo: replyTo,
      status: 'sending'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setSelectedFiles([]);
    setReplyTo(null);

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, status: 'delivered' } : m
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, status: 'read' } : m
      ));
    }, 3000);
  };

  const handleStartVideoCall = () => {
    if (!selectedChat) {
      setSnackbar({ open: true, message: t('chat.selectChatFirst'), severity: 'warning' });
      return;
    }
    const roomName = `video-${selectedChat.id}-${Date.now()}`;
    setCallRoomName(roomName);
    setVideoCallOpen(true);
  };

  const handleStartVoiceCall = () => {
    if (!selectedChat) {
      setSnackbar({ open: true, message: t('chat.selectChatFirst'), severity: 'warning' });
      return;
    }
    const roomName = `audio-${selectedChat.id}-${Date.now()}`;
    setCallRoomName(roomName);
    setVoiceCallOpen(true);
  };

  const handleStartGroupCall = (callType) => {
    const roomName = `group-${callType}-${Date.now()}`;
    setCallRoomName(roomName);
    if (callType === 'video') {
      setVideoCallOpen(true);
    } else {
      setVoiceCallOpen(true);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setSnackbar({ open: true, message: t('chat.filesSelected', { count: files.length }), severity: 'info' });
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    clearInterval(recordingInterval.current);
    setRecordingTime(0);
    setSnackbar({ open: true, message: t('chat.voiceSent'), severity: 'success' });
  };

  const handleMessageMenuOpen = (event, message) => {
    setMessageMenuAnchor(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
    setSelectedMessage(null);
  };

  const handleReply = () => {
    setReplyTo(selectedMessage);
    handleMessageMenuClose();
  };

  const handleForward = () => {
    setForwardDialogOpen(true);
    handleMessageMenuClose();
  };

  const handleDeleteMessage = () => {
    setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
    handleMessageMenuClose();
    setSnackbar({ open: true, message: t('chat.messageDeleted'), severity: 'success' });
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(selectedMessage.text);
    handleMessageMenuClose();
    setSnackbar({ open: true, message: t('chat.messageCopied'), severity: 'success' });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Speed dial actions
  const speedDialActions = [
    { icon: <Videocam />, name: t('chat.newVideoCall'), action: () => handleStartGroupCall('video'), color: '#1976d2' },
    { icon: <Phone />, name: t('chat.newVoiceCall'), action: () => handleStartGroupCall('audio'), color: '#388e3c' },
    { icon: <PersonAdd />, name: t('chat.newChat'), action: () => setSnackbar({ open: true, message: t('chat.featureComingSoon'), severity: 'info' }), color: '#f57c00' },
    { icon: <GroupAdd />, name: t('chat.newGroup'), action: () => setSnackbar({ open: true, message: t('chat.featureComingSoon'), severity: 'info' }), color: '#7b1fa2' },
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.100' }}>
      {/* Connection Status Bar */}
      {connectionStatus !== 'connected' && (
        <Box sx={{
          bgcolor: connectionStatus === 'slow' ? 'warning.dark' : 'error.dark',
          color: 'white',
          py: 0.5,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}>
          {connectionStatus === 'slow' ? (
            <><SignalCellularConnectedNoInternet0Bar fontSize="small" /> {t('chat.slowConnection')}</>
          ) : (
            <><WifiOff fontSize="small" /> {t('chat.noConnection')}</>
          )}
        </Box>
      )}

      <Grid container sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Sidebar - Chat List */}
        {(!isMobile || !selectedChat) && (
          <Grid item xs={12} md={4} lg={3} sx={{
            height: '100%',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Sidebar Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  {t('chat.title')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={t('chat.newVideoCall')}>
                    <IconButton color="primary" onClick={() => handleStartGroupCall('video')}>
                      <Videocam />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('chat.newVoiceCall')}>
                    <IconButton color="success" onClick={() => handleStartGroupCall('audio')}>
                      <Phone />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <TextField
                fullWidth
                size="small"
                placeholder={t('chat.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchQuery && (
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <Close fontSize="small" />
                    </IconButton>
                  )
                }}
              />
            </Box>

            {/* Chat List */}
            <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
              {filteredChats.map((chat) => (
                <ListItem
                  key={chat.id}
                  disablePadding
                  secondaryAction={
                    chat.unreadCount > 0 && (
                      <Badge
                        badgeContent={chat.unreadCount}
                        color="primary"
                        sx={{ mr: 2 }}
                      />
                    )
                  }
                >
                  <ListItemButton
                    selected={selectedChat?.id === chat.id}
                    onClick={() => handleChatSelect(chat)}
                    sx={{
                      borderLeft: selectedChat?.id === chat.id ? 3 : 0,
                      borderColor: 'primary.main',
                      bgcolor: selectedChat?.id === chat.id ? 'primary.light' : 'inherit'
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={chat.isOnline ? 'success' : 'grey'}
                      >
                        <Avatar src={chat.avatar} alt={chat.name}>
                          {chat.name[0]}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" noWrap>
                            {chat.name}
                          </Typography>
                          {chat.isGroup && (
                            <Chip size="small" label={chat.members} icon={<People fontSize="small" />} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                            {chat.isTyping ? (
                              <span style={{ color: '#1976d2', fontStyle: 'italic' }}>{t('chat.typing')}</span>
                            ) : (
                              chat.lastMessage
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {chat.lastMessageTime}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Grid>
        )}

        {/* Chat Area */}
        {selectedChat ? (
          <Grid item xs={12} md={8} lg={9} sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default'
          }}>
            {/* Chat Header */}
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar variant="dense">
                {isMobile && (
                  <IconButton edge="start" onClick={() => setSelectedChat(null)} sx={{ mr: 1 }}>
                    <ArrowBack />
                  </IconButton>
                )}

                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color={selectedChat.isOnline ? 'success' : 'grey'}
                >
                  <Avatar src={selectedChat.avatar} alt={selectedChat.name} />
                </Badge>

                <Box sx={{ ml: 2, flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedChat.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedChat.isTyping ? (
                      <span style={{ color: '#1976d2' }}>{t('chat.typing')}</span>
                    ) : selectedChat.isOnline ? (
                      t('chat.online')
                    ) : (
                      selectedChat.lastSeen || t('chat.offline')
                    )}
                  </Typography>
                </Box>

                {/* Call Buttons in Header */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={t('chat.voiceCall')}>
                    <IconButton color="success" onClick={handleStartVoiceCall}>
                      <Phone />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('chat.videoCall')}>
                    <IconButton color="primary" onClick={handleStartVideoCall}>
                      <Videocam />
                    </IconButton>
                  </Tooltip>
                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <MoreVert />
                  </IconButton>
                </Box>
              </Toolbar>
            </AppBar>

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
              {messages.map((message, index) => (
                <Fade key={message.id} in={true}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: message.senderId === 'me' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}>
                    <Paper
                      elevation={1}
                      sx={{
                        maxWidth: '70%',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: message.senderId === 'me' ? 'primary.light' : 'background.paper',
                        color: message.senderId === 'me' ? 'primary.contrastText' : 'text.primary',
                        position: 'relative',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: message.senderId === 'me' ? 'primary.main' : 'action.hover' }
                      }}
                      onContextMenu={(e) => handleMessageMenuOpen(e, message)}
                    >
                      {/* Reply indicator */}
                      {message.replyTo && (
                        <Box sx={{
                          p: 1,
                          mb: 1,
                          borderLeft: 3,
                          borderColor: 'divider',
                          bgcolor: 'rgba(0,0,0,0.05)',
                          borderRadius: 1
                        }}>
                          <Typography variant="caption" color="text.secondary">
                            {message.replyTo.text}
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="body1">{message.text}</Typography>

                      {/* Files */}
                      {message.files && message.files.map((file, idx) => (
                        <Box key={idx} sx={{
                          mt: 1,
                          p: 1,
                          bgcolor: 'rgba(0,0,0,0.05)',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <InsertDriveFile />
                          <Typography variant="caption">{file.name}</Typography>
                        </Box>
                      ))}

                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 0.5,
                        mt: 0.5
                      }}>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {message.time}
                        </Typography>
                        {message.senderId === 'me' && (
                          message.status === 'read' ? (
                            <DoneAll sx={{ fontSize: 14, color: 'success.main' }} />
                          ) : message.status === 'delivered' ? (
                            <DoneAll sx={{ fontSize: 14, opacity: 0.5 }} />
                          ) : (
                            <AccessTime sx={{ fontSize: 14, opacity: 0.5 }} />
                          )
                        )}
                      </Box>
                    </Paper>
                  </Box>
                </Fade>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Reply Preview */}
            {replyTo && (
              <Box sx={{
                p: 1,
                bgcolor: 'action.hover',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Reply sx={{ color: 'primary.main' }} />
                <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                  {replyTo.text}
                </Typography>
                <IconButton size="small" onClick={() => setReplyTo(null)}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <Box sx={{
                p: 1,
                bgcolor: 'action.hover',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 1,
                overflow: 'auto'
              }}>
                {selectedFiles.map((file, idx) => (
                  <Chip
                    key={idx}
                    label={file.name}
                    onDelete={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                    icon={<InsertDriveFile />}
                  />
                ))}
              </Box>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <Box sx={{
                p: 1,
                bgcolor: 'error.light',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
              }}>
                <Box sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  animation: 'pulse 1s infinite'
                }} />
                <Typography variant="body2" color="error.main" fontWeight="bold">
                  {formatTime(recordingTime)}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={handleStopRecording}
                  startIcon={<Send />}
                >
                  {t('chat.send')}
                </Button>
              </Box>
            )}

            {/* Input Area */}
            <Box sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <SpeedDial
                ariaLabel="SpeedDial"
                icon={<SpeedDialIcon icon={<Add />} openIcon={<Close />} />}
                onClose={() => setSpeedDialOpen(false)}
                onOpen={() => setSpeedDialOpen(true)}
                open={speedDialOpen}
                direction="up"
                FabProps={{ size: 'small' }}
              >
                {speedDialActions.map((action) => (
                  <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    onClick={action.action}
                    FabProps={{ sx: { bgcolor: action.color, color: 'white' } }}
                  />
                ))}
              </SpeedDial>

              <IconButton onClick={() => fileInputRef.current?.click()}>
                <AttachFile />
              </IconButton>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                multiple
                onChange={handleFileSelect}
              />

              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder={isRecording ? t('chat.recording') : t('chat.typeMessage')}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isRecording}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowEmoji(!showEmoji)}>
                        <EmojiEmotions />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {newMessage.trim() || selectedFiles.length > 0 ? (
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                  <Send />
                </IconButton>
              ) : (
                <IconButton
                  color={isRecording ? 'error' : 'default'}
                  onMouseDown={handleStartRecording}
                  onMouseUp={isRecording ? handleStopRecording : undefined}
                  onTouchStart={handleStartRecording}
                  onTouchEnd={isRecording ? handleStopRecording : undefined}
                >
                  {isRecording ? <Mic /> : <KeyboardVoice />}
                </IconButton>
              )}
            </Box>
          </Grid>
        ) : (
          <Grid item xs={12} md={8} lg={9} sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.50'
          }}>
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <ChatIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {t('chat.selectChat')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('chat.selectChatDescription')}
              </Typography>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Videocam />}
                  onClick={() => handleStartGroupCall('video')}
                >
                  {t('chat.newVideoCall')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Phone />}
                  onClick={() => handleStartGroupCall('audio')}
                >
                  {t('chat.newVoiceCall')}
                </Button>
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Video Call Dialog */}
      <VideoCall
        open={videoCallOpen}
        onClose={() => setVideoCallOpen(false)}
        roomName={callRoomName}
        participantName={selectedChat?.name || 'User'}
        callType="video"
      />

      {/* Voice Call Dialog */}
      <VideoCall
        open={voiceCallOpen}
        onClose={() => setVoiceCallOpen(false)}
        roomName={callRoomName}
        participantName={selectedChat?.name || 'User'}
        callType="audio"
      />

      {/* Message Context Menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMessageMenuClose}
      >
        <MenuItem onClick={handleReply}>
          <ListItemIcon><Reply fontSize="small" /></ListItemIcon>
          <ListItemText>{t('chat.reply')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleForward}>
          <ListItemIcon><Forward fontSize="small" /></ListItemIcon>
          <ListItemText>{t('chat.forward')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopyMessage}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          <ListItemText>{t('chat.copy')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteMessage} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{t('chat.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Chat Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { setChatInfoOpen(true); setAnchorEl(null); }}>
          <ListItemIcon><Info fontSize="small" /></ListItemIcon>
          <ListItemText>{t('chat.info')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><PushPin fontSize="small" /></ListItemIcon>
          <ListItemText>{t('chat.pin')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><NotificationsOff fontSize="small" /></ListItemIcon>
          <ListItemText>{t('chat.mute')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Block fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{t('chat.block')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{t('chat.deleteChat')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Chat Info Dialog */}
      <Dialog open={chatInfoOpen} onClose={() => setChatInfoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info />
            {t('chat.chatInfo')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedChat && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Avatar src={selectedChat.avatar} sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }} />
              <Typography variant="h6">{selectedChat.name}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedChat.nameEn}</Typography>
              <Chip
                label={selectedChat.isOnline ? t('chat.online') : t('chat.offline')}
                color={selectedChat.isOnline ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatInfoOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog open={forwardDialogOpen} onClose={() => setForwardDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('chat.forwardTo')}</DialogTitle>
        <DialogContent>
          <List>
            {chats.map(chat => (
              <ListItemButton key={chat.id} onClick={() => {
                setSnackbar({ open: true, message: t('chat.messageForwarded'), severity: 'success' });
                setForwardDialogOpen(false);
              }}>
                <ListItemAvatar>
                  <Avatar src={chat.avatar} />
                </ListItemAvatar>
                <ListItemText primary={chat.name} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatPage;
