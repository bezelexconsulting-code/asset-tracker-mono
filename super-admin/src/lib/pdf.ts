function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
async function dataUrlToJPEGBytes(dataUrl: string): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const isJpeg = /^data:image\/jpe?g/i.test(dataUrl);
  let url = dataUrl; let width = 0; let height = 0;
  if (!isJpeg) {
    const img = new Image(); img.src = dataUrl; await img.decode().catch(() => {});
    width = img.naturalWidth || 600; height = img.naturalHeight || 400;
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
    url = canvas.toDataURL('image/jpeg', 0.92);
  }
  const match = url.match(/^data:image\/jpe?g;base64,(.*)$/i);
  if (!match) {
    const blank = atob('/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhISEhISEBISEhISEhISEhISEhIQFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0fHy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAABAgMEBQYHB//EADwQAAIBAwMBBQYEBQQDAAAAAAECAwAEEQUSITEGBxMiQVFhMnGBBxQjQmKx0RQzYnKSodLwU3PC/8QAGQEAAwEBAQAAAAAAAAAAAAAAAAECAwQF/8QAIBEBAQADAQEAAwEAAAAAAAAAAAECESESMUFRcRP/2gAMAwEAAhEDEQA/APyQAAAAAAABABAAAAAAAAB//2Q==');
    const arr = new Uint8Array(blank.length);
    for (let i = 0; i < blank.length; i++) arr[i] = blank.charCodeAt(i);
    return { bytes: arr, width: 100, height: 60 };
  }
  const b64 = match[1]; const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  if (width === 0 || height === 0) {
    const img = new Image(); img.src = dataUrl; await img.decode().catch(() => {});
    width = img.naturalWidth || 600; height = img.naturalHeight || 400;
  }
  return { bytes, width, height };
}
export async function generatePDF(options: {
  title: string; subtitle?: string; paragraphs?: string[]; images?: string[];
  headerFields?: Array<{ label: string; value: string }>; pageFooter?: string;
}): Promise<Blob> {
  const A4 = { w: 595, h: 842 }; const objects: string[] = []; const offsets: number[] = [];
  function addObject(str: string) { offsets.push(header.length + objects.join('').length); objects.push(str); }
  const header = '%PDF-1.4\n';
  const imgs = (options.images || []); const imgObjs: Array<{ objIndex: number; name: string; w: number; h: number }> = []; let imgCount = 0;
  for (const dataUrl of imgs) {
    const { bytes, width, height } = await dataUrlToJPEGBytes(dataUrl);
    const name = `Im${imgCount}`; const stream = `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`;
    const footer = '\nendstream\n'; const content = stream + Array.from(bytes).map((b) => String.fromCharCode(b)).join('') + footer;
    addObject(`4 ${imgCount} obj\n${content}endobj\n`); imgObjs.push({ objIndex: objects.length, name, w: width, h: height }); imgCount++;
  }
  const fontObjNum = objects.length + 5; addObject(`${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  const margin = 40; const colW = (A4.w - margin * 2 - 20) / 3; const colH = 90; const gap = 10; const imgsPerRow = 3; const rowsAvailable = 4; const imgsPerPage = imgsPerRow * rowsAvailable;
  const pages: string[] = []; const totalPages = Math.max(1, Math.ceil(imgObjs.length / imgsPerPage));
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    let contents = ''; let y = A4.h - margin - 20;
    contents += `BT /F1 16 Tf ${margin} ${y} Td (${escapePdfText(options.title)}) Tj ET\n`; y -= 24;
    if (options.subtitle) { contents += `BT /F1 12 Tf ${margin} ${y} Td (${escapePdfText(options.subtitle)}) Tj ET\n`; y -= 20; }
    for (const hf of options.headerFields || []) { contents += `BT /F1 11 Tf ${margin} ${y} Td (${escapePdfText(hf.label + ': ' + hf.value)}) Tj ET\n`; y -= 16; }
    for (const p of options.paragraphs || []) { contents += `BT /F1 11 Tf ${margin} ${y} Td (${escapePdfText(p)}) Tj ET\n`; y -= 16; }
    const start = pageIndex * imgsPerPage; const slice = imgObjs.slice(start, start + imgsPerPage);
    let col = 0; let row = 0; let imIndex = start;
    for (const _ of slice) {
      const x = margin + col * (colW + gap); const imgW = colW; const imgH = colH; const yImgTop = A4.h - margin - 160 - row * (imgH + gap);
      contents += `q\n${imgW} 0 0 ${imgH} ${x} ${yImgTop - imgH} cm\n/Im${imIndex} Do\nQ\n`;
      col++; if (col >= 3) { col = 0; row++; } imIndex++;
    }
    const footerText = `${options.pageFooter || ''}    Page ${pageIndex + 1} of ${totalPages}`.trim();
    contents += `BT /F1 10 Tf ${margin} 30 Td (${escapePdfText(footerText)}) Tj ET\n`; pages.push(contents);
  }
  const xObjectEntries = imgObjs.map((_, i) => `/Im${i} ${4 + i} 0 R`).join(' '); const resObjNum = objects.length + 6;
  addObject(`${resObjNum} 0 obj\n<< /ProcSet [/PDF /Text /ImageC] /Font << /F1 ${fontObjNum} 0 R >> /XObject << ${xObjectEntries} >> >>\nendobj\n`);
  const pageObjNums: number[] = [];
  const pagesObjNum = objects.length + 7;
  pages.forEach((contents, idx) => {
    const contentsStr = `<< /Length ${contents.length} >>\nstream\n${contents}\nendstream\n`; const contentsObjNum = objects.length + 7 + idx * 2;
    addObject(`${contentsObjNum} 0 obj\n${contentsStr}endobj\n`); const pageObjNum = contentsObjNum + 1;
    addObject(`${pageObjNum} 0 obj\n<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] /Resources ${resObjNum} 0 R /Contents ${contentsObjNum} 0 R >>\nendobj\n`);
    pageObjNums.push(pageObjNum);
  });
  addObject(`${pagesObjNum} 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageObjNums.length} >>\nendobj\n`);
  const catalogObjNum = pagesObjNum + 1; addObject(`${catalogObjNum} 0 obj\n<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>\nendobj\n`);
  const body = objects.join(''); const xrefPos = (header + body).length; const totalObjs = objects.length + 0;
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < totalObjs; i++) { const off = offsets[i] || 0; xref += `${String(off).padStart(10, '0')} 00000 n \n`; }
  const trailer = `trailer\n<< /Size ${totalObjs + 1} /Root ${catalogObjNum} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  const pdfStr = header + body + xref + trailer; return new Blob([pdfStr], { type: 'application/pdf' });
}
export async function downloadPDF(filename: string, opts: Parameters<typeof generatePDF>[0]) {
  const blob = await generatePDF(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
