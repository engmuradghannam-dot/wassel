import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const PERIODS=[{value:'monthly',labelAr:'شهري',label:'Monthly'},{value:'quarterly',labelAr:'ربع سنوي',label:'Quarterly'},{value:'semi_annual',labelAr:'نصف سنوي',label:'Semi-Annual'},{value:'annual',labelAr:'سنوي',label:'Annual'}];
const STATUS =[{value:'pending',labelAr:'معلق',label:'Pending'},{value:'active',labelAr:'نشط',label:'Active'},{value:'expired',labelAr:'منتهٍ',label:'Expired'},{value:'terminated',labelAr:'محلول',label:'Terminated'}];
const T_TYPES=[{value:'individual',labelAr:'فرد',label:'Individual'},{value:'company',labelAr:'شركة',label:'Company'}];

export default function LeasesPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="leases" icon="📄" color="#4e342e"
      title={AR?'عقود الإيجار':'Lease Contracts'}
      newLabel={AR?'عقد إيجار جديد':'New Lease'}
      emptyForm={{ 'tenant.name':'','tenant.phone':'','tenant.nationalId':'','tenant.type':'individual','tenant.companyName':'',startDate:'',endDate:'',rentAmount:0,depositAmount:0,period:'annual',ejariNo:'',status:'pending',notes:'' }}
      columns={[
        { key:'leaseNo',        label:AR?'رقم العقد':'Contract No' },
        { key:'property',       label:AR?'العقار':'Property', render:(r)=>r.property?.name||'—' },
        { key:'tenant.name',    label:AR?'المستأجر':'Tenant', type:'avatar', render:(r)=>r.tenant?.name||'—' },
        { key:'tenant.phone',   label:AR?'الهاتف':'Phone', render:(r)=>r.tenant?.phone||'—' },
        { key:'rentAmount',     label:AR?'قيمة الإيجار':'Rent', type:'money' },
        { key:'startDate',      label:AR?'من':'From', type:'date' },
        { key:'endDate',        label:AR?'إلى':'To', type:'date' },
        { key:'status',         label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'',               label:AR?'معلومات المستأجر':'Tenant Information', type:'divider', sm:12 },
        { key:'tenant.name',    label:AR?'اسم المستأجر *':'Tenant Name *', required:true, sm:6 },
        { key:'tenant.phone',   label:AR?'الهاتف':'Phone', sm:6 },
        { key:'tenant.type',    label:AR?'النوع':'Type', type:'select', options:T_TYPES, sm:4 },
        { key:'tenant.nationalId',label:AR?'رقم الهوية':'National ID', sm:4 },
        { key:'tenant.companyName',label:AR?'اسم الشركة (للشركات)':'Company Name', sm:4 },
        { key:'',               label:AR?'تفاصيل العقد':'Contract Details', type:'divider', sm:12 },
        { key:'startDate',      label:AR?'تاريخ البداية *':'Start Date *', type:'date', required:true, sm:4 },
        { key:'endDate',        label:AR?'تاريخ النهاية *':'End Date *', type:'date', required:true, sm:4 },
        { key:'period',         label:AR?'دورة الدفع':'Payment Period', type:'select', options:PERIODS, sm:4 },
        { key:'rentAmount',     label:AR?'قيمة الإيجار (ر.س)':'Rent Amount', type:'number', sm:4, endAdornment:'ر.س', required:true },
        { key:'depositAmount',  label:AR?'مبلغ التأمين (ر.س)':'Security Deposit', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'ejariNo',        label:AR?'رقم إيجاري':'Ejari Number', sm:4 },
        { key:'status',         label:AR?'الحالة':'Status', type:'select', options:STATUS, sm:4 },
        { key:'notes',          label:AR?'ملاحظات':'Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
