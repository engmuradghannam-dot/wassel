import React from 'react';
import { Chip, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const statusColor = { pending:'default', confirmed:'info', checked_in:'success', checked_out:'secondary', cancelled:'error', no_show:'warning' };
const statusAr    = { pending:'معلق', confirmed:'مؤكد', checked_in:'دخل', checked_out:'خرج', cancelled:'ملغى', no_show:'لم يحضر' };

const BookingsPage = () => {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const industry = localStorage.getItem('userIndustry') || 'hotel';

  const config = {
    endpoint:  '/api/bookings',
    icon:      industry === 'furnished_apartments' ? '🏠' : '📅',
    title:     AR ? 'الحجوزات' : 'Bookings',
    addLabel:  AR ? 'حجز جديد' : 'New Booking',
    itemLabel: AR ? 'حجز' : 'booking',
    searchFields: ['bookingNumber','guest.name','guest.phone'],
    dialogSize: 'md',
    emptyForm: {
      'guest.name':'','guest.phone':'','guest.email':'','guest.nationality':'SA',
      'guest.nationalId':'', room:'', checkIn:'', checkOut:'',
      adults:1, children:0, pricePerNight:0, discount:0,
      status:'pending', paymentStatus:'unpaid', source:'direct', notes:''
    },
    validate: (f, AR) => {
      if (!f['guest.name']?.trim()) return AR?'اسم الضيف مطلوب':'Guest name required';
      if (!f['guest.phone']?.trim()) return AR?'رقم الهاتف مطلوب':'Phone required';
      if (!f.checkIn) return AR?'تاريخ الدخول مطلوب':'Check-in date required';
      if (!f.checkOut) return AR?'تاريخ الخروج مطلوب':'Check-out date required';
    },
    filter: (items, search) => {
      if (!search) return items;
      const q = search.toLowerCase();
      return items.filter(i =>
        i.guest?.name?.toLowerCase().includes(q) ||
        i.guest?.phone?.includes(q) ||
        i.bookingNumber?.toLowerCase().includes(q)
      );
    },
    columns: [
      { key:'bookingNumber', label: AR?'رقم الحجز':'Booking #',
        render:(item)=>(
          <Typography variant="body2" fontWeight={600} sx={{ fontFamily:'monospace' }}>
            {item.bookingNumber||'—'}
          </Typography>
        )
      },
      { key:'guest', label: AR?'الضيف':'Guest',
        render:(item)=>(
          <Box>
            <Typography variant="body2" fontWeight={600}>{item.guest?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{item.guest?.phone}</Typography>
          </Box>
        )
      },
      { key:'checkIn',  label: AR?'الدخول':'Check-In',
        render:(item)=><Typography variant="body2">{item.checkIn ? new Date(item.checkIn).toLocaleDateString('ar-SA') : '—'}</Typography>
      },
      { key:'checkOut', label: AR?'الخروج':'Check-Out',
        render:(item)=><Typography variant="body2">{item.checkOut ? new Date(item.checkOut).toLocaleDateString('ar-SA') : '—'}</Typography>
      },
      { key:'totalNights', label: AR?'الليالي':'Nights',
        render:(item)=><Typography variant="body2" fontWeight={600}>{item.totalNights||'—'}</Typography>
      },
      { key:'netAmount', label: AR?'الإجمالي':'Total',
        render:(item)=><Typography variant="body2" fontWeight={700}>{(item.netAmount||0).toLocaleString()} {AR?'ر.س':'SAR'}</Typography>
      },
      { key:'status', label: AR?'الحالة':'Status',
        render:(item,{AR})=>(
          <Chip label={AR?statusAr[item.status]:item.status}
            color={statusColor[item.status]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/>
        )
      },
    ],
    formTabs: [
      {
        label: AR?'بيانات الضيف':'Guest Info',
        fields: [
          { key:'guest.name',        label: AR?'اسم الضيف *':'Guest Name *', width:6, required:true },
          { key:'guest.phone',       label: AR?'رقم الهاتف *':'Phone *', width:6, required:true },
          { key:'guest.email',       label: AR?'البريد الإلكتروني':'Email', width:6, type:'email' },
          { key:'guest.nationality', label: AR?'الجنسية':'Nationality', width:6 },
          { key:'guest.nationalId',  label: AR?'رقم الهوية / الجواز':'National ID / Passport', width:6 },
        ]
      },
      {
        label: AR?'تفاصيل الحجز':'Booking Details',
        fields: [
          { key:'checkIn',      label: AR?'تاريخ الدخول *':'Check-In *',  width:6, type:'date', required:true },
          { key:'checkOut',     label: AR?'تاريخ الخروج *':'Check-Out *', width:6, type:'date', required:true },
          { key:'adults',       label: AR?'عدد البالغين':'Adults',    width:4, type:'number' },
          { key:'children',     label: AR?'عدد الأطفال':'Children',   width:4, type:'number' },
          { key:'pricePerNight',label: AR?'السعر/ليلة':'Price/Night', width:4, type:'number' },
          { key:'discount',     label: AR?'الخصم':'Discount',         width:4, type:'number' },
          { key:'status',       label: AR?'حالة الحجز':'Status', width:4, type:'select',
            options:[
              {value:'pending',label:AR?'معلق':'Pending'},
              {value:'confirmed',label:AR?'مؤكد':'Confirmed'},
              {value:'checked_in',label:AR?'دخل':'Checked In'},
              {value:'checked_out',label:AR?'خرج':'Checked Out'},
              {value:'cancelled',label:AR?'ملغى':'Cancelled'},
            ]
          },
          { key:'source',       label: AR?'المصدر':'Source', width:4, type:'select',
            options:[
              {value:'direct',label:AR?'مباشر':'Direct'},
              {value:'booking.com',label:'Booking.com'},
              {value:'airbnb',label:'Airbnb'},
              {value:'phone',label:AR?'هاتف':'Phone'},
              {value:'walk_in',label:AR?'حضور مباشر':'Walk-in'},
            ]
          },
          { key:'notes', label: AR?'ملاحظات':'Notes', width:12, type:'textarea' },
        ]
      }
    ]
  };

  return <SectorPage config={config} />;
};
export default BookingsPage;
