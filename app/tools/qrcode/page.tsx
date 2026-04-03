"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

export default function QRCodePage() {
  const [text, setText] = useState("");
  const [colorDark, setColorDark] = useState("#000000");
  const [colorLight, setColorLight] = useState("#ffffff");
  const [transparentBg, setTransparentBg] = useState(false);
  const [margin, setMargin] = useState(1);
  const [ecc, setEcc] = useState<"L" | "M" | "Q" | "H">("M");
  
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [rasterQuality, setRasterQuality] = useState(1024);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 로고 업로드 처리
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setLogoImg(img);
        setEcc("H"); // 로고가 들어가면 인식률을 위해 오류 복원율을 H(최고)로 강제 상향
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoImg(null);
    setLogoName(null);
    setEcc("M");
    const fileInput = document.getElementById('logoInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // 실시간 QR 미리보기 렌더링
  useEffect(() => {
    const generatePreview = async () => {
      if (!text || !canvasRef.current) return;
      
      try {
        await QRCode.toCanvas(canvasRef.current, text, {
          errorCorrectionLevel: ecc,
          margin: margin,
          color: {
            dark: colorDark,
            light: transparentBg ? '#00000000' : colorLight
          },
          width: 1024 // 내부 해상도는 고화질로 렌더링
        });

        // 🔥 여기가 핵심 픽스입니다! 라이브러리가 강제로 박아버린 1024px CSS를 100%로 강제 변경
        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = '100%';

        // 로고가 있으면 캔버스 정중앙에 그리기
        if (logoImg) {
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;
          const width = canvasRef.current.width;
          const logoSize = width * 0.2;
          const pos = (width - logoSize) / 2;
          
          if (!transparentBg) {
            ctx.fillStyle = colorLight;
            ctx.fillRect(pos, pos, logoSize, logoSize);
          }
          ctx.drawImage(logoImg, pos, pos, logoSize, logoSize);
        }
      } catch (err) {
        console.error(err);
      }
    };

    generatePreview();
  }, [text, colorDark, colorLight, transparentBg, margin, ecc, logoImg]);

  // 비트맵(JPG/PNG) 다운로드 로직
  const downloadRaster = async (format: "jpg" | "png") => {
    if (!text) return alert("웹사이트 주소 또는 텍스트를 입력해주세요.");
    
    const tempCanvas = document.createElement("canvas");
    try {
      await QRCode.toCanvas(tempCanvas, text, {
        errorCorrectionLevel: ecc,
        margin: margin,
        color: {
          dark: colorDark,
          light: (transparentBg && format === 'png') ? '#00000000' : colorLight
        },
        width: rasterQuality
      });

      if (logoImg) {
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) return;
        const width = tempCanvas.width;
        const logoSize = width * 0.2;
        const pos = (width - logoSize) / 2;
        
        if (format === 'jpg' || !transparentBg) {
          ctx.fillStyle = colorLight;
          ctx.fillRect(pos, pos, logoSize, logoSize);
        } else if (format === 'png' && transparentBg) {
          ctx.clearRect(pos, pos, logoSize, logoSize);
        }
        ctx.drawImage(logoImg, pos, pos, logoSize, logoSize);
      }

      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataUrl = tempCanvas.toDataURL(mimeType, 0.9);
      
      const link = document.createElement('a');
      link.download = `QR코드_${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("이미지 생성 중 오류가 발생했습니다.");
    }
  };

  // 인쇄용 벡터(SVG) 다운로드 로직
  const downloadSVG = async () => {
    if (!text) return alert("웹사이트 주소 또는 텍스트를 입력해주세요.");
    
    try {
      let svgString = await QRCode.toString(text, {
        type: 'svg',
        errorCorrectionLevel: ecc,
        margin: margin,
        color: { dark: colorDark, light: transparentBg ? '#00000000' : colorLight }
      });

      if (logoImg) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, "image/svg+xml");
        const svgEl = doc.documentElement;
        
        const viewBox = svgEl.getAttribute('viewBox')?.split(' ');
        if (viewBox) {
          const size = parseFloat(viewBox[2]); 
          const logoSize = size * 0.2;
          const pos = (size - logoSize) / 2;
          
          const imageNode = doc.createElementNS("http://www.w3.org/2000/svg", "image");
          imageNode.setAttributeNS(null, "href", logoImg.src);
          imageNode.setAttributeNS(null, "x", pos.toString());
          imageNode.setAttributeNS(null, "y", pos.toString());
          imageNode.setAttributeNS(null, "width", logoSize.toString());
          imageNode.setAttributeNS(null, "height", logoSize.toString());
          
          svgEl.appendChild(imageNode);
          svgString = new XMLSerializer().serializeToString(doc);
        }
      }

      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `QR코드_인쇄용_${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("SVG 생성 중 오류가 발생했습니다.");
    }
  };

  // 인쇄용 PDF 다운로드 로직
  const downloadPDF = async () => {
    if (!text) return alert("웹사이트 주소 또는 텍스트를 입력해주세요.");
    
    try {
      const tempCanvas = document.createElement("canvas");
      await QRCode.toCanvas(tempCanvas, text, {
        errorCorrectionLevel: ecc, margin: margin,
        color: { dark: colorDark, light: colorLight },
        width: 2048
      });

      if (logoImg) {
        const ctx = tempCanvas.getContext("2d");
        const width = tempCanvas.width;
        const logoSize = width * 0.2;
        const pos = (width - logoSize) / 2;
        if(ctx) ctx.drawImage(logoImg, pos, pos, logoSize, logoSize);
      }

      const imgData = tempCanvas.toDataURL("image/png");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      const qrSize = 100;
      const x = (210 - qrSize) / 2;
      const y = 50;
      
      doc.setFontSize(20);
      doc.text("QR Code", 105, 40, { align: "center" });
      doc.addImage(imgData, "PNG", x, y, qrSize, qrSize);
      doc.setFontSize(10);
      doc.text(text, 105, y + qrSize + 10, { align: "center" });
      
      doc.save(`QR코드_인쇄용_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      <h1 className="text-3xl font-bold text-slate-800 mb-8">고화질 QR 코드 제작기</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* 좌측 설정 패널 */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">웹사이트 주소 또는 텍스트</label>
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              rows={3} 
              placeholder="https://example.com" 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-800 font-medium placeholder-slate-400"
            />
            <p className="mt-2 text-xs text-slate-400 flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[14px]">info</span>
              입력하는 즉시 미리보기가 생성됩니다.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
              <span className="material-symbols-outlined">palette</span> 디자인 설정
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">QR 색상</label>
                  <input type="color" value={colorDark} onChange={(e) => setColorDark(e.target.value)} className="h-10 w-full cursor-pointer rounded border border-slate-200 p-1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">배경 색상</label>
                  <input type="color" value={colorLight} onChange={(e) => setColorLight(e.target.value)} disabled={transparentBg} className="h-10 w-full cursor-pointer rounded border border-slate-200 p-1 disabled:opacity-50" />
                </div>
              </div>

              <div className="flex items-center">
                <input id="transparentBg" type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)} className="h-4 w-4 text-blue-600 rounded border-slate-300 cursor-pointer" />
                <label htmlFor="transparentBg" className="ml-2 block text-sm font-bold text-slate-700 cursor-pointer">
                  배경 투명하게 (PNG/SVG 전용)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">로고 이미지 (중앙 삽입)</label>
                <div className="relative">
                  <input type="file" id="logoInput" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                  {logoName && (
                    <button onClick={removeLogo} className="absolute right-0 top-0 mt-2 mr-2 text-xs text-red-500 hover:text-red-700 font-bold">삭제</button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">* 로고 삽입 시 오류 복원율이 최고 레벨로 자동 설정됩니다.</p>
              </div>

              <hr className="border-slate-100" />

              <details className="group">
                <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-sm text-slate-600">
                  <span>고급 설정 (전문가용)</span>
                  <span className="transition group-open:rotate-180">
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">여백 크기</label>
                    <input type="range" min="0" max="10" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">오류 복원율</label>
                    <select value={ecc} onChange={(e) => setEcc(e.target.value as any)} disabled={logoImg !== null} className="w-full text-sm font-bold border-slate-300 rounded-md shadow-sm p-2 border bg-slate-50 disabled:opacity-50">
                      <option value="L">낮음 (7%)</option>
                      <option value="M">보통 (15%)</option>
                      <option value="Q">높음 (25%)</option>
                      <option value="H">최고 (30%)</option>
                    </select>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* 중앙 미리보기 패널 */}
        <div className="lg:col-span-8 xl:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            <div className="absolute top-4 left-4 flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded border border-blue-200">
              <span className="material-symbols-outlined text-[14px]">visibility</span> 실시간 미리보기
            </div>
            
            {/* 🔥 완벽한 비율 유지를 위한 정방형 래퍼 추가 */}
            <div className="w-full flex justify-center mt-6">
              <div 
                className={`p-4 rounded-xl shadow-inner border border-slate-200 transition-all duration-300 w-full max-w-[280px] aspect-square ${text ? 'block' : 'hidden'}`}
                style={{
                  backgroundColor: '#ffffff',
                  backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              >
                {/* 캔버스는 부모 크기에 100% 핏 */}
                <canvas ref={canvasRef} className="w-full h-full rounded shadow-sm"></canvas>
              </div>
            </div>
            
            {!text && (
              <div className="text-center text-slate-400 mt-10">
                <span className="material-symbols-outlined text-6xl mb-2 opacity-50">qr_code_2</span>
                <p className="font-bold">URL을 입력하여 QR 코드를 생성하세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* 우측 다운로드 패널 */}
        <div className="lg:col-span-12 xl:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">download</span> 다운로드 설정
            </h3>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 mb-3">일반 이미지 (웹용)</label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">해상도 크기</label>
                  <select value={rasterQuality} onChange={(e) => setRasterQuality(Number(e.target.value))} className="w-full text-sm font-bold border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-slate-50">
                    <option value={512}>작게 (512px)</option>
                    <option value={1024}>기본 (1024px)</option>
                    <option value={2048}>크게 (2048px)</option>
                    <option value={4096}>초고화질 (4096px)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => downloadRaster('png')} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-colors shadow-md">
                    PNG 저장
                  </button>
                  <button onClick={() => downloadRaster('jpg')} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-colors shadow-md">
                    JPG 저장
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-6" />

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-3">벡터 그래픽 (인쇄용)</label>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={downloadPDF} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-md">
                  <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                  PDF 다운로드
                </button>
                <button onClick={downloadSVG} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-md">
                  <span className="material-symbols-outlined text-lg">draw</span>
                  SVG (AI 호환) 다운로드
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">
                * 일러스트레이터(Ai)에서 작업하시려면 깨지지 않는 <b>SVG 포맷</b>을 다운로드하세요.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}