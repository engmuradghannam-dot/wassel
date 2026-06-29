import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const TYPES   = [{value:'new',labelAr:'جديد',label:'New'},{value:'follow_up',labelAr:'متابعة',label:'Follow-up'},{value:'emergency',labelAr:'طارئ',label:'Emergency'},{value:'checkup',labelAr:'كشف دوري',label:'Checkup'},{value:'surgery',labelAr:'عملية',label:'Surgery'}];
const STATUS  = [{value:'scheduled',labelAr:'مجدول',label:'Scheduled'},{value:'confirmed',labelAr:'مؤكد',label:'Confirmed'},{value:'in_progress',labelAr:'جارٍ',label:'In Progress'},{value:'completed',labelAr:'مكتمل',label:'Completed'},{value:'cancelled',labelAr:'ملغى',label:'Cancelled'},{value:'no_show',labelAr:'لم يحضر',label:'No Show'}];
const PAYMENT_S=[{value:'pending',labelAr:'معلق',label:'Pending'},{value:'paid',labelAr:'مدفوع',label:'Paid'},{value:'partial',labelAr:'جزئي',label:'Partial'},{value:'insurance',labelAr:'تأمين',label:'Insurance'}];

export default function AppointmentsPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="appointments" icon="📅" color="#e53935"
      title={AR?'المواعيد':'Appointments'}
      newLabel={AR?'موعد جديد':'New Appointment'}
      emptyForm={{ 'patient':'',doctorName:'',date:'',time:'',duration:30,type:'new',specialty:'',status:'scheduled',complaint:'',diagnosis:'',prescription:'',fees:0,paidAmount:0,paymentStatus:'pending',notes:'' }}
      columns={[
        { key:'apptNo',      label:AR?'رقم الموعد':'Appt#' },
        { key:'patient',     label:AR?'المريض':'Patient', render:(r)=>r.patient?.name||'—' },
        { key:'doctorName',  label:AR?'الطبيب':'Doctor' },
        { key:'date',        label:AR?'التاريخ':'Date', type:'date' },
        { key:'time',        label:AR?'الوقت':'Time' },
        { key:'type',        label:AR?'النوع':'Type', render:(r,ar)=>{ const tp=TYPES.find(x=>x.value===r.type); return tp?(ar?tp.labelAr:tp.label):r.type; } },
        { key:'fees',        label:AR?'الرسوم':'Fees', type:'money' },
        { key:'status',      label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'doctorName',  label:AR?'اسم الطبيب':'Doctor Name', sm:6 },
        { key:'specialty',   label:AR?'التخصص':'Specialty', sm:6 },
        { key:'date',        label:AR?'التاريخ *':'Date *', type:'date', required:true, sm:4 },
        { key:'time',        label:AR?'الوقت *':'Time *', required:true, sm:4, placeholder:'09:30' },
        { key:'duration',    label:AR?'المدة (دقيقة)':'Duration (min)', type:'number', sm:4 },
        { key:'type',        label:AR?'نوع الزيارة':'Visit Type', type:'select', options:TYPES, sm:6 },
        { key:'status',      label:AR?'الحالة':'Status', type:'select', options:STATUS, sm:6 },
        { key:'',            label:AR?'ملاحظات الزيارة':'Visit Notes', type:'divider', sm:12 },
        { key:'complaint',   label:AR?'الشكوى':'Complaint', type:'textarea', sm:6, rows:2 },
        { key:'diagnosis',   label:AR?'التشخيص':'Diagnosis', type:'textarea', sm:6, rows:2 },
        { key:'prescription',label:AR?'الوصفة الطبية':'Prescription', type:'textarea', sm:12, rows:3 },
        { key:'',            label:AR?'المالية':'Financial', type:'divider', sm:12 },
        { key:'fees',        label:AR?'رسوم الكشف (ر.س)':'Consultation Fee', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'paidAmount',  label:AR?'المبلغ المدفوع':'Paid Amount', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'paymentStatus',label:AR?'حالة الدفع':'Payment Status', type:'select', options:PAYMENT_S, sm:4 },
        { key:'notes',       label:AR?'ملاحظات':'Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
