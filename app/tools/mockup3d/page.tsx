"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Float } from "@react-three/drei";

// SSR 충돌 방지
if (typeof window !== "undefined") {
  const pdfjsVersion = pdfjsLib.version;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
}

const createTex = (url: string, flipX = false) => {
  const tex = new THREE.TextureLoader().load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (flipX) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1;
  }
  return tex;
};

// 3D 모델링 물리 엔진 (표지/내지 겹침 방지 등 핵심 로직 유지)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Book3DModel({ bookData }: { bookData: any }) {
  const { front, back, spine, innerPages, w, h, d } = bookData;
  const ct = 0.03; 

  const [currentSpread, setCurrentSpread] = useState(0);
  const numLeaves = Math.ceil(innerPages.length / 2);
  
  const t = Math.min(0.015, d / Math.max(numLeaves, 1) * 0.9); 
  const leafStep = numLeaves > 1 ? (d - t) / (numLeaves - 1) : 0;

  const [frontTex, backTex, spineTex] = useMemo(() => [
    createTex(front), 
    createTex(back, false), 
    createTex(spine)
  ], [front, back, spine]);

  const innerTextures = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return innerPages.map((url: string) => createTex(url, false));
  }, [innerPages]);

  const blankTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 10; canvas.height = 10;
    const ctx = canvas.getContext("2d");
    if(ctx){ ctx.fillStyle = "white"; ctx.fillRect(0,0,10,10); }
    return new THREE.CanvasTexture(canvas);
  }, []);

  const paperEdge = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F5F4F0", roughness: 1.0, metalness: 0 }), []);
  const coverProps = { roughness: 0.8, metalness: 0 };
  const pageProps = { roughness: 1.0, metalness: 0 };
  
  const spineMat = useMemo(() => new THREE.MeshStandardMaterial({ map: spineTex, ...coverProps }), [spineTex]);
  const frontMat = useMemo(() => new THREE.MeshStandardMaterial({ map: frontTex, ...coverProps }), [frontTex]);
  const backMat = useMemo(() => new THREE.MeshStandardMaterial({ map: backTex, ...coverProps }), [backTex]);

  const bookGroupRef = useRef<THREE.Group>(null);
  const frontCoverRef = useRef<THREE.Group>(null);
  const leavesRef = useRef<THREE.Group[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBookClick = (e: any) => {
    e.stopPropagation();
    if (e.point.x > 0) {
      setCurrentSpread((prev) => Math.min(prev + 1, numLeaves + 1));
    } else {
      setCurrentSpread((prev) => Math.max(prev - 1, 0));
    }
  };

  useFrame(() => {
    if (bookGroupRef.current) {
      const targetX = currentSpread > 0 ? 0 : -w / 2;
      bookGroupRef.current.position.x = THREE.MathUtils.lerp(bookGroupRef.current.position.x, targetX, 0.08);
    }

    if (frontCoverRef.current) {
      const targetCoverAngle = currentSpread > 0 ? -Math.PI : 0;
      frontCoverRef.current.rotation.y = THREE.MathUtils.lerp(frontCoverRef.current.rotation.y, targetCoverAngle, 0.08);
    }

    leavesRef.current.forEach((leaf, i) => {
      if (leaf) {
        const isOpen = currentSpread > i + 1;
        const targetLeafAngle = isOpen ? -Math.PI : 0; 
        leaf.rotation.y = THREE.MathUtils.lerp(leaf.rotation.y, targetLeafAngle, 0.08);

        const progress = Math.abs(leaf.rotation.y) / Math.PI;
        const startZ = (d / 2 - t / 2) - i * leafStep;
        const endZ = (d / 2 + ct + t / 2) + (i * t); 
        
        leaf.position.z = THREE.MathUtils.lerp(startZ, endZ, progress);
      }
    });
  });

  const scaleFactor = 7 / h;

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[0, 0.15]}>
      <group scale={scaleFactor}>
        <group ref={bookGroupRef} onClick={handleBookClick}>
          
          <mesh position={[w / 2, 0, -d / 2 - ct/2]} castShadow receiveShadow>
            <boxGeometry args={[w, h, ct]} />
            <meshStandardMaterial attach="material-0" {...paperEdge} />
            <meshStandardMaterial attach="material-1" {...paperEdge} />
            <meshStandardMaterial attach="material-2" {...paperEdge} />
            <meshStandardMaterial attach="material-3" {...paperEdge} />
            <meshStandardMaterial attach="material-4" map={blankTex} />
            <meshStandardMaterial attach="material-5" map={backTex} {...coverProps} />
          </mesh>

          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[ct, h, d]} />
            <meshStandardMaterial attach="material-0" map={blankTex} />
            <meshStandardMaterial attach="material-1" map={spineTex} {...coverProps} /> 
            <meshStandardMaterial attach="material-2" {...paperEdge} />
            <meshStandardMaterial attach="material-3" {...paperEdge} />
            <meshStandardMaterial attach="material-4" {...paperEdge} />
            <meshStandardMaterial attach="material-5" {...paperEdge} />
          </mesh>

          {Array.from({ length: numLeaves }).map((_, i) => {
            const rightPageTex = innerTextures[i * 2] || blankTex;
            const leftPageTex = innerTextures[i * 2 + 1] || blankTex;
            const initialZ = (d / 2 - t / 2) - i * leafStep;

            return (
              <group key={i} ref={(el) => { if(el) leavesRef.current[i] = el; }} position={[0, 0, initialZ]}>
                <mesh position={[w / 2, 0, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, h, t]} />
                  <meshStandardMaterial attach="material-0" {...paperEdge} />
                  <meshStandardMaterial attach="material-1" {...paperEdge} />
                  <meshStandardMaterial attach="material-2" {...paperEdge} />
                  <meshStandardMaterial attach="material-3" {...paperEdge} />
                  <meshStandardMaterial attach="material-4" map={rightPageTex} {...pageProps} />
                  <meshStandardMaterial attach="material-5" map={leftPageTex} {...pageProps} />
                </mesh>
              </group>
            );
          })}

          <group ref={frontCoverRef} position={[0, 0, d / 2 + ct/2]}>
            <mesh position={[w / 2, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, h, ct]} />
              <meshStandardMaterial attach="material-0" {...paperEdge} />
              <meshStandardMaterial attach="material-1" {...paperEdge} />
              <meshStandardMaterial attach="material-2" {...paperEdge} />
              <meshStandardMaterial attach="material-3" {...paperEdge} />
              <meshStandardMaterial attach="material-4" map={frontTex} {...coverProps} />
              <meshStandardMaterial attach="material-5" map={blankTex} />
            </mesh>
          </group>

        </group>
      </group>
    </Float>
  );
}

export default function Mockup3DPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [innerFile, setInnerFile] = useState<File | null>(null);
  
  const [spineInput, setSpineInput] = useState<string>("5");
  const [spineMm, setSpineMm] = useState<number>(5);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bookData, setBookData] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSpineChange = (val: string) => {
    setSpineInput(val);
    const numVal = parseFloat(val);
    if (!isNaN(numVal) && numVal >= 1 && numVal <= 200) {
      setSpineMm(numVal);
    }
  };

  const handleGenerate = async () => {
    if (!coverFile || !innerFile) {
      return alert("통표지와 내지 PDF를 모두 업로드해 주세요!");
    }
    
    if (spineMm < 1 || spineMm > 200 || isNaN(spineMm)) {
      return alert("책등(세네카) 두께는 1mm에서 200mm 사이의 숫자로 입력해 주세요!");
    }

    setIsGenerating(true);
    setProgress("표지 디자인 분석 중...");

    try {
      const coverBuffer = await coverFile.arrayBuffer();
      const coverTask = pdfjsLib.getDocument({
        data: new Uint8Array(coverBuffer),
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
      });
      const coverPdf = await coverTask.promise;
      const coverPage = await coverPdf.getPage(1);

      const ptToMm = 2.83465;
      const vpPt = coverPage.getViewport({ scale: 1.0 });
      const totalWidthMm = vpPt.width / ptToMm;
      const totalHeightMm = vpPt.height / ptToMm;
      const faceWidthMm = (totalWidthMm - spineMm) / 2;

      if (faceWidthMm <= 0) throw new Error("책등 두께가 전체 표지 크기보다 클 수 없습니다.");

      const coverVp = coverPage.getViewport({ scale: 3.0 });
      const cCanvas = document.createElement("canvas");
      cCanvas.width = coverVp.width; cCanvas.height = coverVp.height;
      const cCtx = cCanvas.getContext("2d");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if(cCtx) await coverPage.render({ canvasContext: cCtx, viewport: coverVp } as any).promise;

      const spineW_px = (spineMm / totalWidthMm) * cCanvas.width;
      const faceW_px = (cCanvas.width - spineW_px) / 2;

      const sliceCanvas = (x: number, y: number, w: number, h: number) => {
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if(ctx) ctx.drawImage(cCanvas, x, y, w, h, 0, 0, w, h);
        return c.toDataURL("image/jpeg", 0.9);
      };

      const backUrl = sliceCanvas(0, 0, faceW_px, cCanvas.height);
      const spineUrl = sliceCanvas(faceW_px, 0, spineW_px, cCanvas.height);
      const frontUrl = sliceCanvas(faceW_px + spineW_px, 0, faceW_px, cCanvas.height);

      setProgress("내지 페이지 분석 중...");
      const innerBuffer = await innerFile.arrayBuffer();
      const innerTask = pdfjsLib.getDocument({
        data: new Uint8Array(innerBuffer),
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`
      });
      const innerPdf = await innerTask.promise;
      const innerPagesUrls: string[] = [];

      const renderLimit = Math.min(innerPdf.numPages, 2000); 
      
      for (let i = 1; i <= renderLimit; i++) {
        setProgress(`내지 렌더링 중... (${i} / ${renderLimit}쪽)`);
        const iPage = await innerPdf.getPage(i);
        const iVp = iPage.getViewport({ scale: 1.5 });
        const iCanvas = document.createElement("canvas");
        iCanvas.width = iVp.width; iCanvas.height = iVp.height;
        const iCtx = iCanvas.getContext("2d");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if(iCtx) await iPage.render({ canvasContext: iCtx, viewport: iVp } as any).promise;
        innerPagesUrls.push(iCanvas.toDataURL("image/jpeg", 0.7));
      }

      setBookData({
        front: frontUrl, back: backUrl, spine: spineUrl,
        innerPages: innerPagesUrls,
        w: faceWidthMm / 10, h: totalHeightMm / 10, d: spineMm / 10
      });

    } catch (err) {
      console.error(err);
      alert("PDF 처리 중 오류가 발생했습니다. 원본 파일을 확인해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
              유틸리티 / 05
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              웹 기반 3D 시뮬레이션
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            3D 패키징 목업
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 좌측 설정 패널 */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-6 transition-colors">
            <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-4 flex items-center gap-2">
              <span className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] w-5 h-5 flex items-center justify-center text-xs font-mono">1</span> 
              통표지 업로드
            </label>
            <div className="relative border-2 border-dashed border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] rounded-none p-6 transition-colors cursor-pointer text-center">
              <input type="file" accept=".pdf" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {!coverFile ? (
                <div className="text-[#666666] dark:text-[#A0A0A0]">
                  <span className="material-symbols-outlined block mb-2 text-2xl text-[#222222] dark:text-[#EAEAEA]">upload_file</span> 
                  <p className="text-xs font-bold tracking-widest leading-relaxed">뒷표지 + 책등(세네카) + 앞표지<br/>1장으로 연결된 PDF 파일</p>
                </div>
              ) : (
                <div className="text-sm font-black text-[#222222] dark:text-[#EAEAEA] truncate z-20 relative underline underline-offset-4">{coverFile.name}</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-6 transition-colors">
            <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-4 flex items-center gap-2">
              <span className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] w-5 h-5 flex items-center justify-center text-xs font-mono">2</span> 
              책등(세네카) 두께 설정
            </label>
            <div className="flex gap-3 items-center mb-4">
              <div className="relative flex-1">
                <input 
                  type="number" 
                  min="1" max="200" step="0.1"
                  value={spineInput}
                  onChange={(e) => handleSpineChange(e.target.value)}
                  className="w-full text-lg font-black text-[#222222] dark:text-[#EAEAEA] bg-white dark:bg-[#121212] p-3 pr-10 border-2 border-[#222222] dark:border-[#444444] outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#A0A0A0] dark:text-[#666666] font-bold">mm</span>
              </div>
            </div>
            <input type="range" min="1" max="200" step="1" value={spineMm} onChange={(e) => handleSpineChange(e.target.value)} className="w-full h-2 bg-[#E5E4E0] dark:bg-[#333333] appearance-none cursor-pointer" />
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] p-6 transition-colors">
            <label className="block text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-4 flex items-center gap-2">
              <span className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] w-5 h-5 flex items-center justify-center text-xs font-mono">3</span> 
              내지 업로드
            </label>
            <div className="relative border-2 border-dashed border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] rounded-none p-6 transition-colors cursor-pointer text-center">
              <input type="file" accept=".pdf" onChange={(e) => setInnerFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {!innerFile ? (
                <div className="text-[#666666] dark:text-[#A0A0A0]">
                  <span className="material-symbols-outlined block mb-2 text-2xl text-[#222222] dark:text-[#EAEAEA]">auto_stories</span>
                  <p className="text-xs font-bold tracking-widest leading-relaxed">여러 페이지로 묶여 있는<br/>내지 PDF 파일</p>
                </div>
              ) : (
                <div className="text-sm font-black text-[#222222] dark:text-[#EAEAEA] truncate z-20 relative underline underline-offset-4">{innerFile.name}</div>
              )}
            </div>
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={!coverFile || !innerFile || isGenerating} 
            className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#222222] dark:border-[#EAEAEA] py-4 font-black shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center justify-center gap-2 text-lg"
          >
            <span className="material-symbols-outlined text-[20px]">3d_rotation</span> 입체 책자 만들기
          </button>
        </div>

        {/* 🌟 3D 뷰어 공간 */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col h-[800px] overflow-hidden transition-colors relative">
          
          <div className="bg-[#222222] dark:bg-[#111111] px-6 py-4 flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] shrink-0 absolute top-0 w-full z-30">
            <div className="flex items-center gap-4">
              <span className="text-[#F5F4F0] font-black tracking-widest text-xs uppercase">미리보기 (Preview)</span>
            </div>
          </div>

          {bookData && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-[#222222] dark:bg-[#EAEAEA] px-6 py-3 border-2 border-[#222222] dark:border-[#EAEAEA] pointer-events-none shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111]">
              <p className="text-[#F5F4F0] dark:text-[#121212] text-xs font-bold tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">touch_app</span> 
                화면을 드래그하여 이리저리 돌려보거나, 책을 클릭하여 페이지를 넘겨보세요.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-[#222222]/80 backdrop-blur-sm flex flex-col items-center justify-center z-40">
              <span className="material-symbols-outlined text-[#F5F4F0] text-5xl animate-spin mb-4">settings</span>
              <p className="text-[#F5F4F0] font-black text-lg tracking-widest drop-shadow-md">{progress}</p>
            </div>
          )}

          {!bookData && !isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none bg-[#F5F4F0] dark:bg-[#121212]">
              <span className="material-symbols-outlined text-6xl mb-3 text-[#A0A0A0] dark:text-[#666666] opacity-50">layers</span>
              <p className="font-bold text-sm tracking-widest text-[#A0A0A0] dark:text-[#666666]">좌측에서 표지와 내지를 모두 업로드해주세요.</p>
            </div>
          )}

          {bookData && (
            <div className="w-full h-full bg-[#F5F4F0] dark:bg-[#121212]">
              <Canvas camera={{ position: [0, 2, 12], fov: 45 }} className="w-full h-full cursor-grab active:cursor-grabbing">
                <ambientLight intensity={1.0} />
                <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow shadow-bias={-0.0001} />
                <spotLight position={[-10, 10, 5]} intensity={0.5} />
                <Environment preset="city" />

                <Book3DModel bookData={bookData} />

                <ContactShadows position={[0, -4, 0]} opacity={0.6} scale={20} blur={2.5} far={5} color="#000000" />

                <OrbitControls 
                  enablePan={true} 
                  enableZoom={true} 
                  minDistance={5} 
                  maxDistance={25}
                  maxPolarAngle={Math.PI / 2 + 0.1} 
                />
              </Canvas>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}