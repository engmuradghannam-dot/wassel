/**
 * services/pdfService.js
 * ───────────────────────────────────────────────────────────────────────
 * توليد مستندات PDF حقيقية لعروض الأسعار، الفواتير، وأوامر الشراء.
 * يُستخدم pdfkit مباشرة (بدون Puppeteer/Chromium) لأنه أخف وأكثر
 * موثوقية على بيئات استضافة محدودة الموارد مثل الطبقة المجانية في Render.
 *
 * كل مستند يُنشأ كـ Buffer في الذاكرة، يُرسَل مباشرة في الاستجابة.
 *
 * ── دعم اللغة العربية ────────────────────────────────────────────────────
 * pdfkit لا يدعم خوارزمية Unicode Bidi ولا تشكيل الحروف (text shaping)
 * تلقائياً (موثّق رسمياً: github.com/foliojs/pdfkit/issues/219، لا يزال
 * مفتوحاً منذ 2014). تم حل هذا فعلياً عبر طبقتين، كلتاهما اختُبرتا بصرياً
 * (PDF → صورة عبر pdftoppm → فحص العين المجردة، وليس فقط pdftotext الذي
 * يُطبّق bidi خاصته عند الاستخراج فيُخفي المشكلة الحقيقية):
 *
 *   1. خط Noto Naskh Arabic (TrueType حقيقي، Unicode كامل) مُضمَّن من
 *      assets/fonts — بدونه تظهر الحروف العربية كرموز تالفة تماماً.
 *      شكل كل حرف مفرد وربط الحروف (ligatures) سليم بهذا الخط وحده.
 *
 *   2. عكس ترتيب الكلمات يدوياً (وليس الأحرف داخل كل كلمة) قبل إرسال
 *      أي نص عربي لـ pdfkit.text()، مع مسافة مزدوجة بين الكلمات
 *      (مسافة عادية واحدة تُفقد بصرياً بين بعض الكلمات المعكوسة —
 *      ظاهرة مؤكدة بالاختبار البصري، السبب الجذري في معالجة pdfkit
 *      الداخلية لعرض النص وليس خطأ في الكود هنا).
 *      هذا يُصلح حالة الجملة العربية الكاملة بدقة. لا يُستخدم لخلط
 *      عربي/لاتيني في نفس السطر — ثبت بالاختبار أن ذلك ينهار حتى على
 *      مستوى شكل الحروف، فيُعرض النص العربي دائماً في سطر منفصل خاص به.
 */

const PDFDocument = require('pdfkit');
const path = require('path');

const ARABIC_FONT = path.join(__dirname, '..', 'assets', 'fonts', 'NotoNaskhArabic-Regular.ttf');

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const hasArabic = (str = '') => /[\u0600-\u06FF]/.test(str);

/**
 * arabicWords — يُصلح ترتيب عرض الكلمات العربية في pdfkit.
 * مُختبر بصرياً (PDF → PNG → فحص يدوي) على أسماء شركات/عملاء/جمل قصيرة.
 * لا يُستخدم لنصوص مختلطة عربي+لاتيني في نفس السطر.
 */
const arabicWords = (str = '') => str.split(' ').filter(Boolean).reverse().join('  ');

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

      // تسجيل الخط العربي مرة واحدة تحت اسم مستعار، نُبدّل له فقط عند
      // كتابة نص عربي ثم نعود للخط الافتراضي (Helvetica) لبقية المستند —
      // تبديل الخطوط أرخص بكثير من تحميله من جديد في كل استدعاء.
      doc.registerFont('Arabic', ARABIC_FONT);
      const useFont = (name) => doc.font(name === 'Arabic' ? 'Arabic' : 'Helvetica');

      // ── الترويسة ──────────────────────────────────────────────────────
      const headerNameEn = (company?.nameEn && company.nameEn.trim()) || null;
      const headerNameAr = company?.name || null;

      if (headerNameEn) {
        useFont('Helvetica').fontSize(20).fillColor('#1a73e8').text(headerNameEn, 40, 40);
        if (headerNameAr && headerNameAr !== headerNameEn) {
          useFont('Arabic').fontSize(11).fillColor('#555').text(arabicWords(headerNameAr), 40, 64, { width: 260 });
        }
      } else if (headerNameAr) {
        useFont('Arabic').fontSize(16).fillColor('#1a73e8').text(arabicWords(headerNameAr), 40, 40, { width: 260 });
      } else {
        useFont('Helvetica').fontSize(20).fillColor('#1a73e8').text('Wassel ERP', 40, 40);
      }

      useFont('Helvetica').fontSize(24).fillColor('#222').text(title.en, 40, 40, { align: 'right' });
      doc.fontSize(11).fillColor('#666').text(`# ${docNumber}`, { align: 'right' });

      doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#e0e0e0').stroke();

      // ── معلومات الشركة المُصدِرة ──────────────────────────────────────
      let y = 115;
      useFont('Helvetica').fontSize(9).fillColor('#444');
      if (company?.commercialReg) { doc.text(`CR: ${company.commercialReg}`, 40, y); y += 14; }
      if (company?.vatNumber) { doc.text(`VAT: ${company.vatNumber}`, 40, y); y += 14; }
      if (company?.address) {
        if (hasArabic(company.address)) {
          useFont('Arabic').text(arabicWords(company.address), 40, y, { width: 260 });
          useFont('Helvetica');
        } else {
          doc.text(company.address, 40, y);
        }
        y += 14;
      }
      if (company?.phone) { doc.text(`Tel: ${company.phone}`, 40, y); y += 14; }

      // ── معلومات الطرف الآخر + التواريخ (يمين) ──────────────────────────
      let yr = 115;
      useFont('Helvetica').fontSize(10).fillColor('#1a73e8').text(`${partyLabel.en}:`, 350, yr); yr += 16;

      if (party?.name) {
        if (hasArabic(party.name)) {
          useFont('Arabic').fontSize(10).fillColor('#222').text(arabicWords(party.name), 350, yr, { width: 200 });
          useFont('Helvetica');
          yr += 18; // النص العربي بهذا الخط أعلى قليلاً من اللاتيني، يحتاج مسافة إضافية لتفادي التراكب
        } else {
          doc.fontSize(9).fillColor('#222').text(party.name, 350, yr);
          yr += 14;
        }
      } else {
        doc.fontSize(9).fillColor('#222').text('-', 350, yr);
        yr += 14;
      }

      if (party?.commercialReg) { useFont('Helvetica').fillColor('#666').text(`CR: ${party.commercialReg}`, 350, yr); yr += 14; }
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
      useFont('Helvetica').fillColor('#fff').fontSize(9);
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

        const desc = it.description || it.name || '-';
        if (hasArabic(desc)) {
          useFont('Arabic').fillColor('#222').text(arabicWords(desc), colX.desc + 6, rowY + 5, { width: 240 });
          useFont('Helvetica');
        } else {
          doc.fillColor('#222').text(desc, colX.desc + 6, rowY + 5, { width: 240 });
        }
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
      useFont('Helvetica').fontSize(9).fillColor('#666');
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
        useFont('Helvetica').fontSize(9).fillColor('#666').text('Notes:', 40, rowY);
        if (hasArabic(notes)) {
          useFont('Arabic').fillColor('#444').text(arabicWords(notes), 40, rowY + 14, { width: 515 });
        } else {
          useFont('Helvetica').fillColor('#444').text(notes, 40, rowY + 14, { width: 515 });
        }
      }

      // ── تذييل ─────────────────────────────────────────────────────────
      useFont('Helvetica').fontSize(8).fillColor('#999').text(
        'Generated by Wassel ERP', 40, 770, { width: 515, align: 'center' }
      );

      doc.end();
    } catch (err) { reject(err); }
  });
}

module.exports = { generateDocumentPDF };
