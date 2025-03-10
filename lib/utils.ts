import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getFileType = (file: File) => {
  if (file.type === 'text/plain') return '텍스트 파일'
  if (file.type.startsWith('audio/')) return '오디오 파일'
  return '알 수 없는 형식'
}
