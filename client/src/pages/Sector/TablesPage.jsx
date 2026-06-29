import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const STATUS=[{value:'available',labelAr:'متاحة',label:'Available'},{value:'occupied',labelAr:'مشغولة',label:'Occupied'},{value:'reserved',labelAr:'محجوزة',label:'Reserved'},{value:'cleaning',labelAr:'تنظيف',label:'Cleaning'}];

export default function TablesPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="tables" icon="🍽️" color="#f57c00"
      title={AR?'الطاولات':'Tables'}
      newLabel={AR?'إضافة طاولة':'Add Table'}
      emptyForm={{ number:'',capacity:4,location:'',status:'available' }}
      columns={[
        { key:'number',   label:AR?'رقم الطاولة':'Table No', type:'avatar' },
        { key:'capacity', label:AR?'السعة':'Capacity' },
        { key:'location', label:AR?'الموقع':'Location' },
        { key:'status',   label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'number',   label:AR?'رقم الطاولة *':'Table Number *', required:true, sm:4 },
        { key:'capacity', label:AR?'السعة (أشخاص)':'Capacity', type:'number', sm:4 },
        { key:'location', label:AR?'القسم / الموقع':'Location/Section', sm:4 },
        { key:'status',   label:AR?'الحالة':'Status', type:'select', options:STATUS, sm:6 },
      ]}
    />
  );
}
