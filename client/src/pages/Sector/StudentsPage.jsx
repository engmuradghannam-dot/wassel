import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const GENDER = [{value:'male',labelAr:'ذكر',label:'Male'},{value:'female',labelAr:'أنثى',label:'Female'}];
const STATUS  = [{value:'enrolled',labelAr:'ملتحق',label:'Enrolled'},{value:'graduated',labelAr:'متخرج',label:'Graduated'},{value:'transferred',labelAr:'محول',label:'Transferred'},{value:'suspended',labelAr:'موقوف',label:'Suspended'},{value:'withdrawn',labelAr:'منسحب',label:'Withdrawn'}];

export default function StudentsPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  const industry = localStorage.getItem('userIndustry')||'school';
  const isUniv   = industry==='university';
  return (
    <SectorPage
      model="students" icon={isUniv?'🎓':'🏫'} color="#283593"
      title={AR?(isUniv?'الطلاب (جامعة)':'الطلاب (مدرسة)'):isUniv?'University Students':'School Students'}
      newLabel={AR?'قيد طالب جديد':'Enroll Student'}
      emptyForm={{ name:'',nameEn:'',gender:'male',dateOfBirth:'',nationalId:'',phone:'',email:'',nationality:'',grade:'',section:'',academicYear:new Date().getFullYear()+'-'+(new Date().getFullYear()+1),enrollDate:'',faculty:'',major:'',fees:0,discount:0,'guardian.name':'','guardian.phone':'','guardian.relation':'',status:'enrolled',notes:'' }}
      columns={[
        { key:'name',        label:AR?'الطالب':'Student', type:'avatar' },
        { key:'studentNo',   label:AR?'الرقم الدراسي':'Student No' },
        { key:'grade',       label:AR?(isUniv?'المستوى':'الصف'):(isUniv?'Level':'Grade') },
        { key:'section',     label:AR?'الفصل':'Section' },
        ...(isUniv?[{ key:'faculty', label:AR?'الكلية':'Faculty' },{ key:'major', label:AR?'التخصص':'Major' }]:[]),
        { key:'phone',       label:AR?'الهاتف':'Phone' },
        { key:'fees',        label:AR?'الرسوم':'Fees', type:'money' },
        { key:'status',      label:AR?'الحالة':'Status', type:'status' },
      ]}
      fields={[
        { key:'name',        label:AR?'اسم الطالب *':'Student Name *', required:true, sm:6 },
        { key:'nameEn',      label:'Name (English)', sm:6 },
        { key:'gender',      label:AR?'الجنس':'Gender', type:'select', options:GENDER, sm:4 },
        { key:'dateOfBirth', label:AR?'تاريخ الميلاد':'Date of Birth', type:'date', sm:4 },
        { key:'nationalId',  label:AR?'رقم الهوية':'National ID', sm:4 },
        { key:'phone',       label:AR?'هاتف الطالب':'Phone', sm:6 },
        { key:'email',       label:AR?'البريد الإلكتروني':'Email', type:'email', sm:6 },
        { key:'nationality', label:AR?'الجنسية':'Nationality', sm:6 },
        { key:'academicYear',label:AR?'السنة الدراسية':'Academic Year', sm:6 },
        ...(isUniv?[
          { key:'faculty',   label:AR?'الكلية':'Faculty', sm:6 },
          { key:'major',     label:AR?'التخصص':'Major', sm:6 },
          { key:'grade',     label:AR?'المستوى (1-4)':'Level', sm:4 },
        ]:[
          { key:'grade',     label:AR?'الصف':'Grade / Class', sm:4 },
          { key:'section',   label:AR?'الفصل':'Section', sm:4 },
        ]),
        { key:'enrollDate',  label:AR?'تاريخ الالتحاق':'Enroll Date', type:'date', sm:4 },
        { key:'status',      label:AR?'الحالة':'Status', type:'select', options:STATUS, sm:4 },
        { key:'',            label:AR?'الرسوم الدراسية':'Fees', type:'divider', sm:12 },
        { key:'fees',        label:AR?'الرسوم (ر.س)':'Fees', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'discount',    label:AR?'الخصم (ر.س)':'Discount', type:'number', sm:4, endAdornment:'ر.س' },
        { key:'',            label:AR?'ولي الأمر':'Guardian', type:'divider', sm:12 },
        { key:'guardian.name',    label:AR?'اسم ولي الأمر':'Guardian Name', sm:4 },
        { key:'guardian.phone',   label:AR?'هاتف ولي الأمر':'Guardian Phone', sm:4 },
        { key:'guardian.relation',label:AR?'صلة القرابة':'Relation', sm:4 },
        { key:'notes',       label:AR?'ملاحظات':'Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
