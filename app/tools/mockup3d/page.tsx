"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Float } from "@react-three/drei";

// 🔥 SSR 충돌 방지
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

// 🌟 완벽한 3D 물리 엔진 적용 (동적 두께 + 좌측 차곡차곡 스태킹)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Book3DModel({ bookData }: { bookData: any }) {
  const { front, back, spine, innerPages, w, h, d } = bookData;
  const ct = 0.03; // 표지 모델링 두께

  const [currentSpread, setCurrentSpread] = useState(0);
  const numLeaves = Math.ceil(innerPages.length / 2);
  
  // 🔥 [핵심 픽스 1] 61p 뚫림 방지: 세네카 두께에 맞춰 종이 두께(t) 자동 압축
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

  const paperEdge = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f8f9fa", roughness: 1.0, metalness: 0 }), []);
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
      // 🔥 표지는 세네카 앞쪽 모서리(d/2)에 고정되어 이동하지 않음!
    }

    leavesRef.current.forEach((leaf, i) => {
      if (leaf) {
        const isOpen = currentSpread > i + 1;
        // 🔥 [핵심 픽스 2] 부채꼴 각도 제거 -> 완전 평면(-Math.PI)으로 만들어 그래픽 파고듦 원천 차단!
        const targetLeafAngle = isOpen ? -Math.PI : 0; 
        leaf.rotation.y = THREE.MathUtils.lerp(leaf.rotation.y, targetLeafAngle, 0.08);

        const progress = Math.abs(leaf.rotation.y) / Math.PI;
        
        // 오른쪽 스택: 세네카 안쪽에 차곡차곡 분포
        const startZ = (d / 2 - t / 2) - i * leafStep;
        
        // 🔥 [핵심 픽스 3] 왼쪽 스택: 열린 앞표지 위로 종이 두께(t)만큼 완벽하게 위로 쌓임!
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
  
  // 🔥 하한선 1mm 로 조정!
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
      return alert("세네카 두께는 1mm에서 200mm 사이의 정확한 숫자로 입력해 주세요!");
    }

    setIsGenerating(true);
    setProgress("표지 분석 중...");

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

      if (faceWidthMm <= 0) throw new Error("세네카 두께가 전체 표지 크기보다 클 수 없습니다.");

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

      setProgress("내지 페이지 렌더링 중...");
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
        setProgress(`내지 렌더링 중... (${i} / ${renderLimit})`);
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
      alert("PDF 처리 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      <div className="max-w-7xl mx-auto px-4">
        
        <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-4xl text-blue-600">view_in_ar</span>
          풀 3D 입체 책 목업 (Pro 버전)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span> 
                통표지 업로드
              </label>
              <div className="relative border-dashed border-2 hover:border-blue-400 bg-slate-50 rounded-xl p-4 transition-colors">
                <input type="file" accept=".pdf" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {!coverFile ? (
                  <div className="text-center text-slate-500 text-xs">
                    <span className="material-symbols-outlined block mb-1">upload_file</span> 뒷표지+세네카+앞표지 (1장)
                  </div>
                ) : (
                  <div className="text-sm font-bold text-blue-600 truncate text-center z-20 relative">{coverFile.name}</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span> 
                세네카(책등) 두께 설정
              </label>
              <div className="flex gap-3 items-center mb-4">
                <div className="relative flex-1">
                  <input 
                    type="number" 
                    min="1" max="200" step="0.1"
                    value={spineInput}
                    onChange={(e) => handleSpineChange(e.target.value)}
                    className="w-full text-lg font-black text-slate-800 bg-slate-50 rounded-lg p-3 pr-10 border border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-normal">mm</span>
                </div>
              </div>
              {/* 🔥 하한선 1mm 적용 완료! */}
              <input type="range" min="1" max="200" step="1" value={spineMm} onChange={(e) => handleSpineChange(e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span> 
                내지 업로드
              </label>
              <div className="relative border-dashed border-2 hover:border-blue-400 bg-slate-50 rounded-xl p-4 transition-colors">
                <input type="file" accept=".pdf" onChange={(e) => setInnerFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {!innerFile ? (
                  <div className="text-center text-slate-500 text-xs">
                    <span className="material-symbols-outlined block mb-1">auto_stories</span> 내지 다중 페이지 PDF
                  </div>
                ) : (
                  <div className="text-sm font-bold text-blue-600 truncate text-center z-20 relative">{innerFile.name}</div>
                )}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={!coverFile || !innerFile || isGenerating} className="w-full bg-[#1e293b] hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[20px]">3d_rotation</span> 3D 목업 생성하기
            </button>
          </div>

          <div className="lg:col-span-8 xl:col-span-9 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 h-[800px] flex flex-col relative overflow-hidden">
            
            <div className="absolute top-4 left-6 z-10 pointer-events-none">
              <span className="text-slate-400 font-bold tracking-widest text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">3d_rotation</span> FULL 3D ENGINE (PRO)
              </span>
            </div>

            {bookData && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full pointer-events-none">
                <p className="text-white text-xs font-medium tracking-wide">
                  👆 책의 <b>오른쪽/왼쪽</b>을 클릭하면 페이지가 넘어갑니다. (드래그 시 360도 회전)
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <span className="material-symbols-outlined text-5xl text-blue-400 animate-spin mb-4">settings_suggest</span>
                <p className="text-white font-bold text-lg drop-shadow-md">{progress}</p>
              </div>
            )}

            {!bookData && !isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <span className="material-symbols-outlined text-6xl mb-3 text-slate-600 opacity-50">layers</span>
                <p className="font-bold text-sm text-slate-400">좌측에서 표지와 내지를 모두 업로드해주세요.</p>
              </div>
            )}

            {bookData && (
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
            )}

          </div>
        </div>
      </div>
    </div>
  );
}