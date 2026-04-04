import React, { useEffect, useRef, useState } from 'react';
import bwipjs from 'bwip-js';

/**
 * Unified Barcode Component
 * Renders 1D and 2D barcodes using bwip-js.
 */
const BarcodeUnified = ({ 
  value, 
  format = 'code128', 
  color = '#000000', 
  width, 
  height,
  onError 
}) => {
  const canvasRef = useRef(null);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const renderBarcode = () => {
      try {
        setRenderError(null);
        const bcidMap = {
          'upc': 'upca',
          'qrcode': 'qrcode',
          'datamatrix': 'datamatrix',
          'pdf417': 'pdf417',
          'code128': 'code128',
          'code39': 'code39',
          'ean13': 'ean13',
          'ean8': 'ean8',
          'itf14': 'itf14',
          'msi': 'msi'
        };
        const bcid = bcidMap[format.toLowerCase()] || format.toLowerCase();

        const options = {
          bcid: bcid,
          text: value,
          scale: 3,               // Higher resolution for scannability
          textxalign: 'center',
          barcolor: color.replace('#', ''),
        };

        // Only add height for 1D barcodes
        if (!bcid.includes('matrix') && !bcid.includes('qr') && !bcid.includes('pdf417')) {
          options.height = 10;
          options.includetext = true;
        } else {
          options.includetext = false;
        }

        bwipjs.toCanvas(canvasRef.current, options);
        if (onError) onError(null);
      } catch (e) {
        console.error('Barcode Render Error:', e);
        setRenderError(e.message || 'Invalid Data');
        if (onError) onError(e.message || 'Invalid Data');
      }
    };

    renderBarcode();
  }, [value, format, color, width, height, onError]);

  if (renderError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-red-50/50 border border-red-200 rounded-lg p-2 overflow-hidden">
        <span className="material-symbols-outlined text-red-600 text-xl mb-1">warning</span>
        <span className="text-[9px] font-black uppercase text-red-600 text-center leading-tight">
          Barcode Render Error
        </span>
        <span className="text-[7px] font-medium text-red-500 text-center mt-1">
          {renderError}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  );
};

export default BarcodeUnified;
