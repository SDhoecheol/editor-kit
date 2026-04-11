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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setLogoImg(img);
        setEcc("H"); 
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
          width: 1024 
        });

        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = '100%';

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
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 04
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              인쇄용 벡터 그래픽
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            고화질 QR코드 생성기
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* 좌측 설정 패널 */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-6 transition-colors">
            <label className="block text-sm font-bold text-[#222222] dark:text-[#EAEAEA] mb-2">웹사이트 주소 또는 텍스트</label>
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              rows={3} 
              placeholder="https://example.com" 
              className="w-full px-4 py-3 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all resize-none font-medium placeholder-[#A0A0A0] dark:placeholder-[#666666]"
            />
            <p className="mt-2 text-xs text-[#666666] dark:text-[#A0A0A0] flex items-center gap-1 font-bold tracking-widest">
              <span className="material-symbols-outlined text-[14px]">info</span> 입력 즉시 반영됩니다.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] transition-colors">
            <div className="p-4 bg-[#F5F4F0] dark:bg-[#2A2A2A] border-b-2 border-[#222222] dark:border-[#444444] font-black text-[#222222] dark:text-[#EAEAEA] flex items-center gap-2 text-sm tracking-widest">
              <span className="material-symbols-outlined text-[18px]">palette</span> 디자인 설정
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">QR 색상</label>
                  <input type="color" value={colorDark} onChange={(e) => setColorDark(e.target.value)} className="h-10 w-full cursor-pointer border-2 border-[#222222] dark:border-[#444444] p-1 bg-white dark:bg-[#121212]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">배경 색상</label>
                  <input type="color" value={colorLight} onChange={(e) => setColorLight(e.target.value)} disabled={transparentBg} className="h-10 w-full cursor-pointer border-2 border-[#222222] dark:border-[#444444] p-1 bg-white dark:bg-[#121212] disabled:opacity-50" />
                </div>
              </div>

              <div className="flex items-center">
                <input id="transparentBg" type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)} className="h-4 w-4 text-blue-600 border-2 border-[#222222] dark:border-[#444444] cursor-pointer bg-white dark:bg-[#121212]" />
                <label htmlFor="transparentBg" className="ml-2 block text-sm font-bold text-[#222222] dark:text-[#EAEAEA] cursor-pointer">
                  배경 투명하게 (PNG/SVG)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">로고 이미지 삽입</label>
                <div className="relative">
                  <input type="file" id="logoInput" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-[#A0A0A0] file:mr-4 file:py-2 file:px-4 file:border-2 file:border-[#222222] dark:file:border-[#EAEAEA] file:text-xs file:font-black file:bg-[#222222] file:text-[#F5F4F0] dark:file:bg-[#EAEAEA] dark:file:text-[#121212] hover:file:translate-x-[1px] hover:file:translate-y-[1px] cursor-pointer transition-all" />
                  {logoName && (
                    <button onClick={removeLogo} className="absolute right-0 top-0 mt-2 mr-2 text-xs text-red-600 dark:text-red-400 font-bold hover:underline">삭제</button>
                  )}
                </div>
                <p className="text-[10px] text-[#A0A0A0] mt-1 font-bold tracking-widest">* 로고 삽입 시 오류 복원율이 최대로 상향됩니다.</p>
              </div>

              <hr className="border-t-2 border-[#E5E4E0] dark:border-[#333333]" />

              <div>
                <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">여백 크기</label>
                <input type="range" min="0" max="10" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full h-2 bg-[#E5E4E0] dark:bg-[#333333] appearance-none cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">오류 복원율</label>
                <select value={ecc} onChange={(e) => setEcc(e.target.value as any)} disabled={logoImg !== null} className="w-full text-sm font-bold border-2 border-[#222222] dark:border-[#444444] p-2 bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] disabled:opacity-50 outline-none">
                  <option value="L">낮음 (7%)</option>
                  <option value="M">보통 (15%)</option>
                  <option value="Q">높음 (25%)</option>
                  <option value="H">최고 (30%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 중앙 미리보기 패널 */}
        <div className="lg:col-span-8 xl:col-span-6 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden transition-colors h-full">
            <div className="absolute top-4 left-4 flex items-center gap-1 bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] text-[10px] font-black px-2.5 py-1 tracking-widest uppercase">
              <span className="material-symbols-outlined text-[14px]">visibility</span> Preview
            </div>
            
            <div className="w-full flex justify-center mt-6">
              <div 
                className={`p-4 border-2 border-[#222222] dark:border-[#444444] transition-all duration-300 w-full max-w-[280px] aspect-square ${text ? 'block' : 'hidden'}`}
                style={{
                  backgroundColor: '#F5F4F0',
                  backgroundImage: 'linear-gradient(45deg, #E5E4E0 25%, transparent 25%), linear-gradient(-45deg, #E5E4E0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #E5E4E0 75%), linear-gradient(-45deg, transparent 75%, #E5E4E0 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              >
                <canvas ref={canvasRef} className="w-full h-full border-2 border-[#222222]"></canvas>
              </div>
            </div>
            
            {!text && (
              <div className="text-center text-[#A0A0A0] dark:text-[#666666] mt-10">
                <span className="material-symbols-outlined text-6xl mb-2 opacity-50">qr_code_2</span>
                <p className="font-bold tracking-widest text-sm">URL을 입력하여 QR 코드를 생성하세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* 우측 다운로드 패널 */}
        <div className="lg:col-span-12 xl:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-6 sticky top-24 transition-colors">
            <h3 className="font-black text-[#222222] dark:text-[#EAEAEA] mb-6 flex items-center gap-2 uppercase tracking-widest text-sm border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2">
              <span className="material-symbols-outlined text-[18px]">download</span> 다운로드
            </h3>

            <div className="mb-6">
              <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-3">일반 이미지 (웹용)</label>
              <div className="space-y-3">
                <div>
                  <select value={rasterQuality} onChange={(e) => setRasterQuality(Number(e.target.value))} className="w-full text-sm font-bold border-2 border-[#222222] dark:border-[#444444] p-2.5 bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] outline-none">
                    <option value={512}>작게 (512px)</option>
                    <option value={1024}>기본 (1024px)</option>
                    <option value={2048}>크게 (2048px)</option>
                    <option value={4096}>초고화질 (4096px)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => downloadRaster('png')} className="flex items-center justify-center border-2 border-[#222222] dark:border-[#EAEAEA] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] w-full py-2.5 px-4 text-sm font-black hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#EAEAEA] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                    PNG 저장
                  </button>
                  <button onClick={() => downloadRaster('jpg')} className="flex items-center justify-center border-2 border-[#222222] dark:border-[#EAEAEA] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] w-full py-2.5 px-4 text-sm font-black hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#EAEAEA] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                    JPG 저장
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-t-2 border-[#E5E4E0] dark:border-[#333333] my-6" />

            <div>
              <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-3">벡터 그래픽 (인쇄용)</label>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={downloadPDF} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] text-sm font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  PDF 다운로드
                </button>
                <button onClick={downloadSVG} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] text-sm font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  <span className="material-symbols-outlined text-[18px]">draw</span>
                  SVG 다운로드
                </button>
              </div>
              <p className="text-[10px] text-[#A0A0A0] mt-3 font-bold tracking-widest leading-relaxed">
                * 일러스트레이터(Ai) 작업 시 깨지지 않는 <strong className="text-[#222222] dark:text-[#EAEAEA]">SVG 포맷</strong>을 권장합니다.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}