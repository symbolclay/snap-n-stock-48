import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Check, AlertCircle } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiGuidance, setAiGuidance] = useState("Inicializando câmera...");
  const [isFrameGood, setIsFrameGood] = useState(false);
  const [hasCapture, setHasCapture] = useState(false);

  // Simulação de IA para orientação
  const aiMessages = [
    "Centralize o produto na moldura verde",
    "Mantenha a câmera estável",
    "Produto bem enquadrado! Pode fotografar",
    "Evite sombras muito fortes",
    "Aproxime um pouco mais do produto",
    "Perfeito! Produto bem iluminado"
  ];

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: "environment", // Câmera traseira
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        
        // Simulação de IA analisando o frame
        const aiInterval = setInterval(() => {
          const randomMessage = aiMessages[Math.floor(Math.random() * aiMessages.length)];
          setAiGuidance(randomMessage);
          setIsFrameGood(Math.random() > 0.5); // Simula detecção de frame bom
        }, 2000);

        return () => {
          clearInterval(aiInterval);
        };
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      setAiGuidance("Erro ao acessar câmera. Verifique as permissões.");
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Usar a resolução original do vídeo sem redimensionamento
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        canvas.width = width;
        canvas.height = height;
        
        // Configurar para melhor qualidade sem redimensionamento
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Capturar sem redimensionar - mantém proporção original
        ctx.drawImage(video, 0, 0, width, height);
        
        // Usar qualidade máxima JPEG
        const imageData = canvas.toDataURL('image/jpeg', 0.98);
        setHasCapture(true);
        
        // Para o stream da câmera
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        
        setTimeout(() => {
          onCapture(imageData);
        }, 500);
      }
    }
  }, [onCapture]);

  useEffect(() => {
    startCamera();
    
    return () => {
      // Cleanup: para a câmera quando o componente é desmontado
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
          <h2 className="text-lg font-semibold">Capturar Produto</h2>
          <div className="w-10" />
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* AI Guidance Overlay */}
        <div className="absolute top-20 left-4 right-4 z-20">
          <div className={`p-4 rounded-2xl backdrop-blur-md transition-all duration-300 ${
            isFrameGood ? 'bg-primary/20 border border-primary' : 'bg-black/40 border border-white/20'
          }`}>
            <div className="flex items-center gap-3 text-white">
              {isFrameGood ? (
                <Check className="h-5 w-5 text-primary animate-bounce-in" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              )}
              <p className="text-sm font-medium">{aiGuidance}</p>
            </div>
          </div>
        </div>

        {/* Camera Frame Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Frame corners */}
          <div className={`absolute top-1/2 left-1/2 w-72 h-72 sm:w-80 sm:h-80 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
            isFrameGood ? 'border-2 border-primary animate-pulse-glow' : 'border-2 border-white/50'
          }`}>
            {/* Corner indicators */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary"></div>
            
            {/* Scanning line animation */}
            {isFrameGood && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line"></div>
            )}
          </div>
        </div>

        {/* Capture Button */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 mobile-capture-button">
          <Button
            onClick={capturePhoto}
            disabled={!isStreaming || hasCapture}
            className={`w-20 h-20 rounded-full transition-all duration-300 shadow-2xl ${
              hasCapture 
                ? 'bg-primary animate-bounce-in' 
                : isFrameGood 
                  ? 'bg-primary hover:bg-primary/80 animate-pulse-glow' 
                  : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {hasCapture ? (
              <Check className="h-8 w-8" />
            ) : (
              <Camera className="h-8 w-8" />
            )}
          </Button>
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;