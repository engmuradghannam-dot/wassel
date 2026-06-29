import React from 'react';
import { Chip, Box, Typography, Avatar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SectorPage from './SectorPage';

const statusColor = { active:'success', inactive:'default', graduated:'info', withdrawn:'warning', transferred:'secondary' };
const statusAr    = { active:'نشط', inactive:'غير نشط', graduated:'تخرج', withdrawn:'منسحب', transferred:'محوّل' };

const StudentsPage = () => {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const industry = localStorage.getItem('userIndustry') || 'school';
  const isUni    = ['university'].includes(industry);
  const isKinder = ['kindergarten'].includes(industry);

  const config = {
    endpoint:   '/api/students',
    icon:       isKinder ? '🧒' : '🎓',
    title:      AR ? (isKinder?'الأطفال':isUni?'الطلاب':'الطلاب') : (isKinder?'Children':isUni?'Students':'Students'),
    addLabel:   AR ? (isKinder?'طفل جديد':'طالب جديد') : 'New Student',
    itemLabel:  AR ? (isKinder?'طفل':'طالب') : 'student',
    activeField:'status',
    searchFields: ['name','studentNumber','nationalId','guardian.phone'],
    dialogSize: 'md',
    emptyForm: {
      name:'', nameEn:'', gender:'male', dob:'', nationalId:'', phone:'', email:'',
      nationality:'SA', grade:'', classroom:'', faculty:'', department:'', major:'', level:1,
      'guardian.name':'','guardian.phone':'','guardian.relation':'','guardian.email':'',
      fees:0, discount:0, status:'active', notes:''
    },
    validate: (f, AR) => {
      if (!f.name?.trim()) return AR?'اسم الطالب مطلوب':'Student name required';
      if (!f['guardian.phone']?.trim()) return AR?'هاتف ولي الأمر مطلوب':'Guardian phone required';
    },
    columns: [
      { key:'name', label: AR?'الطالب':'Student',
        render:(item,{sectorColor})=>(
          <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
            <Avatar sx={{ width:34, height:34, bgcolor:`${sectorColor}20`, color:sectorColor, fontSize:13, fontWeight:700 }}>
              {item.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>
                {item.studentNumber||'—'}
              </Typography>
            </Box>
          </Box>
        )
      },
      { key:'gender', label: AR?'الجنس':'Gender',
        render:(item,{AR})=><Chip label={AR?(item.gender==='male'?'ذكر':'أنثى'):item.gender} size="small" sx={{ fontSize:'0.7rem' }}/>
      },
      { key:'grade', label: AR?(isUni?'المستوى':'الصف'):(isUni?'Level':'Grade'),
        render:(item)=><Typography variant="body2">{isUni?(item.level?`Level ${item.level}`:'—'):(item.grade||'—')}</Typography>
      },
      { key:'guardian', label: AR?'ولي الأمر':'Guardian',
        render:(item)=>(
          <Box>
            <Typography variant="body2">{item.guardian?.name||'—'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>
              {item.guardian?.phone||''}
            </Typography>
          </Box>
        )
      },
      { key:'fees', label: AR?'الرسوم':'Fees',
        render:(item)=>(
          <Box>
            <Typography variant="body2" fontWeight={600}>{(item.fees||0).toLocaleString()} {AR?'ر.س':'SAR'}</Typography>
            {item.balance > 0 && (
              <Typography variant="caption" color="error.main">{AR?'متبقي':''} {item.balance}</Typography>
            )}
          </Box>
        )
      },
      { key:'status', label: AR?'الحالة':'Status',
        render:(item,{AR})=>(
          <Chip label={AR?statusAr[item.status]:item.status}
            color={statusColor[item.status]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/>
        )
      },
    ],
    formTabs: [
      {
        label: AR?(isKinder?'بيانات الطفل':'بيانات الطالب'):'Student Info',
        fields: [
          { key:'name',     label: AR?'الاسم الكامل *':'Full Name *', width:6, required:true },
          { key:'nameEn',   label: 'Name (English)', width:6 },
          { key:'gender',   label: AR?'الجنس':'Gender', width:4, type:'select',
            options:[{value:'male',label:AR?'ذكر':'Male'},{value:'female',label:AR?'أنثى':'Female'}]
          },
          { key:'dob',          label: AR?'تاريخ الميلاد':'Date of Birth', width:4, type:'date' },
          { key:'nationalId',   label: AR?'رقم الهوية / الإقامة':'National ID', width:4 },
          { key:'phone',        label: AR?'الهاتف':'Phone', width:6 },
          { key:'nationality',  label: AR?'الجنسية':'Nationality', width:6 },
          ...( isUni ? [
            { key:'faculty',    label: AR?'الكلية':'Faculty', width:4 },
            { key:'department', label: AR?'القسم':'Department', width:4 },
            { key:'major',      label: AR?'التخصص':'Major', width:4 },
            { key:'level',      label: AR?'المستوى':'Level', width:4, type:'number' },
          ] : [
            { key:'grade',      label: AR?'الصف / المرحلة':'Grade', width:4 },
            { key:'classroom',  label: AR?'الفصل':'Classroom', width:4 },
          ]),
          { key:'fees',         label: AR?'الرسوم الدراسية (ر.س)':'Fees (SAR)', width:4, type:'number' },
          { key:'discount',     label: AR?'الخصم (ر.س)':'Discount (SAR)', width:4, type:'number' },
          { key:'status',       label: AR?'الحالة':'Status', width:4, type:'select',
            options:[
              {value:'active',label:AR?'نشط':'Active'},{value:'inactive',label:AR?'غير نشط':'Inactive'},
              {value:'graduated',label:AR?'تخرج':'Graduated'},{value:'withdrawn',label:AR?'منسحب':'Withdrawn'}
            ]
          },
          { key:'notes',        label: AR?'ملاحظات':'Notes', width:12, type:'textarea' },
        ]
      },
      {
        label: AR?'بيانات ولي الأمر':'Guardian Info',
        fields: [
          { key:'guardian.name',     label: AR?'اسم ولي الأمر *':'Guardian Name *', width:6, required:true },
          { key:'guardian.phone',    label: AR?'هاتف ولي الأمر *':'Guardian Phone *', width:6, required:true },
          { key:'guardian.email',    label: AR?'بريد ولي الأمر':'Guardian Email', width:6, type:'email' },
          { key:'guardian.relation', label: AR?'صلة القرابة':'Relation', width:6 },
          { key:'guardian.nationalId',label: AR?'هوية ولي الأمر':'Guardian National ID', width:6 },
        ]
      }
    ]
  };

  return <SectorPage config={config} />;
};
export default StudentsPage;
