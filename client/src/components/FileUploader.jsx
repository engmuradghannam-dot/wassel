import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Chip, IconButton, LinearProgress,
  MenuItem, TextField, Stack, Tooltip
} from '@mui/material';
import {
  CloudUpload, Description, PictureAsPdf, InsertDriveFile,
  Image as ImageIcon, Delete, Download, Close
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { openAuthenticatedFile } from '../utils/authDownload';

const FILE_ICON = (mimeType = '') => {
  if (mimeType.includes('pdf')) return <PictureAsPdf sx={{ fontSize: 18, color: '#d32f2f' }} />;
  if (mimeType.includes('image')) return <ImageIcon sx={{ fontSize: 18, color: '#1976d2' }} />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <Description sx={{ fontSize: 18, color: '#1565c0' }} />;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return <Description sx={{ fontSize: 18, color: '#2e7d32' }} />;
  return <InsertDriveFile sx={{ fontSize: 18, color: '#757575' }} />;
};

/**
 * FileUploader — مكوّن رفع/عرض/حذف ملفات قابل لإعادة الاستخدام عبر كل النظام.
 *
 * uploadUrl: مسار الرفع الفعلي (مثلاً /api/purchase-orders/123/documents)
 * docTypeOptions: قائمة أنواع المستندات المسموحة لهذا السياق (تختلف حسب القسم)
 * existingFiles: المرفقات الموجودة مسبقاً (تُعرض مباشرة، تُحدَّث بعد كل رفع/حذف)
 * onChange: يُستدعى بعد كل رفع/حذف ناجح بقائمة المرفقات المحدثة
 * deleteUrlBuilder: دالة تبني مسار الحذف لكل ملف (fileId) => url
 */
export default function FileUploader({
  uploadUrl, docTypeOptions = [], existingFiles = [], onChange,
  deleteUrlBuilder, label, required = false,
}) {
  const { i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [docType, setDocType] = useState(docTypeOptions[0]?.value || 'other');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // يسمح برفع نفس الملف مرة أخرى لو احتاج المستخدم

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);

      const res = await api.post(uploadUrl, formData);
      const updated = res.data.documents || res.data.attachments || [...existingFiles, res.data.data];
      onChange?.(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || (AR ? 'فشل رفع الملف' : 'Upload failed'));
    } finally {
      setUploading(false);
    }
  }, [docType, uploadUrl, existingFiles, onChange, AR]);

  const handleDelete = useCallback(async (fileId) => {
    if (!deleteUrlBuilder) return;
    try {
      const res = await api.delete(deleteUrlBuilder(fileId));
      const updated = res.data.documents || res.data.attachments || existingFiles.filter(f => (f.fileId || f.url) !== fileId);
      onChange?.(updated);
    } catch (err) {
      setError(err.response?.data?.message || (AR ? 'فشل حذف الملف' : 'Delete failed'));
    }
  }, [deleteUrlBuilder, existingFiles, onChange, AR]);

  return (
    <Box sx={{ mt: 1.5 }}>
      {label && (
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {label}{required && ' *'}
        </Typography>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" sx={{ mb: 1 }}>
        {docTypeOptions.length > 0 && (
          <TextField
            select size="small" value={docType} onChange={e => setDocType(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {docTypeOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{AR ? opt.labelAr : opt.label}</MenuItem>
            ))}
          </TextField>
        )}

        <Button
          component="label" variant="outlined" size="small"
          startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
          disabled={uploading}
        >
          {AR ? 'رفع ملف' : 'Upload File'}
          <input type="file" hidden onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp" />
        </Button>
      </Stack>

      {uploading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          {error}
        </Typography>
      )}

      {existingFiles.length > 0 && (
        <Stack spacing={0.7}>
          {existingFiles.map((f, idx) => {
            const fileId = f.fileId || f.url?.split('/').pop();
            return (
              <Box key={f.fileId || f.url || idx}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, p: 0.8,
                  bgcolor: '#f8f9fa', borderRadius: 1.5, border: '1px solid #eee',
                }}>
                {FILE_ICON(f.mimeType)}
                <Typography variant="caption" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name || f.filename}
                </Typography>
                {f.docType || f.type ? (
                  <Chip label={f.docType || f.type} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                ) : null}
                <Tooltip title={AR ? 'تنزيل / عرض' : 'Download / View'}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const isAbsolute = /^https?:\/\//.test(f.url);
                      if (isAbsolute) {
                        window.open(f.url, '_blank', 'noopener,noreferrer');
                      } else {
                        openAuthenticatedFile(f.url).catch(() =>
                          setError(AR ? 'فشل فتح الملف' : 'Failed to open file'));
                      }
                    }}>
                    <Download sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                {deleteUrlBuilder && (
                  <Tooltip title={AR ? 'حذف' : 'Delete'}>
                    <IconButton size="small" color="error" onClick={() => handleDelete(fileId)}>
                      <Delete sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
