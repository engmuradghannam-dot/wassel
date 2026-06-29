import React from 'react';
import { Chip, Box, Typography, Avatar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const bloodColors = {'A+':'#e53935','A-':'#ef9a9a','B+':'#1976d2','B-':'#90caf9','AB+':'#7b1fa2','AB-':'#ce93d8','O+':'#2e7d32','O-':'#a5d6a7','unknown':'#bdbdbd'};

const PatientsPage = () => {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const config = {
    endpoint:   '/api/patients',
    icon:       '🩺',
    title:      AR ? 'المرضى' : 'Patients',
    addLabel:   AR ? 'مريض جديد' : 'New Patient',
    itemLabel:  AR ? 'مريض' : 'patient',
    activeField:'isActive',
    searchFields: ['name','phone','nationalId','patientNumber'],
    dialogSize: 'md',
    emptyForm: { name:'', gender:'male', phone:'', email:'', nationalId:'',
      nationality:'SA', bloodType:'unknown', address:'', city:'الرياض',
      'insurance.company':'','insurance.policyNo':'',
      'emergencyContact.name':'','emergencyContact.phone':'','emergencyContact.relation':'',
      notes:'', isActive:true
    },
    validate: (f, AR) => {
      if (!f.name?.trim()) return AR?'اسم المريض مطلوب':'Patient name required';
      if (!f.phone?.trim()) return AR?'رقم الهاتف مطلوب':'Phone required';
    },
    columns: [
      { key:'name', label: AR?'المريض':'Patient',
        render:(item,{sectorColor})=>(
          <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
            <Avatar sx={{ width:34, height:34, bgcolor:`${sectorColor}20`, color:sectorColor, fontSize:13, fontWeight:700 }}>
              {item.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>
                {item.patientNumber||'—'}
              </Typography>
            </Box>
          </Box>
        )
      },
      { key:'gender', label: AR?'الجنس':'Gender',
        render:(item,{AR})=><Chip label={AR?(item.gender==='male'?'ذكر':'أنثى'):item.gender} size="small" sx={{ fontSize:'0.7rem' }}/>
      },
      { key:'phone', label: AR?'الهاتف':'Phone',
        render:(item)=><Typography variant="body2" sx={{ fontFamily:'monospace' }}>{item.phone||'—'}</Typography>
      },
      { key:'bloodType', label: AR?'فصيلة الدم':'Blood Type',
        render:(item)=>(
          item.bloodType && item.bloodType !== 'unknown' ?
          <Chip label={item.bloodType} size="small"
            sx={{ bgcolor:bloodColors[item.bloodType]+'20', color:bloodColors[item.bloodType], fontWeight:700, fontSize:'0.7rem' }}/>
          : <Typography variant="caption" color="text.disabled">—</Typography>
        )
      },
      { key:'insurance', label: AR?'التأمين':'Insurance',
        render:(item)=>(
          item.insurance?.company ?
          <Chip label={item.insurance.company} size="small" color="info" sx={{ fontSize:'0.7rem' }}/>
          : <Typography variant="caption" color="text.disabled">{AR?'لا':'None'}</Typography>
        )
      },
      { key:'isActive', label: AR?'الحالة':'Status',
        render:(item,{t})=>(
          <Chip label={item.isActive?t('common.active'):t('common.inactive')}
            color={item.isActive?'success':'default'} size="small" sx={{ fontSize:'0.7rem' }}/>
        )
      },
    ],
    formTabs: [
      {
        label: AR?'البيانات الأساسية':'Basic Info',
        fields: [
          { key:'name',        label: AR?'الاسم الكامل *':'Full Name *', width:6, required:true },
          { key:'gender',      label: AR?'الجنس':'Gender', width:6, type:'select',
            options:[{value:'male',label:AR?'ذكر':'Male'},{value:'female',label:AR?'أنثى':'Female'}]
          },
          { key:'phone',       label: AR?'رقم الهاتف *':'Phone *', width:6, required:true },
          { key:'email',       label: AR?'البريد الإلكتروني':'Email', width:6, type:'email' },
          { key:'nationalId',  label: AR?'رقم الهوية / الإقامة':'National/Iqama ID', width:6 },
          { key:'nationality', label: AR?'الجنسية':'Nationality', width:6 },
          { key:'bloodType',   label: AR?'فصيلة الدم':'Blood Type', width:4, type:'select',
            options:['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'].map(v=>({value:v,label:v==='unknown'?AR?'غير معروف':'Unknown':v}))
          },
          { key:'address',     label: AR?'العنوان':'Address', width:8 },
          { key:'notes',       label: AR?'ملاحظات طبية':'Medical Notes', width:12, type:'textarea' },
        ]
      },
      {
        label: AR?'التأمين والطوارئ':'Insurance & Emergency',
        fields: [
          { key:'insurance.company',  label: AR?'شركة التأمين':'Insurance Company', width:6 },
          { key:'insurance.policyNo', label: AR?'رقم البوليصة':'Policy Number', width:6 },
          { key:'insurance.network',  label: AR?'الشبكة الطبية':'Network', width:6 },
          { key:'emergencyContact.name',    label: AR?'جهة طوارئ — الاسم':'Emergency Contact', width:4 },
          { key:'emergencyContact.phone',   label: AR?'هاتف الطوارئ':'Emergency Phone', width:4 },
          { key:'emergencyContact.relation',label: AR?'صلة القرابة':'Relation', width:4 },
        ]
      }
    ]
  };

  return <SectorPage config={config} />;
};
export default PatientsPage;
