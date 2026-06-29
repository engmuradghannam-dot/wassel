import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'];
const GENDER = [{value:'male',labelAr:'ذكر',label:'Male'},{value:'female',labelAr:'أنثى',label:'Female'}];

export default function PatientsPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="patients" icon="🩺" color="#e53935"
      title={AR?'المرضى':'Patients'}
      newLabel={AR?'مريض جديد':'New Patient'}
      emptyForm={{ name:'',nameEn:'',gender:'male',dateOfBirth:'',nationalId:'',phone:'',phone2:'',email:'',address:'',city:'الرياض',bloodType:'',allergies:'','insurance.provider':'','insurance.policyNo':'','emergencyContact.name':'','emergencyContact.phone':'','emergencyContact.relation':'',notes:'' }}
      columns={[
        { key:'name',        label:AR?'المريض':'Patient', type:'avatar' },
        { key:'patientNo',   label:AR?'رقم الملف':'File No' },
        { key:'gender',      label:AR?'الجنس':'Gender', render:(r,ar)=>ar?(r.gender==='male'?'ذكر':'أنثى'):(r.gender) },
        { key:'age',         label:AR?'العمر':'Age', render:(r)=>r.age||'—' },
        { key:'phone',       label:AR?'الهاتف':'Phone' },
        { key:'bloodType',   label:AR?'فصيلة الدم':'Blood' },
      ]}
      fields={[
        { key:'',            label:AR?'البيانات الأساسية':'Basic Info', type:'divider', sm:12 },
        { key:'name',        label:AR?'اسم المريض *':'Patient Name *', required:true, sm:6 },
        { key:'nameEn',      label:'Name (English)', sm:6 },
        { key:'gender',      label:AR?'الجنس *':'Gender *', type:'select', options:GENDER, required:true, sm:4 },
        { key:'dateOfBirth', label:AR?'تاريخ الميلاد':'Date of Birth', type:'date', sm:4 },
        { key:'bloodType',   label:AR?'فصيلة الدم':'Blood Type', type:'select', options:BLOOD.map(b=>({value:b,label:b,labelAr:b})), sm:4 },
        { key:'nationalId',  label:AR?'رقم الهوية':'National ID', sm:6 },
        { key:'phone',       label:AR?'الهاتف *':'Phone *', required:true, sm:6 },
        { key:'email',       label:AR?'البريد الإلكتروني':'Email', type:'email', sm:6 },
        { key:'city',        label:AR?'المدينة':'City', sm:6 },
        { key:'address',     label:AR?'العنوان':'Address', sm:12 },
        { key:'',            label:AR?'السجل الطبي':'Medical History', type:'divider', sm:12 },
        { key:'allergies',   label:AR?'الحساسية':'Allergies', type:'textarea', sm:6, rows:2 },
        { key:'chronicDiseases',label:AR?'الأمراض المزمنة':'Chronic Diseases', type:'textarea', sm:6, rows:2 },
        { key:'medications', label:AR?'الأدوية الحالية':'Current Medications', type:'textarea', sm:12, rows:2 },
        { key:'',            label:AR?'التأمين':'Insurance', type:'divider', sm:12 },
        { key:'insurance.provider',label:AR?'شركة التأمين':'Insurance Provider', sm:6 },
        { key:'insurance.policyNo',label:AR?'رقم الوثيقة':'Policy Number', sm:6 },
        { key:'',            label:AR?'جهة الطوارئ':'Emergency Contact', type:'divider', sm:12 },
        { key:'emergencyContact.name',   label:AR?'الاسم':'Name', sm:4 },
        { key:'emergencyContact.phone',  label:AR?'الهاتف':'Phone', sm:4 },
        { key:'emergencyContact.relation',label:AR?'صلة القرابة':'Relation', sm:4 },
        { key:'notes',       label:AR?'ملاحظات':'Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
