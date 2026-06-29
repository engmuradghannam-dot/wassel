import React from 'react';
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const ROOM_TYPES   = [{value:'single',labelAr:'فردية',label:'Single'},{value:'double',labelAr:'مزدوجة',label:'Double'},{value:'suite',labelAr:'جناح',label:'Suite'},{value:'family',labelAr:'عائلية',label:'Family'},{value:'deluxe',labelAr:'ديلوكس',label:'Deluxe'},{value:'studio',labelAr:'استوديو',label:'Studio'},{value:'apartment',labelAr:'شقة',label:'Apartment'}];
const ROOM_STATUS  = [{value:'available',labelAr:'متاحة',label:'Available'},{value:'occupied',labelAr:'مشغولة',label:'Occupied'},{value:'maintenance',labelAr:'صيانة',label:'Maintenance'},{value:'cleaning',labelAr:'تنظيف',label:'Cleaning'}];

export default function RoomsPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="rooms" icon="🛏️" color="#ff6d00"
      title={AR?'الغرف':'Rooms'}
      newLabel={AR?'إضافة غرفة':'New Room'}
      emptyForm={{ number:'', type:'double', floor:1, capacity:2, pricePerNight:0, status:'available', amenities:'', description:'' }}
      columns={[
        { key:'number', label:AR?'رقم الغرفة':'Room No', type:'avatar' },
        { key:'type',   label:AR?'النوع':'Type', render:(r,ar)=>{const t=ROOM_TYPES.find(x=>x.value===r.type); return t?(ar?t.labelAr:t.label):r.type;} },
        { key:'floor',  label:AR?'الطابق':'Floor' },
        { key:'capacity',label:AR?'السعة':'Capacity' },
        { key:'pricePerNight', label:AR?'السعر / ليلة':'Price/Night', type:'money' },
        { key:'status', label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'number',       label:AR?'رقم الغرفة *':'Room Number *', required:true, sm:4 },
        { key:'type',         label:AR?'النوع':'Type', type:'select', options:ROOM_TYPES, sm:4 },
        { key:'floor',        label:AR?'الطابق':'Floor', type:'number', sm:4 },
        { key:'capacity',     label:AR?'السعة (أشخاص)':'Capacity', type:'number', sm:4 },
        { key:'pricePerNight',label:AR?'السعر / ليلة (ر.س)':'Price / Night', type:'number', sm:4, endAdornment:AR?'ر.س':'SAR' },
        { key:'status',       label:AR?'الحالة':'Status', type:'select', options:ROOM_STATUS, sm:4 },
        { key:'amenities',    label:AR?'المرافق والخدمات':'Amenities', sm:12 },
        { key:'description',  label:AR?'الوصف':'Description', type:'textarea', sm:12 },
      ]}
    />
  );
}
