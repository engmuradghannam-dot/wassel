import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const STATUS=[{value:'booked',labelAr:'محجوز',label:'Booked'},{value:'confirmed',labelAr:'مؤكد',label:'Confirmed'},{value:'in_progress',labelAr:'جارٍ',label:'In Progress'},{value:'completed',labelAr:'مكتمل',label:'Completed'},{value:'cancelled',labelAr:'ملغى',label:'Cancelled'},{value:'no_show',labelAr:'لم تحضر',label:'No Show'}];

export default function SalonAppointmentsPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  const industry = localStorage.getItem('userIndustry')||'salon_ladies';
  const icon = industry==='salon_gents'?'💈':'💅';
  return (
    <SectorPage
      model="salon-appointments" icon={icon} color="#ad1457"
      title={AR?'مواعيد الصالون':'Salon Appointments'}
      newLabel={AR?'موعد جديد':'New Appointment'}
      emptyForm={{ 'customer.name':'','customer.phone':'','customer.email':'',stylist:'',date:'',time:'',duration:60,status:'booked',notes:'' }}
      columns={[
        { key:'apptNo',       label:AR?'رقم الموعد':'Appt#' },
        { key:'customer.name',label:AR?'العميلة':'Customer', type:'avatar', render:(r)=>r.customer?.name||'—' },
        { key:'customer.phone',label:AR?'الهاتف':'Phone', render:(r)=>r.customer?.phone||'—' },
        { key:'stylist',      label:AR?'الموظفة':'Stylist' },
        { key:'date',         label:AR?'التاريخ':'Date', type:'date' },
        { key:'time',         label:AR?'الوقت':'Time' },
        { key:'totalPrice',   label:AR?'المبلغ':'Amount', type:'money' },
        { key:'status',       label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'customer.name', label:AR?'اسم العميلة *':'Customer Name *', required:true, sm:6 },
        { key:'customer.phone',label:AR?'رقم الجوال *':'Phone *', required:true, sm:6 },
        { key:'customer.email',label:AR?'البريد الإلكتروني':'Email', type:'email', sm:6 },
        { key:'stylist',      label:AR?'الموظفة المخصصة':'Assigned Stylist', sm:6 },
        { key:'date',         label:AR?'تاريخ الموعد *':'Date *', type:'date', required:true, sm:4 },
        { key:'time',         label:AR?'وقت الموعد *':'Time *', required:true, sm:4 },
        { key:'duration',     label:AR?'المدة (دقيقة)':'Duration (min)', type:'number', sm:4 },
        { key:'status',       label:AR?'الحالة':'Status', type:'select', options:STATUS, sm:6 },
        { key:'notes',        label:AR?'ملاحظات خاصة':'Special Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
