import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const PLANS  = [{value:'monthly',labelAr:'شهري',label:'Monthly'},{value:'quarterly',labelAr:'ربع سنوي',label:'Quarterly'},{value:'semi_annual',labelAr:'نصف سنوي',label:'Semi-Annual'},{value:'annual',labelAr:'سنوي',label:'Annual'},{value:'daily',labelAr:'يومي',label:'Daily'},{value:'class_based',labelAr:'حصص',label:'Classes'}];
const STATUS  = [{value:'active',labelAr:'نشط',label:'Active'},{value:'expired',labelAr:'منتهي',label:'Expired'},{value:'frozen',labelAr:'مجمّد',label:'Frozen'},{value:'cancelled',labelAr:'ملغى',label:'Cancelled'}];
const GENDER  = [{value:'male',labelAr:'ذكر',label:'Male'},{value:'female',labelAr:'أنثى',label:'Female'}];
const PAYMENT_S=[{value:'paid',labelAr:'مدفوع',label:'Paid'},{value:'pending',labelAr:'معلق',label:'Pending'},{value:'partial',labelAr:'جزئي',label:'Partial'}];

export default function MembershipsPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="memberships" icon="🏋️" color="#7b1fa2"
      title={AR?'الأعضاء والاشتراكات':'Members & Memberships'}
      newLabel={AR?'عضو جديد':'New Member'}
      emptyForm={{ name:'',phone:'',email:'',gender:'male',dateOfBirth:'',nationalId:'',plan:'monthly',startDate:'',fees:0,discount:0,paidAmount:0,paymentStatus:'pending',trainer:'',goal:'',status:'active',notes:'' }}
      columns={[
        { key:'name',     label:AR?'العضو':'Member', type:'avatar' },
        { key:'memberNo', label:AR?'رقم العضوية':'Member No' },
        { key:'phone',    label:AR?'الهاتف':'Phone' },
        { key:'plan',     label:AR?'الخطة':'Plan', render:(r,ar)=>{ const p=PLANS.find(x=>x.value===r.plan); return p?(ar?p.labelAr:p.label):r.plan; } },
        { key:'endDate',  label:AR?'انتهاء الاشتراك':'Expiry', type:'date' },
        { key:'fees',     label:AR?'الرسوم':'Fees', type:'money' },
        { key:'status',   label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'name',      label:AR?'اسم العضو *':'Member Name *', required:true, sm:6 },
        { key:'phone',     label:AR?'رقم الجوال *':'Phone *', required:true, sm:6 },
        { key:'email',     label:AR?'البريد الإلكتروني':'Email', type:'email', sm:6 },
        { key:'gender',    label:AR?'الجنس':'Gender', type:'select', options:GENDER, sm:3 },
        { key:'dateOfBirth',label:AR?'تاريخ الميلاد':'Date of Birth', type:'date', sm:3 },
        { key:'nationalId',label:AR?'رقم الهوية':'National ID', sm:6 },
        { key:'plan',      label:AR?'نوع الاشتراك *':'Plan *', type:'select', options:PLANS, sm:6, required:true },
        { key:'startDate', label:AR?'تاريخ البدء *':'Start Date *', type:'date', sm:6, required:true },
        { key:'trainer',   label:AR?'المدرب المخصص':'Trainer', sm:6 },
        { key:'goal',      label:AR?'الهدف (خسارة وزن / بناء عضلات...)':'Goal', sm:6 },
        { key:'fees',      label:AR?'الرسوم (ر.س)':'Fees', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'discount',  label:AR?'الخصم (ر.س)':'Discount', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'paidAmount',label:AR?'المبلغ المدفوع':'Paid', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'paymentStatus',label:AR?'حالة الدفع':'Payment Status', type:'select', options:PAYMENT_S, sm:4 },
        { key:'status',    label:AR?'حالة الاشتراك':'Membership Status', type:'select', options:STATUS, sm:4 },
        { key:'notes',     label:AR?'ملاحظات':'Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
