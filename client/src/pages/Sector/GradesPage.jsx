import React from 'react';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const STATUS  = [{value:'pass',labelAr:'ناجح',label:'Pass'},{value:'fail',labelAr:'راسب',label:'Fail'},{value:'incomplete',labelAr:'ناقص',label:'Incomplete'}];

export default function GradesPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <SectorPage
      model="grades" icon="📝" color="#283593"
      title={AR?'الدرجات والنتائج':'Grades & Results'}
      newLabel={AR?'إضافة نتيجة':'Add Grade'}
      emptyForm={{ subject:'',teacher:'',semester:'',academicYear:'','grades.midterm':0,'grades.final':0,'grades.quizzes':0,'grades.homework':0,status:'pass',notes:'' }}
      columns={[
        { key:'student', label:AR?'الطالب':'Student', render:(r)=>r.student?.name||'—' },
        { key:'subject', label:AR?'المادة':'Subject' },
        { key:'grades.midterm', label:AR?'منتصف الفصل':'Midterm', render:(r)=>r.grades?.midterm??'—' },
        { key:'grades.final',   label:AR?'النهائي':'Final',   render:(r)=>r.grades?.final??'—' },
        { key:'grades.total',   label:AR?'المجموع':'Total',   render:(r)=>r.grades?.total??'—' },
        { key:'grade',          label:AR?'الدرجة':'Grade' },
        { key:'status',         label:AR?'النتيجة':'Result', type:'status' },
      ]}
      fields={[
        { key:'subject',      label:AR?'المادة الدراسية *':'Subject *', required:true, sm:6 },
        { key:'teacher',      label:AR?'المعلم / الأستاذ':'Teacher', sm:6 },
        { key:'semester',     label:AR?'الفصل الدراسي':'Semester', sm:6 },
        { key:'academicYear', label:AR?'العام الدراسي':'Academic Year', sm:6 },
        { key:'grades.quizzes', label:AR?'درجة الاختبارات القصيرة':'Quiz Score', type:'number', sm:3 },
        { key:'grades.homework', label:AR?'درجة الواجب':'Homework', type:'number', sm:3 },
        { key:'grades.midterm',  label:AR?'درجة منتصف الفصل':'Midterm Score', type:'number', sm:3 },
        { key:'grades.final',    label:AR?'درجة الاختبار النهائي':'Final Score', type:'number', sm:3 },
        { key:'grade',        label:AR?'التقدير (A/B/C...)':'Grade Letter', sm:4 },
        { key:'status',       label:AR?'النتيجة':'Result', type:'select', options:STATUS, sm:4 },
        { key:'notes',        label:AR?'ملاحظات':'Notes', type:'textarea', sm:12 },
      ]}
    />
  );
}
