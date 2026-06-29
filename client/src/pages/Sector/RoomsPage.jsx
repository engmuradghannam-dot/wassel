import React from 'react';
import { Chip, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const statusColor = { available:'success', occupied:'error', maintenance:'warning', cleaning:'info' };
const statusAr    = { available:'متاح', occupied:'مشغول', maintenance:'صيانة', cleaning:'تنظيف' };
const statusEn    = { available:'Available', occupied:'Occupied', maintenance:'Maintenance', cleaning:'Cleaning' };
const typeAr      = { single:'مفردة', double:'مزدوجة', suite:'جناح', family:'عائلية', deluxe:'ديلوكس', presidential:'رئاسي' };

const RoomsPage = () => {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const config = {
    endpoint:  '/api/rooms',
    icon:      '🛏️',
    title:     AR ? 'الغرف' : 'Rooms',
    addLabel:  AR ? 'غرفة جديدة' : 'New Room',
    itemLabel: AR ? 'غرفة' : 'room',
    activeField: 'isActive',
    searchFields: ['number','type'],
    dialogSize: 'sm',
    emptyForm: { number:'', type:'single', floor:1, capacity:2, pricePerNight:0, status:'available', amenities:'', notes:'', isActive:true },
    validate: (f, AR) => {
      if (!f.number?.trim()) return AR?'رقم الغرفة مطلوب':'Room number required';
      if (!f.pricePerNight || f.pricePerNight<=0) return AR?'السعر مطلوب':'Price required';
    },
    columns: [
      { key:'number', label: AR?'رقم الغرفة':'Room #',
        render:(item,{sectorColor})=>(
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            <Box sx={{ width:32, height:32, borderRadius:1, bgcolor:`${sectorColor}15`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:sectorColor, fontWeight:700, fontSize:13 }}>
              {item.number}
            </Box>
            <Typography variant="body2" fontWeight={600}>{item.number}</Typography>
          </Box>
        )
      },
      { key:'type', label: AR?'النوع':'Type',
        render:(item,{AR})=><Chip label={AR?typeAr[item.type]:item.type} size="small" sx={{ fontSize:'0.7rem' }}/>
      },
      { key:'floor',         label: AR?'الطابق':'Floor',
        render:(item)=><Typography variant="body2">{item.floor||1}</Typography>
      },
      { key:'capacity',      label: AR?'السعة':'Capacity',
        render:(item)=><Typography variant="body2">{item.capacity} 👥</Typography>
      },
      { key:'pricePerNight', label: AR?'السعر/ليلة':'Price/Night',
        render:(item)=><Typography variant="body2" fontWeight={600}>{(item.pricePerNight||0).toLocaleString()} {AR?'ر.س':'SAR'}</Typography>
      },
      { key:'status', label: AR?'الحالة':'Status',
        render:(item,{AR})=>(
          <Chip label={AR?statusAr[item.status]:statusEn[item.status]}
            color={statusColor[item.status]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/>
        )
      },
    ],
    formTabs: [{
      label: AR?'بيانات الغرفة':'Room Details',
      fields: [
        { key:'number',        label: AR?'رقم الغرفة *':'Room Number *', width:6, required:true },
        { key:'type',          label: AR?'نوع الغرفة':'Room Type',   width:6, type:'select',
          options:[
            {value:'single',label:AR?'مفردة':'Single'},{value:'double',label:AR?'مزدوجة':'Double'},
            {value:'suite',label:AR?'جناح':'Suite'},{value:'family',label:AR?'عائلية':'Family'},
            {value:'deluxe',label:AR?'ديلوكس':'Deluxe'},{value:'presidential',label:AR?'رئاسي':'Presidential'}
          ]
        },
        { key:'floor',         label: AR?'رقم الطابق':'Floor',          width:4, type:'number' },
        { key:'capacity',      label: AR?'السعة (أشخاص)':'Capacity',    width:4, type:'number' },
        { key:'pricePerNight', label: AR?'السعر/ليلة (ر.س)':'Price/Night (SAR)', width:4, type:'number' },
        { key:'status',        label: AR?'الحالة':'Status', width:6, type:'select',
          options:[
            {value:'available',label:AR?'متاح':'Available'},{value:'occupied',label:AR?'مشغول':'Occupied'},
            {value:'maintenance',label:AR?'صيانة':'Maintenance'},{value:'cleaning',label:AR?'تنظيف':'Cleaning'}
          ]
        },
        { key:'amenities',     label: AR?'المرافق (مفصولة بفاصلة)':'Amenities (comma-separated)', width:12, type:'textarea', rows:2 },
        { key:'notes',         label: AR?'ملاحظات':'Notes', width:12, type:'textarea' },
      ]
    }]
  };

  return <SectorPage config={config} />;
};
export default RoomsPage;
