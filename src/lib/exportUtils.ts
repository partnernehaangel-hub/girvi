import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToPDF = (title: string, headers: string[], data: any[][], filename: string) => {
  const doc = new jsPDF();
  
  // Add Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 30);
  
  // @ts-ignore
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [44, 90, 160], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  doc.save(`${filename}.pdf`);
};

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const printTable = (title: string, headers: string[], data: any[][]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #2C5AA0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">
          © ${new Date().getFullYear()} Girvi Loan Management System
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
