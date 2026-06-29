import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const TYPES  = [{value:'apartment',labelAr:'شقة',label:'Apartment'},{value:'villa',labelAr:'فيلا',label:'Villa'},{value:'office',labelAr:'مكتب',label:'Office'},{value:'shop',labelAr:'محل',label:'Shop'},{value:'warehouse',labelAr:'مستودع',label:'Warehouse'},{value:'land',labelAr:'أرض',label:'Land'},{value:'building',labelAr:'عمارة',label:'Building'},{value:'studio',labelAr:'استوديو',label:'Studio'}];
const STATUS = [{value:'available',labelAr:'متاح',label:'Available'},{value:'rented',labelAr:'مؤجّر',label:'Rented'},{value:'sold',labelAr:'مباع',label:'Sold'},{value:'maintenance',labelAr:'صيانة',label:'Maintenance'},{value:'reserved',labelAr:'محجوز',label:'Reserved'}];

export default function PropertiesPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="properties" icon="🏘️" color="#4e342e"
      title={AR?'العقارات':'Properties'}
      newLabel={AR?'إضافة عقار':'Add Property'}
      emptyForm={{ name:'',type:'apartment',status:'available',address:'',district:'',city:'الرياض',area:0,floor:0,rooms:0,bathrooms:0,rentPrice:0,salePrice:0,deedNo:'',features:'',description:'' }}
      columns={[
        { key:'name',      label:AR?'العقار':'Property', type:'avatar' },
        { key:'propNo',    label:AR?'رقم العقار':'Prop No' },
        { key:'type',      label:AR?'النوع':'Type', render:(r,ar)=>{ const tp=TYPES.find(x=>x.value===r.type); return tp?(ar?tp.labelAr:tp.label):r.type; } },
        { key:'area',      label:AR?'المساحة م²':'Area m²' },
        { key:'rentPrice', label:AR?'الإيجار':'Rent', type:'money' },
        { key:'city',      label:AR?'المدينة':'City' },
        { key:'status',    label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'name',      label:AR?'اسم / وصف العقار *':'Property Name *', required:true, sm:6 },
        { key:'type',      label:AR?'نوع العقار':'Type', type:'select', options:TYPES, sm:3 },
        { key:'status',    label:AR?'الحالة':'Status', type:'select', options:STATUS, sm:3 },
        { key:'address',   label:AR?'العنوان':'Address', sm:8 },
        { key:'district',  label:AR?'الحي':'District', sm:4 },
        { key:'city',      label:AR?'المدينة':'City', sm:4 },
        { key:'area',      label:AR?'المساحة (م²)':'Area (m²)', type:'number', sm:4 },
        { key:'floor',     label:AR?'الطابق':'Floor', type:'number', sm:4 },
        { key:'rooms',     label:AR?'عدد الغرف':'Rooms', type:'number', sm:4 },
        { key:'bathrooms', label:AR?'الحمامات':'Bathrooms', type:'number', sm:4 },
        { key:'rentPrice', label:AR?'الإيجار (ر.س / سنة)':'Rent (SAR/year)', type:'number', sm:6, endAdornment:'ر.س' },
        { key:'salePrice', label:AR?'سعر البيع (ر.س)':'Sale Price', type:'number', sm:6, endAdornment:'ر.س' },
        { key:'deedNo',    label:AR?'رقم الصك':'Deed Number', sm:6 },
        { key:'features',  label:AR?'المميزات والمواصفات':'Features', type:'textarea', sm:12 },
      ]}
    />
  );
}
