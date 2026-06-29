import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from '../Sector/SectorPage';
export default function CustomersPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="customers" icon="👥" color="#00897b"
      title={t('nav.customers')||(AR?'العملاء':'Customers')}
      newLabel={AR?'عميل جديد':'New Customer'}
      emptyForm={{ name:'',nameEn:'',type:'individual',phone:'',email:'',address:'',city:'الرياض',country:'SA',commercialReg:'',vatNumber:'',paymentTerms:30,creditLimit:0,notes:'' }}
      columns={[
        { key:'name',   label:AR?'العميل':'Customer', type:'avatar' },
        { key:'phone',  label:AR?'الهاتف':'Phone' },
        { key:'email',  label:AR?'البريد':'Email' },
        { key:'city',   label:AR?'المدينة':'City' },
        { key:'balance',label:AR?'الرصيد':'Balance', type:'money' },
      ]}
      fields={[
        { key:'name',    label:AR?'الاسم *':'Name *', required:true, sm:6 },
        { key:'nameEn',  label:'Name (EN)', sm:6 },
        { key:'type',    label:AR?'النوع':'Type', type:'select', sm:4, options:[{value:'individual',labelAr:'فرد',label:'Individual'},{value:'company',labelAr:'شركة',label:'Company'}] },
        { key:'phone',   label:AR?'الهاتف':'Phone', sm:4 },
        { key:'email',   label:AR?'البريد':'Email', type:'email', sm:4 },
        { key:'city',    label:AR?'المدينة':'City', sm:6 },
        { key:'address', label:AR?'العنوان':'Address', sm:6 },
        { key:'commercialReg',label:AR?'السجل التجاري':'CR Number', sm:6 },
        { key:'vatNumber',    label:AR?'الرقم الضريبي':'VAT Number', sm:6 },
        { key:'paymentTerms', label:AR?'شروط الدفع (يوم)':'Payment Terms (days)', type:'number', sm:4 },
        { key:'creditLimit',  label:AR?'حد الائتمان':'Credit Limit', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'notes',   label:AR?'ملاحظات':'Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
