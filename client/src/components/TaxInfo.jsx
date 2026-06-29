import React from 'react';
import { Box, Typography, Chip, Paper, Alert, Tooltip, Grid } from '@mui/material';
import { Info, AccountBalance, Receipt } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { BUILT_IN_COUNTRIES } from './CountrySelector';

/**
 * Shows tax information for a given country
 * countryCode: 'SA' | 'AE' | etc.
 * compact: show minimal info
 */
const TAX_DB = {
  SA: { taxes:[{key:'vat',name:'ضريبة القيمة المضافة (VAT)',nameEn:'VAT',rate:15,applies:true,color:'#1a73e8'},{key:'zakat',name:'زكاة الأعمال',nameEn:'Zakat',rate:2.5,applies:true,color:'#34a853',note:'للشركات السعودية'},{key:'withholding',name:'ضريبة الاستقطاع',nameEn:'Withholding',rate:5,applies:true,color:'#f57c00'},{key:'corporate',name:'ضريبة دخل الشركات الأجنبية',nameEn:'Corporate (Foreign)',rate:20,applies:true,color:'#7b1fa2'}], authority:'ZATCA', url:'https://zatca.gov.sa', eInvoicing:true },
  AE: { taxes:[{key:'vat',name:'ضريبة القيمة المضافة',nameEn:'VAT',rate:5,applies:true,color:'#1a73e8'},{key:'corporate',name:'ضريبة الشركات (>375k AED)',nameEn:'Corporate Tax',rate:9,applies:true,color:'#7b1fa2'}], authority:'FTA', eInvoicing:false },
  KW: { taxes:[{key:'vat',name:'لا توجد ضريبة مبيعات',nameEn:'No VAT',rate:0,applies:false,color:'#546e7a'},{key:'corporate',name:'ضريبة الدخل (شركات أجنبية)',nameEn:'Corporate (Foreign)',rate:15,applies:true,color:'#7b1fa2'}], authority:'Ministry of Finance', eInvoicing:false },
  QA: { taxes:[{key:'vat',name:'لا توجد ضريبة مبيعات',nameEn:'No VAT',rate:0,applies:false,color:'#546e7a'},{key:'corporate',name:'ضريبة الدخل',nameEn:'Corporate Tax',rate:10,applies:true,color:'#7b1fa2'},{key:'withholding',name:'ضريبة الاستقطاع',nameEn:'Withholding',rate:5,applies:true,color:'#f57c00'}], authority:'GTA', eInvoicing:false },
  BH: { taxes:[{key:'vat',name:'ضريبة القيمة المضافة',nameEn:'VAT',rate:10,applies:true,color:'#1a73e8'}], authority:'NBR', eInvoicing:false },
  OM: { taxes:[{key:'vat',name:'ضريبة القيمة المضافة',nameEn:'VAT',rate:5,applies:true,color:'#1a73e8'},{key:'corporate',name:'ضريبة الدخل',nameEn:'Corporate Tax',rate:15,applies:true,color:'#7b1fa2'}], authority:'Oman Tax Authority', eInvoicing:false },
  EG: { taxes:[{key:'vat',name:'ضريبة القيمة المضافة',nameEn:'VAT',rate:14,applies:true,color:'#1a73e8'},{key:'corporate',name:'ضريبة الدخل على الشركات',nameEn:'Corporate Tax',rate:22.5,applies:true,color:'#7b1fa2'}], authority:'ETA', eInvoicing:true },
  JO: { taxes:[{key:'vat',name:'ضريبة المبيعات',nameEn:'Sales Tax',rate:16,applies:true,color:'#1a73e8'},{key:'corporate',name:'ضريبة الدخل',nameEn:'Corporate Tax',rate:20,applies:true,color:'#7b1fa2'}], authority:'ISTD Jordan', eInvoicing:false },
  IN: { taxes:[{key:'vat',name:'GST (18% standard)',nameEn:'GST',rate:18,applies:true,color:'#1a73e8',note:'0/5/12/18/28%'},{key:'corporate',name:'Corporate Tax',nameEn:'Corporate Tax',rate:25,applies:true,color:'#7b1fa2'},{key:'tds',name:'TDS',nameEn:'Tax Deducted at Source',rate:10,applies:true,color:'#f57c00'}], authority:'CBIC / IT Dept', eInvoicing:true },
  PK: { taxes:[{key:'vat',name:'GST',nameEn:'GST',rate:17,applies:true,color:'#1a73e8'},{key:'corporate',name:'Corporate Tax',nameEn:'Corporate Tax',rate:29,applies:true,color:'#7b1fa2'}], authority:'FBR Pakistan', eInvoicing:false },
  TR: { taxes:[{key:'vat',name:'KDV',nameEn:'VAT',rate:20,applies:true,color:'#1a73e8',note:'1/10/20%'},{key:'corporate',name:'Kurumlar Vergisi',nameEn:'Corporate Tax',rate:25,applies:true,color:'#7b1fa2'}], authority:'GİB Turkey', eInvoicing:true },
  DE: { taxes:[{key:'vat',name:'MwSt / USt',nameEn:'VAT',rate:19,applies:true,color:'#1a73e8',note:'7% reduced'},{key:'corporate',name:'Körperschaftsteuer',nameEn:'Corporate Tax',rate:15,applies:true,color:'#7b1fa2'},{key:'trade',name:'Gewerbesteuer',nameEn:'Trade Tax',rate:14,applies:true,color:'#f57c00'}], authority:'BZSt Germany', eInvoicing:false },
  FR: { taxes:[{key:'vat',name:'TVA',nameEn:'VAT',rate:20,applies:true,color:'#1a73e8',note:'5.5/10/20%'},{key:'corporate',name:'Impôt sur les Sociétés',nameEn:'Corporate Tax',rate:25,applies:true,color:'#7b1fa2'}], authority:'DGFiP France', eInvoicing:false },
  GB: { taxes:[{key:'vat',name:'Value Added Tax',nameEn:'VAT',rate:20,applies:true,color:'#1a73e8',note:'5% reduced'},{key:'corporate',name:'Corporation Tax',nameEn:'Corporation Tax',rate:25,applies:true,color:'#7b1fa2'}], authority:'HMRC UK', eInvoicing:false },
  US: { taxes:[{key:'sales',name:'State Sales Tax (avg)',nameEn:'Sales Tax',rate:7.5,applies:true,color:'#f57c00',note:'0-13% by state'},{key:'corporate',name:'Federal Corporate Tax',nameEn:'Corporate Tax',rate:21,applies:true,color:'#7b1fa2'}], authority:'IRS USA', eInvoicing:false },
  CN: { taxes:[{key:'vat',name:'增值税 VAT',nameEn:'VAT',rate:13,applies:true,color:'#1a73e8',note:'6/9/13%'},{key:'corporate',name:'企业所得税 CIT',nameEn:'Corporate Tax',rate:25,applies:true,color:'#7b1fa2'}], authority:'SAT China', eInvoicing:true },
  ID: { taxes:[{key:'vat',name:'PPN',nameEn:'VAT',rate:11,applies:true,color:'#1a73e8'},{key:'corporate',name:'PPh Badan',nameEn:'Corporate Tax',rate:22,applies:true,color:'#7b1fa2'}], authority:'DJP Indonesia', eInvoicing:true },
};

const TaxInfo = ({ countryCode, compact=false }) => {
  const { i18n } = useTranslation();
  const AR = ['ar','ur'].includes(i18n.language);

  const country = BUILT_IN_COUNTRIES.find(c => c.code === countryCode);
  const taxData  = TAX_DB[countryCode];

  if (!country || !taxData) return null;

  if (compact) {
    const mainVAT = taxData.taxes.find(t => t.key === 'vat' || t.key === 'sales');
    return (
      <Box sx={{ display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
        <Typography sx={{ fontSize:16 }}>{country.flag}</Typography>
        <Typography variant="body2" fontWeight={600}>{AR ? country.name : country.nameEn}</Typography>
        {mainVAT && (
          <Chip
            label={mainVAT.applies ? `${AR ? mainVAT.name : mainVAT.nameEn}: ${mainVAT.rate}%` : (AR ? 'لا توجد ضريبة مبيعات' : 'No Sales Tax')}
            size="small"
            color={mainVAT.applies ? 'primary' : 'default'}
            sx={{ fontSize:'0.7rem' }}
          />
        )}
        {taxData.eInvoicing && (
          <Chip label={AR ? 'الفوترة الإلكترونية مطلوبة' : 'E-Invoicing Required'} size="small" color="warning" sx={{ fontSize:'0.65rem' }}/>
        )}
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p:2, borderRadius:2, bgcolor:'#f8f9fa' }}>
      {/* Header */}
      <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:2 }}>
        <Typography sx={{ fontSize:28 }}>{country.flag}</Typography>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {AR ? country.name : country.nameEn}
          </Typography>
          <Box sx={{ display:'flex', gap:0.5 }}>
            <Chip label={country.currency} size="small" sx={{ fontSize:'0.65rem', height:18 }}/>
            {taxData.eInvoicing && (
              <Chip label={AR?'فوترة إلكترونية إلزامية':'E-Invoicing Mandatory'} size="small" color="warning" sx={{ fontSize:'0.65rem', height:18 }}/>
            )}
          </Box>
        </Box>
        {taxData.authority && (
          <Box sx={{ ml:'auto', textAlign:'right' }}>
            <Typography variant="caption" color="text.secondary" display="block">{AR?'الجهة الضريبية':'Tax Authority'}</Typography>
            <Typography variant="caption" fontWeight={600}>{taxData.authority}</Typography>
          </Box>
        )}
      </Box>

      {/* Tax list */}
      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb:1, textTransform:'uppercase', letterSpacing:0.8 }}>
        {AR ? 'الضرائب المعمول بها' : 'Applicable Taxes'}
      </Typography>
      <Grid container spacing={1}>
        {taxData.taxes.map((tax, i) => (
          <Grid item xs={12} sm={6} key={i}>
            <Box sx={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              p:1.2, bgcolor:'white', borderRadius:1.5,
              border:'1px solid', borderColor: tax.applies ? `${tax.color}40` : '#eee'
            }}>
              <Box sx={{ flex:1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: tax.applies ? 'text.primary' : 'text.disabled' }}>
                  {AR ? tax.name : tax.nameEn}
                </Typography>
                {tax.note && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize:'0.6rem' }}>
                    {tax.note}
                  </Typography>
                )}
              </Box>
              <Chip
                label={tax.applies ? `${tax.rate}%` : (AR ? 'لا يطبّق' : 'N/A')}
                size="small"
                sx={{
                  bgcolor: tax.applies ? `${tax.color}18` : '#f5f5f5',
                  color:   tax.applies ? tax.color : '#aaa',
                  fontWeight:700, fontSize:'0.7rem', flexShrink:0
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default TaxInfo;
