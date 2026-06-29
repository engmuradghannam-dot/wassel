import React from 'react';
import { Chip, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const statusColor = { available:'success', rented:'primary', sold:'secondary', maintenance:'warning', reserved:'info' };
const statusAr    = { available:'متاح', rented:'مؤجر', sold:'مباع', maintenance:'صيانة', reserved:'محجوز' };

const PropertiesPage = () => {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const config = {
    endpoint: '/api/properties',
    icon: '🏘️',
    title: AR ? 'العقارات' : 'Properties',
    addLabel: AR ? 'عقار جديد' : 'New Property',
    itemLabel: AR ? 'عقار' : 'property',
    activeField: 'isActive',
    searchFields: ['title','address','district','city'],
    dialogSize: 'md',
    emptyForm: { title:'', type:'apartment', purpose:'rent', address:'', district:'', city:'الرياض', area:0, rooms:0, bathrooms:0, price:0, rentPerMonth:0, status:'available', ownerName:'', ownerPhone:'', commissionPct:2.5, notes:'' },
    validate: (f, AR) => { if (!f.title?.trim()) return AR?'عنوان العقار مطلوب':'Property title required'; },
    columns: [
      { key:'title', label: AR?'العقار':'Property', render:(item)=>(
        <Box><Typography variant="body2" fontWeight={600}>{item.title}</Typography>
        <Typography variant="caption" color="text.secondary">{item.district}, {item.city}</Typography></Box>
      )},
      { key:'type', label: AR?'النوع':'Type', render:(item)=><Chip label={AR?{apartment:'شقة',villa:'فيلا',office:'مكتب',shop:'محل',land:'أرض'}[item.type]||item.type:item.type} size="small" sx={{ fontSize:'0.7rem' }}/> },
      { key:'area', label: AR?'المساحة (م²)':'Area (m²)', render:(item)=><Typography variant="body2">{item.area||'—'} {AR?'م²':'m²'}</Typography> },
      { key:'rentPerMonth', label: AR?'الإيجار/شهر':'Rent/Month', render:(item)=><Typography variant="body2" fontWeight={600}>{(item.rentPerMonth||0).toLocaleString()} {AR?'ر.س':'SAR'}</Typography> },
      { key:'status', label: AR?'الحالة':'Status', render:(item,{AR})=><Chip label={AR?statusAr[item.status]:item.status} color={statusColor[item.status]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/> },
    ],
    formTabs: [
      { label: AR?'تفاصيل العقار':'Property Details', fields: [
        { key:'title',       label: AR?'عنوان العقار *':'Title *', width:12, required:true },
        { key:'type',        label: AR?'نوع العقار':'Type', width:4, type:'select', options:[
          {value:'apartment',label:AR?'شقة':'Apartment'},{value:'villa',label:AR?'فيلا':'Villa'},
          {value:'office',label:AR?'مكتب':'Office'},{value:'shop',label:AR?'محل':'Shop'},
          {value:'land',label:AR?'أرض':'Land'},{value:'building',label:AR?'مبنى':'Building'}
        ]},
        { key:'purpose', label: AR?'الغرض':'Purpose', width:4, type:'select', options:[{value:'rent',label:AR?'إيجار':'Rent'},{value:'sale',label:AR?'بيع':'Sale'},{value:'both',label:AR?'كلاهما':'Both'}] },
        { key:'status',  label: AR?'الحالة':'Status', width:4, type:'select', options:[{value:'available',label:AR?'متاح':'Available'},{value:'rented',label:AR?'مؤجر':'Rented'},{value:'sold',label:AR?'مباع':'Sold'},{value:'reserved',label:AR?'محجوز':'Reserved'}] },
        { key:'area',    label: AR?'المساحة (م²)':'Area (m²)', width:3, type:'number' },
        { key:'rooms',   label: AR?'غرف النوم':'Bedrooms', width:3, type:'number' },
        { key:'bathrooms',label: AR?'دورات المياه':'Bathrooms', width:3, type:'number' },
        { key:'floors',  label: AR?'الطوابق':'Floors', width:3, type:'number' },
        { key:'rentPerMonth', label: AR?'الإيجار الشهري (ر.س)':'Monthly Rent', width:4, type:'number' },
        { key:'price',   label: AR?'سعر البيع (ر.س)':'Sale Price', width:4, type:'number' },
        { key:'commissionPct', label: AR?'العمولة %':'Commission %', width:4, type:'number' },
        { key:'address', label: AR?'العنوان التفصيلي':'Address', width:6 },
        { key:'district',label: AR?'الحي':'District', width:3 },
        { key:'city',    label: AR?'المدينة':'City', width:3 },
        { key:'notes',   label: AR?'ملاحظات':'Notes', width:12, type:'textarea' },
      ]},
      { label: AR?'بيانات المالك':'Owner Info', fields: [
        { key:'ownerName',      label: AR?'اسم المالك':'Owner Name', width:6 },
        { key:'ownerPhone',     label: AR?'هاتف المالك':'Owner Phone', width:6 },
        { key:'ownerNationalId',label: AR?'هوية المالك':'Owner National ID', width:6 },
      ]}
    ]
  };
  return <SectorPage config={config} />;
};
export default PropertiesPage;
