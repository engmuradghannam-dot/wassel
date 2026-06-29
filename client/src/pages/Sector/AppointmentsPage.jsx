import React from 'react';
import { Chip, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const statusColor = { scheduled:'default', confirmed:'info', arrived:'warning', in_progress:'primary', completed:'success', cancelled:'error', no_show:'warning' };
const statusAr    = { scheduled:'مجدول', confirmed:'مؤكد', arrived:'وصل', in_progress:'جاري', completed:'مكتمل', cancelled:'ملغى', no_show:'لم يحضر' };

const AppointmentsPage = () => {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const industry = localStorage.getItem('userIndustry') || 'clinic';
  const isSalon  = ['salon_ladies','salon_gents','spa','gym'].includes(industry);

  const config = {
    endpoint:  '/api/' + (isSalon ? 'salon-appointments' : 'appointments'),
    icon:      isSalon ? '✂️' : '📅',
    title:     AR ? 'المواعيد' : 'Appointments',
    addLabel:  AR ? 'موعد جديد' : 'New Appointment',
    itemLabel: AR ? 'موعد' : 'appointment',
    searchFields: isSalon ? ['customer.name','customer.phone'] : ['patient','appointmentNo'],
    dialogSize: 'md',
    emptyForm: isSalon
      ? { 'customer.name':'','customer.phone':'','customer.email':'',
          'services.0.name':'','services.0.price':0,'services.0.duration':30,
          appointmentDate:'', status:'scheduled', paymentStatus:'unpaid', notes:'' }
      : { patient:'', specialty:'', appointmentDate:'', duration:30,
          type:'new', status:'scheduled', chiefComplaint:'',
          fee:0, paymentStatus:'unpaid', notes:'' },
    validate: (f, AR) => {
      if (isSalon && !f['customer.name']?.trim()) return AR?'اسم العميل مطلوب':'Customer name required';
      if (!f.appointmentDate) return AR?'تاريخ الموعد مطلوب':'Appointment date required';
    },
    filter: (items, search) => {
      if (!search) return items;
      const q = search.toLowerCase();
      return items.filter(i =>
        i.customer?.name?.toLowerCase().includes(q) ||
        i.customer?.phone?.includes(q) ||
        i.appointmentNo?.includes(q)
      );
    },
    columns: [
      { key:'appointmentNo', label: AR?'رقم الموعد':'Appt #',
        render:(item)=><Typography variant="caption" sx={{ fontFamily:'monospace' }}>{item.appointmentNo||item._id?.slice(-6)}</Typography>
      },
      { key:'customer', label: AR?(isSalon?'العميل':'المريض'):'Customer',
        render:(item)=>(
          <Box>
            <Typography variant="body2" fontWeight={600}>{item.customer?.name || item.patient?.name || '—'}</Typography>
            <Typography variant="caption" color="text.secondary">{item.customer?.phone || item.patient?.phone || ''}</Typography>
          </Box>
        )
      },
      { key:'appointmentDate', label: AR?'التاريخ والوقت':'Date & Time',
        render:(item)=>(
          <Box>
            <Typography variant="body2">{item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString('ar-SA') : '—'}</Typography>
            <Typography variant="caption" color="text.secondary">{item.appointmentDate ? new Date(item.appointmentDate).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}</Typography>
          </Box>
        )
      },
      { key:'status', label: AR?'الحالة':'Status',
        render:(item,{AR})=>(
          <Chip label={AR?statusAr[item.status]:item.status}
            color={statusColor[item.status]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/>
        )
      },
      { key:'paymentStatus', label: AR?'الدفع':'Payment',
        render:(item,{AR})=>(
          <Chip label={item.paymentStatus===('paid')?AR?'مدفوع':'Paid':AR?'غير مدفوع':'Unpaid'}
            color={item.paymentStatus==='paid'?'success':'warning'} size="small" sx={{ fontSize:'0.7rem' }}/>
        )
      },
    ],
    formTabs: [{
      label: AR?'بيانات الموعد':'Appointment Details',
      fields: isSalon ? [
        { key:'customer.name',  label: AR?'اسم العميل *':'Customer Name *', width:6, required:true },
        { key:'customer.phone', label: AR?'رقم الهاتف *':'Phone *', width:6, required:true },
        { key:'customer.email', label: AR?'البريد':'Email', width:6, type:'email' },
        { key:'appointmentDate',label: AR?'تاريخ ووقت الموعد *':'Appointment Date *', width:6, type:'datetime-local', required:true },
        { key:'services.0.name',  label: AR?'الخدمة الرئيسية':'Service', width:6 },
        { key:'services.0.price', label: AR?'سعر الخدمة':'Price', width:3, type:'number' },
        { key:'services.0.duration', label: AR?'المدة (دقيقة)':'Duration (min)', width:3, type:'number' },
        { key:'status',         label: AR?'الحالة':'Status', width:4, type:'select',
          options:[
            {value:'scheduled',label:AR?'مجدول':'Scheduled'},{value:'confirmed',label:AR?'مؤكد':'Confirmed'},
            {value:'in_progress',label:AR?'جاري':'In Progress'},{value:'completed',label:AR?'مكتمل':'Completed'},
            {value:'cancelled',label:AR?'ملغى':'Cancelled'},{value:'no_show',label:AR?'لم يحضر':'No Show'}
          ]
        },
        { key:'paymentStatus',  label: AR?'الدفع':'Payment', width:4, type:'select',
          options:[{value:'unpaid',label:AR?'غير مدفوع':'Unpaid'},{value:'paid',label:AR?'مدفوع':'Paid'}]
        },
        { key:'notes',          label: AR?'ملاحظات':'Notes', width:12, type:'textarea' },
      ] : [
        { key:'chiefComplaint',  label: AR?'سبب الزيارة':'Chief Complaint', width:12 },
        { key:'appointmentDate', label: AR?'تاريخ الموعد *':'Appointment Date *', width:6, type:'datetime-local', required:true },
        { key:'duration',        label: AR?'المدة (دقيقة)':'Duration (min)', width:3, type:'number' },
        { key:'type',            label: AR?'نوع الزيارة':'Visit Type', width:3, type:'select',
          options:[{value:'new',label:AR?'جديد':'New'},{value:'follow_up',label:AR?'متابعة':'Follow Up'},{value:'emergency',label:AR?'طارئ':'Emergency'}]
        },
        { key:'specialty',       label: AR?'التخصص':'Specialty', width:6 },
        { key:'status',          label: AR?'الحالة':'Status', width:6, type:'select',
          options:[
            {value:'scheduled',label:AR?'مجدول':'Scheduled'},{value:'confirmed',label:AR?'مؤكد':'Confirmed'},
            {value:'arrived',label:AR?'وصل':'Arrived'},{value:'in_progress',label:AR?'جاري':'In Progress'},
            {value:'completed',label:AR?'مكتمل':'Completed'},{value:'cancelled',label:AR?'ملغى':'Cancelled'}
          ]
        },
        { key:'fee',             label: AR?'الأتعاب (ر.س)':'Fee (SAR)', width:6, type:'number' },
        { key:'paymentStatus',   label: AR?'الدفع':'Payment', width:6, type:'select',
          options:[{value:'unpaid',label:AR?'غير مدفوع':'Unpaid'},{value:'paid',label:AR?'مدفوع':'Paid'},{value:'insurance',label:AR?'تأمين':'Insurance'}]
        },
        { key:'notes',           label: AR?'ملاحظات وتشخيص':'Notes & Diagnosis', width:12, type:'textarea' },
      ]
    }]
  };

  return <SectorPage config={config} />;
};
export default AppointmentsPage;
