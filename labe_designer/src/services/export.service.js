import html2canvas from 'html2canvas';

// Dynamically import jsPDF to keep bundle size small if not used
export async function exportToPNG(elementId, filename = 'label-export.png') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  const canvas = await html2canvas(element, { 
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });
  
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function exportToPDF(elementId, filename = 'label-export.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  
  // Dynamic import of jsPDF
  const { jsPDF } = await import('jspdf');
  
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width / 2, canvas.height / 2]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(filename);
}

export function printLabel(elementId) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');
  
  // Simple print approach: open a minimal window with the content
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Preview</title>
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 2rem; 
            display: flex;
            justify-content: center;
          }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${element.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
