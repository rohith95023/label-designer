import React from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { calcAutoFitFontSize } from '../../utils/autoFitFont';

export default function LabelPreview({ elements, meta, scale = 1 }) {
  const { labelSize, bgColor } = meta;
  const AW = labelSize?.w || 302;
  const AH = labelSize?.h || 454;

  return (
    <div 
      className="pharma-artboard shadow-2xl relative border border-slate-200 dark:border-white/10 overflow-hidden"
      style={{
        width: `${AW * scale}px`,
        height: `${AH * scale}px`,
        backgroundColor: bgColor || '#ffffff',
        transform: 'none',
        flexShrink: 0
      }}
    >
      {[...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map(el => {
        const elW = (el.width || 120) * scale;
        const elH = (el.height || 40) * scale;

        // Auto-fit font size for text elements so translated/long text doesn't overflow
        const isTextEl = !['barcode','qrcode','image','icon','IconsIcon','shape','path','table'].includes(el.type);
        const rawFontSize = el.fontSize || 16;
        const fittedFontSize = isTextEl && el.text
          ? calcAutoFitFontSize(el.text, el.width || 120, el.height || 40, rawFontSize)
          : rawFontSize;
        
        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: (el.x || 0) * scale,
              top: (el.y || 0) * scale,
              width: `${elW}px`,
              height: `${elH}px`,
              zIndex: el.zIndex || 10,
              opacity: el.opacity !== undefined ? el.opacity : 1,
              transform: `rotate(${el.rotation || 0}deg)`,
              transformOrigin: '50% 50%',
            }}
          >
            <div className="w-full h-full relative" style={{
              boxSizing: 'border-box',
              backgroundColor: (el.type === 'shape' && el.shapeType === 'line') ? 'transparent' : (el.bgColor || 'transparent'),
              ...( (el.type === 'shape' && el.shapeType === 'line') 
                ? { borderTop: `${(el.height || 4) * scale}px ${el.borderStyle || 'solid'} ${el.bgColor || '#191c1e'}` } 
                : { border: `${(el.borderWidth || 0) * scale}px ${el.borderStyle || 'solid'} ${el.borderColor || 'transparent'}` }
              ),
              borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : `${(el.borderRadius || 0) * scale}px`,
              fontSize: `${fittedFontSize * scale}px`,
              fontFamily: el.fontFamily || 'Inter, sans-serif',
              fontWeight: el.fontWeight || '400',
              fontStyle: el.fontStyle || 'normal',
              textDecoration: el.textDecoration || 'none',
              color: el.color || '#191c1e',
              textAlign: el.align || 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: el.lineHeight || '1.25',
              letterSpacing: el.letterSpacing ? `${el.letterSpacing * scale}px` : undefined,
              padding: (el.bgColor && el.bgColor !== 'transparent' && el.type !== 'shape') ? `${4 * scale}px ${8 * scale}px` : '0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: el.type === 'shape' ? 'center' : 'flex-start',
              alignItems: el.type === 'shape' ? (el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start') : 'stretch',
            }}>
              {el.type === 'path' && (
                <svg className="w-full h-full" viewBox={`0 0 ${el.width} ${el.height}`} preserveAspectRatio="none">
                  <path d={el.pathData} stroke={el.color || '#191C1E'} strokeWidth={(el.penWidth || 3) * scale} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              
              {el.heading && (
                <span style={{ display: 'block', fontSize: `${8 * scale}px`, fontWeight: '800', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', color: el.alertColor || '#717783', marginBottom: `${2 * scale}px`, letterSpacing: `${1.2 * scale}px` }}>
                  {el.heading}
                </span>
              )}

              {el.type === 'barcode' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Barcode
                    value={el.text || '123456789012'}
                    format={el.barcodeFormat || 'CODE128'}
                    lineColor={el.color || '#191c1e'}
                    background="transparent"
                    width={1.2 * scale}
                    height={Math.max(10, (elH - (32 * scale)))}
                    margin={0}
                    fontSize={12 * scale}
                    displayValue={true}
                  />
                </div>
              ) : el.type === 'qrcode' ? (
                <div className="w-full h-full">
                  <QRCodeSVG
                    value={el.text || 'https://pharma-precision.com/scan'}
                    fgColor={el.color || '#191c1e'}
                    bgColor="transparent"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    level="M"
                  />
                </div>
              ) : el.type === 'image' ? (
                <img src={el.src} alt="Uploaded" className="w-full h-full pointer-events-none" style={{ objectFit: el.imageFit || 'contain' }} />
              ) : el.type === 'icon' ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined leading-[0]" style={{ fontSize: `${Math.min(elW, elH)}px`, color: el.color || '#191c1e' }}>{el.iconName}</span>
                </div>
              ) : el.type === 'IconsIcon' ? (
                <div className="w-full h-full flex items-center justify-center pointer-events-none" dangerouslySetInnerHTML={{ __html: el.svg }} />
              ) : el.type === 'table' ? (
                <table className="w-full h-full table-fixed" style={{ borderCollapse: 'collapse' }}>
                  <tbody>
                    {(el.text || '').split('\n').map((row, i) => (
                      <tr key={i} style={{ backgroundColor: el.tableStriped && i > 0 && i % 2 === 0 ? 'rgba(0,0,0,0.04)' : undefined }}>
                        {row.split('|').map((cell, j) => (
                          <td key={j}
                            className="p-0 px-1 break-words relative overflow-hidden"
                            style={{
                              borderColor: el.color || '#94a3b8',
                              borderWidth: `${(el.borderWidth || 1) * scale}px`,
                              borderStyle: 'solid',
                              fontSize: el.fontSize ? `${el.fontSize * scale}px` : undefined,
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{
                  backgroundImage: el.backgroundImage || undefined,
                  WebkitBackgroundClip: el.WebkitBackgroundClip || undefined,
                  WebkitTextFillColor: el.WebkitTextFillColor || undefined,
                  textShadow: el.textShadow || 'none',
                  WebkitTextStroke: el.WebkitTextStroke || undefined,
                  width: '100%',
                  height: '100%',
                }}>
                  {el.text}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
