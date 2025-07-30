import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoStatusAlertProps {
  ultimaFoto: string | null;
  className?: string;
}

interface StatusInfo {
  status: 'green' | 'blue' | 'orange' | 'red';
  message: string;
  icon: React.ReactNode;
  progressValue: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
  pulseAnimation: boolean;
}

const PhotoStatusAlert: React.FC<PhotoStatusAlertProps> = ({ ultimaFoto, className }) => {
  const getStatusInfo = (daysSinceLastPhoto: number): StatusInfo => {
    if (daysSinceLastPhoto <= 7) {
      return {
        status: 'green',
        message: 'Em dia',
        icon: <Camera className="w-4 h-4" />,
        progressValue: 100,
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        pulseAnimation: false
      };
    } else if (daysSinceLastPhoto <= 14) {
      return {
        status: 'blue',
        message: `${daysSinceLastPhoto} dias sem foto`,
        icon: <Clock className="w-4 h-4" />,
        progressValue: 70,
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
        pulseAnimation: false
      };
    } else if (daysSinceLastPhoto <= 30) {
      return {
        status: 'orange',
        message: `${daysSinceLastPhoto} dias sem foto`,
        icon: <AlertTriangle className="w-4 h-4" />,
        progressValue: 40,
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        textColor: 'text-orange-700 dark:text-orange-300',
        borderColor: 'border-orange-200 dark:border-orange-800',
        pulseAnimation: true
      };
    } else {
      return {
        status: 'red',
        message: `${daysSinceLastPhoto} dias sem foto - CRÍTICO`,
        icon: <AlertTriangle className="w-4 h-4" />,
        progressValue: 10,
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-800',
        pulseAnimation: true
      };
    }
  };

  const calculateDaysSinceLastPhoto = (lastPhotoDate: string | null): number => {
    if (!lastPhotoDate) return 999; // Se não há data, considera muito tempo
    
    const lastPhoto = new Date(lastPhotoDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastPhoto.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysSince = calculateDaysSinceLastPhoto(ultimaFoto);
  const statusInfo = getStatusInfo(daysSince);

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-emerald-500';
      case 'blue':
        return 'bg-blue-500';
      case 'orange':
        return 'bg-orange-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all duration-300",
        statusInfo.bgColor,
        statusInfo.borderColor,
        statusInfo.pulseAnimation && "animate-pulse",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("flex-shrink-0", statusInfo.textColor)}>
          {statusInfo.icon}
        </div>
        <span className={cn("text-sm font-medium", statusInfo.textColor)}>
          {statusInfo.message}
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={statusInfo.progressValue} 
          className={cn("h-2 bg-gray-200 dark:bg-gray-700")}
        />
        <div 
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            background: `linear-gradient(to right, ${getProgressBarColor(statusInfo.status)} ${statusInfo.progressValue}%, transparent ${statusInfo.progressValue}%)`
          }}
        />
      </div>
      
      {ultimaFoto && (
        <div className="mt-1">
          <span className={cn("text-xs opacity-75", statusInfo.textColor)}>
            Última foto: {new Date(ultimaFoto).toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}
      
      {statusInfo.status === 'red' && (
        <div className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 animate-bounce">
          🚨 Solicitar fotos urgentemente!
        </div>
      )}
    </div>
  );
};

export default PhotoStatusAlert;