/**
 * services/pdfService.js
 * ───────────────────────────────────────────────────────────────────────
 * توليد مستندات PDF حقيقية لعروض الأسعار، الفواتير، وأوامر الشراء.
 * يُستخدم pdfkit مباشرة (بدون Puppeteer/Chromium) لأنه أخف وأكثر
 * موثوقية على بيئات استضافة محدودة الموارد مثل الطبقة المجانية في Render.
 *
 * كل مستند يُنشأ كـ Buffer في الذاكرة، يُرسَل مباشرة في الاستجابة،
 * ثم اختيارياً يُحفظ نسخة دائمة في GridFS (لإمكانية إعادة فتحه لاحقاً
 * من سجل المرفقات دون إعادة توليده).
 */

const PDFDocument = require('pdfkit');

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * generateDocumentPDF — يبني PDF لعرض سعر / فاتورة / أمر شراء
 * @param {Object} opts
 * @param {String} opts.docType    - 'quotation' | 'invoice' | 'purchase_order'
 * @param {Object} opts.company    - بيانات الشركة المُصدِرة (name, vatNumber, commercialReg, address, phone, email)
 * @param {Object} opts.party      - بيانات العميل أو المورد (name, vatNumber, commercialReg, address, phone)
 * @param {String} opts.docNumber  - رقم المستند
 * @param {Date}   opts.date       - تاريخ الإصدار
 * @param {Date}   [opts.dueDate]  - تاريخ الاستحقاق / الصلاحية
 * @param {Array}  opts.items      - [{description, quantity, unit, unitPrice, taxRate, total}]
 * @param {Object} opts.totals     - {subtotal, taxAmount, total}
 * @param {String} [opts.notes]
 * @returns {Promise<Buffer>}
 */
function generateDocumentPDF(opts) {
  return new Promise((resolve, reject) => {
    try {
      const { docType, company, party, docNumber, date, dueDate, items = [], totals = {}, notes } = opts;

      const TITLES = {
        quotation: { ar: 'عرض سعر', en: 'QUOTATION' },
        invoice: { ar: 'فاتورة ضريبية', en: 'TAX INVOICE' },
        purchase_order: { ar: 'أمر شراء', en: 'PURCHASE ORDER' },
      };
      const title = TITLES[docType] || { ar: 'مستند', en: 'DOCUMENT' };
      const partyLabel = docType === 'purchase_order' ? { ar: 'المورد', en: 'Supplier' } : { ar: 'العميل', en: 'Customer' };

      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── الترويسة ──────────────────────────────────────────────────────
      // ── ملاحظة مهمة: pdfkit بخطوطه القياسية لا يدعم رسم الحروف العربية
      // (تظهر كرموز تالفة). الحل الحالي: نُفضّل nameEn عند توفره لتفادي
      // أي نص عربي في الترويسة. لدعم العربية الكامل لاحقاً يلزم تضمين
      // خط TTF يدعم Unicode عربي (مثل Amiri/Noto Naskh) عبر doc.font(path).
      const headerName = (company?.nameEn && company.nameEn.trim()) || company?.name || 'Wassel ERP';
      doc.fontSize(20).fillColor('#1a73e8').text(headerName, 40, 40);
      if (company?.name && company?.nameEn && company.name !== company.nameEn) {
        // الاسم العربي يُكتب فقط كمرجع نصي صغير؛ لا يُعتمد عليه للقراءة المباشرة حتى يُضاف دعم خط عربي
        doc.fontSize(8).fillColor('#999').text('AR: ' + company.name, 40, 64, { width: 250 });
      }

      doc.fontSize(24).fillColor('#222').text(title.en, 40, 40, { align: 'right' });
      doc.fontSize(11).fillColor('#666').text(`# ${docNumber}`, { align: 'right' });

      doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#e0e0e0').stroke();

      // ── معلومات الشركة المُصدِرة ──────────────────────────────────────
      let y = 115;
      doc.fontSize(9).fillColor('#444');
      if (company?.commercialReg) { doc.text(`CR: ${company.commercialReg}`, 40, y); y += 14; }
      if (company?.vatNumber) { doc.text(`VAT: ${company.vatNumber}`, 40, y); y += 14; }
      if (company?.address) { doc.text(company.address, 40, y); y += 14; }
      if (company?.phone) { doc.text(`Tel: ${company.phone}`, 40, y); y += 14; }

      // ── معلومات الطرف الآخر + التواريخ (يمين) ──────────────────────────
      let yr = 115;
      doc.fontSize(10).fillColor('#1a73e8').text(`${partyLabel.en}:`, 350, yr); yr += 16;
      doc.fontSize(9).fillColor('#222').text(party?.name || '-', 350, yr); yr += 14;
      if (party?.commercialReg) { doc.fillColor('#666').text(`CR: ${party.commercialReg}`, 350, yr); yr += 14; }
      if (party?.vatNumber) { doc.text(`VAT: ${party.vatNumber}`, 350, yr); yr += 14; }
      if (party?.phone) { doc.text(`Tel: ${party.phone}`, 350, yr); yr += 14; }

      yr += 6;
      doc.fontSize(9).fillColor('#444');
      doc.text(`Date: ${date ? new Date(date).toLocaleDateString('en-GB') : '-'}`, 350, yr); yr += 14;
      if (dueDate) {
        const label = docType === 'quotation' ? 'Valid Until' : 'Due Date';
        doc.text(`${label}: ${new Date(dueDate).toLocaleDateString('en-GB')}`, 350, yr); yr += 14;
      }

      // ── جدول البنود ───────────────────────────────────────────────────
      let tableTop = Math.max(y, yr) + 20;
      const colX = { desc: 40, qty: 290, price: 350, tax: 420, total: 480 };

      doc.rect(40, tableTop, 515, 22).fill('#1a73e8');
      doc.fillColor('#fff').fontSize(9);
      doc.text('Description', colX.desc + 6, tableTop + 6);
      doc.text('Qty', colX.qty, tableTop + 6, { width: 50, align: 'center' });
      doc.text('Unit Price', colX.price, tableTop + 6, { width: 60, align: 'right' });
      doc.text('VAT %', colX.tax, tableTop + 6, { width: 50, align: 'center' });
      doc.text('Total', colX.total, tableTop + 6, { width: 70, align: 'right' });

      let rowY = tableTop + 22;
      doc.fillColor('#222').fontSize(9);

      items.forEach((it, idx) => {
        const rowH = 20;
        if (rowY + rowH > 770) { doc.addPage(); rowY = 40; }
        if (idx % 2 === 1) doc.rect(40, rowY, 515, rowH).fill('#f8f9fa').fillColor('#222');

        doc.fillColor('#222');
        doc.text(it.description || it.name || '-', colX.desc + 6, rowY + 5, { width: 240 });
        doc.text(String(it.quantity ?? '-'), colX.qty, rowY + 5, { width: 50, align: 'center' });
        doc.text(fmt(it.unitPrice), colX.price, rowY + 5, { width: 60, align: 'right' });
        doc.text(`${it.taxRate ?? 15}%`, colX.tax, rowY + 5, { width: 50, align: 'center' });
        doc.text(fmt(it.total ?? (it.quantity * it.unitPrice)), colX.total, rowY + 5, { width: 70, align: 'right' });
        rowY += rowH;
      });

      doc.moveTo(40, rowY).lineTo(555, rowY).strokeColor('#e0e0e0').stroke();
      rowY += 10;

      // ── الإجماليات ────────────────────────────────────────────────────
      const totalsX = 380;
      doc.fontSize(9).fillColor('#666');
      doc.text('Subtotal:', totalsX, rowY, { width: 100 });
      doc.fillColor('#222').text(fmt(totals.subtotal), totalsX + 100, rowY, { width: 75, align: 'right' });
      rowY += 16;

      doc.fillColor('#666').text('VAT:', totalsX, rowY, { width: 100 });
      doc.fillColor('#222').text(fmt(totals.taxAmount), totalsX + 100, rowY, { width: 75, align: 'right' });
      rowY += 16;

      doc.moveTo(totalsX, rowY).lineTo(555, rowY).strokeColor('#1a73e8').stroke();
      rowY += 6;

      doc.fontSize(12).fillColor('#1a73e8').text('Total:', totalsX, rowY, { width: 100 });
      doc.text(fmt(totals.total), totalsX + 100, rowY, { width: 75, align: 'right' });
      rowY += 30;

      // ── ملاحظات ───────────────────────────────────────────────────────
      if (notes) {
        doc.fontSize(9).fillColor('#666').text('Notes:', 40, rowY);
        doc.fillColor('#444').text(notes, 40, rowY + 14, { width: 515 });
      }

      // ── تذييل ─────────────────────────────────────────────────────────
      doc.fontSize(8).fillColor('#999').text(
        'Generated by Wassel ERP', 40, 800, { width: 515, align: 'center' }
      );

      doc.end();
    } catch (err) { reject(err); }
  });
}

module.exports = { generateDocumentPDF };
