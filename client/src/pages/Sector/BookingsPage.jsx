import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const SOURCES = [{value:'walk_in',labelAr:'حضور مباشر',label:'Walk-in'},{value:'phone',labelAr:'هاتف',label:'Phone'},{value:'online',labelAr:'أونلاين',label:'Online'},{value:'agency',labelAr:'وكالة',label:'Agency'}];
const STATUS  = [{value:'pending',labelAr:'معلق',label:'Pending'},{value:'confirmed',labelAr:'مؤكد',label:'Confirmed'},{value:'checked_in',labelAr:'وصل',label:'Checked In'},{value:'checked_out',labelAr:'مغادر',label:'Checked Out'},{value:'cancelled',labelAr:'ملغى',label:'Cancelled'},{value:'no_show',labelAr:'لم يحضر',label:'No Show'}];
const PAYMENT = [{value:'cash',labelAr:'نقد',label:'Cash'},{value:'card',labelAr:'بطاقة',label:'Card'},{value:'transfer',labelAr:'تحويل',label:'Transfer'},{value:'online',labelAr:'أونلاين',label:'Online'}];

export default function BookingsPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="bookings" icon="📅" color="#ff6d00"
      title={AR?'الحجوزات':'Bookings'}
      newLabel={AR?'حجز جديد':'New Booking'}
      emptyForm={{ 'guest.name':'','guest.phone':'','guest.email':'','guest.idNumber':'','guest.nationality':'',checkIn:'',checkOut:'',adults:1,children:0,pricePerNight:0,discount:0,status:'pending',source:'walk_in',paymentMethod:'cash',notes:'' }}
      columns={[
        { key:'bookingNo',    label:AR?'رقم الحجز':'Booking#' },
        { key:'guest.name',   label:AR?'اسم النزيل':'Guest', type:'avatar', render:(r)=>r.guest?.name||'—' },
        { key:'guest.phone',  label:AR?'الهاتف':'Phone', render:(r)=>r.guest?.phone||'—' },
        { key:'checkIn',      label:AR?'الوصول':'Check-in', type:'date' },
        { key:'checkOut',     label:AR?'المغادرة':'Check-out', type:'date' },
        { key:'nights',       label:AR?'الليالي':'Nights' },
        { key:'netAmount',    label:AR?'المبلغ':'Amount', type:'money' },
        { key:'status',       label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'',             label:AR?'معلومات النزيل':'Guest Information', type:'divider', sm:12 },
        { key:'guest.name',   label:AR?'اسم النزيل *':'Guest Name *', required:true, sm:6 },
        { key:'guest.phone',  label:AR?'رقم الجوال':'Phone', sm:6 },
        { key:'guest.email',  label:AR?'البريد الإلكتروني':'Email', type:'email', sm:6 },
        { key:'guest.idNumber',label:AR?'رقم الهوية / الجواز':'ID / Passport', sm:6 },
        { key:'guest.nationality',label:AR?'الجنسية':'Nationality', sm:6 },
        { key:'',             label:AR?'تفاصيل الحجز':'Booking Details', type:'divider', sm:12 },
        { key:'checkIn',      label:AR?'تاريخ الوصول *':'Check-in *', type:'date', required:true, sm:4 },
        { key:'checkOut',     label:AR?'تاريخ المغادرة *':'Check-out *', type:'date', required:true, sm:4 },
        { key:'adults',       label:AR?'البالغون':'Adults', type:'number', sm:2 },
        { key:'children',     label:AR?'الأطفال':'Children', type:'number', sm:2 },
        { key:'pricePerNight',label:AR?'السعر / ليلة':'Price / Night', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'discount',     label:AR?'الخصم':'Discount', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'status',       label:AR?'الحالة':'Status', type:'select', options:STATUS, sm:4 },
        { key:'source',       label:AR?'مصدر الحجز':'Source', type:'select', options:SOURCES, sm:4 },
        { key:'paymentMethod',label:AR?'طريقة الدفع':'Payment', type:'select', options:PAYMENT, sm:4 },
        { key:'notes',        label:AR?'ملاحظات':'Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
