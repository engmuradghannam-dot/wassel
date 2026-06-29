import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const STATUS=[{value:'open',labelAr:'مفتوح',label:'Open'},{value:'in_progress',labelAr:'قيد التحضير',label:'In Progress'},{value:'ready',labelAr:'جاهز',label:'Ready'},{value:'paid',labelAr:'مدفوع',label:'Paid'},{value:'cancelled',labelAr:'ملغى',label:'Cancelled'}];
const TYPES=[{value:'dine_in',labelAr:'داخل المطعم',label:'Dine In'},{value:'takeaway',labelAr:'سفري',label:'Takeaway'},{value:'delivery',labelAr:'توصيل',label:'Delivery'}];
const PAYMENT=[{value:'cash',labelAr:'نقد',label:'Cash'},{value:'card',labelAr:'بطاقة',label:'Card'},{value:'online',labelAr:'أونلاين',label:'Online'}];

export default function RestaurantOrdersPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="restaurant-orders" icon="📋" color="#e65100"
      title={AR?'طلبات المطعم':'Restaurant Orders'}
      newLabel={AR?'طلب جديد':'New Order'}
      emptyForm={{ type:'dine_in',waiter:'',status:'open',paymentMethod:'cash',discount:0,'customer.name':'','customer.phone':'','customer.address':'',notes:'' }}
      columns={[
        { key:'orderNo',  label:AR?'رقم الطلب':'Order#' },
        { key:'table',    label:AR?'الطاولة':'Table', render:(r)=>r.table?.number||'—' },
        { key:'type',     label:AR?'النوع':'Type', render:(r,ar)=>{ const tp=TYPES.find(x=>x.value===r.type); return tp?(ar?tp.labelAr:tp.label):r.type; } },
        { key:'waiter',   label:AR?'الكابتن':'Waiter' },
        { key:'total',    label:AR?'الإجمالي':'Total', type:'money' },
        { key:'status',   label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'type',         label:AR?'نوع الطلب':'Order Type', type:'select', options:TYPES, sm:4 },
        { key:'waiter',       label:AR?'الكابتن / النادل':'Waiter', sm:4 },
        { key:'paymentMethod',label:AR?'طريقة الدفع':'Payment', type:'select', options:PAYMENT, sm:4 },
        { key:'status',       label:AR?'الحالة':'Status', type:'select', options:STATUS, sm:4 },
        { key:'discount',     label:AR?'الخصم':'Discount', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'customer.name', label:AR?'اسم العميل (للتوصيل)':'Customer Name', sm:4 },
        { key:'customer.phone',label:AR?'هاتف العميل':'Customer Phone', sm:6 },
        { key:'customer.address',label:AR?'عنوان التوصيل':'Delivery Address', sm:6 },
        { key:'notes',        label:AR?'ملاحظات':'Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
