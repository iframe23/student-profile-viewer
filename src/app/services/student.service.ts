import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface Student {
  name: string;
  studentId: string;
  gender: string;
  age: string;
  course: string;
  yearLevel: string;
  email: string;
  phone: string;
  profilePicture?: string;
}

const STUDENT_KEY = 'student_profile';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  async saveStudent(student: Student): Promise<void> {
    await Preferences.set({
      key: STUDENT_KEY,
      value: JSON.stringify(student)
    });
  }

  async loadStudent(): Promise<Student | null> {
    const { value } = await Preferences.get({ key: STUDENT_KEY });
    if (value) {
      return JSON.parse(value) as Student;
    }
    return null;
  }

  async clearStudent(): Promise<void> {
    await Preferences.remove({ key: STUDENT_KEY });
  }

  async takePicture(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        width: 400,
        height: 400
      });
      return image.dataUrl || null;
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  }

  applyAIFilter(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }

        ctx.drawImage(img, 0, 0);

        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        // src = original pixels (read-only), dst = pixels we write to
        const src = new Uint8ClampedArray(imageData.data);
        const dst = imageData.data;

        // Spherical bulge warp using inverse mapping + bilinear interpolation.
        // strength > 1 magnifies (bulges outward), < 1 pinches inward.
        const bulge = (cx: number, cy: number, radius: number, strength: number) => {
          const xMin = Math.max(0, Math.floor(cx - radius));
          const xMax = Math.min(w - 1, Math.ceil(cx + radius));
          const yMin = Math.max(0, Math.floor(cy - radius));
          const yMax = Math.min(h - 1, Math.ceil(cy + radius));

          for (let y = yMin; y <= yMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
              const dx = x - cx;
              const dy = y - cy;
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d === 0 || d >= radius) { continue; }

              // Normalized distance [0,1)
              const t = d / radius;
              // Source distance: t^strength. strength>1 → tSrc<t → center magnified
              const tSrc = Math.pow(t, strength);
              const scale = tSrc / t;

              // Source coordinates (bilinear sample from original)
              const sx = cx + dx * scale;
              const sy = cy + dy * scale;
              const bx = Math.floor(sx);
              const by = Math.floor(sy);

              if (bx < 0 || bx + 1 >= w || by < 0 || by + 1 >= h) { continue; }

              const fx = sx - bx;
              const fy = sy - by;
              const i00 = (by * w + bx) * 4;
              const i10 = (by * w + bx + 1) * 4;
              const i01 = ((by + 1) * w + bx) * 4;
              const i11 = ((by + 1) * w + bx + 1) * 4;
              const i = (y * w + x) * 4;

              for (let c = 0; c < 3; c++) {
                dst[i + c] = Math.round(
                  src[i00 + c] * (1 - fx) * (1 - fy) +
                  src[i10 + c] * fx       * (1 - fy) +
                  src[i01 + c] * (1 - fx) * fy       +
                  src[i11 + c] * fx       * fy
                );
              }
              dst[i + 3] = 255;
            }
          }
        };

        const rand = (min: number, max: number) => min + Math.random() * (max - min);
        // 50% chance to bulge (>1 = enlarge) or pinch (<1 = shrink) each feature independently
        const randStr = (bigMin: number, bigMax: number, smallMin: number, smallMax: number) =>
          Math.random() < 0.5 ? rand(bigMin, bigMax) : rand(smallMin, smallMax);

        // Left eye
        bulge(w * rand(0.31, 0.38), h * rand(0.32, 0.39), w * rand(0.12, 0.19), randStr(1.8, 2.8, 0.25, 0.65));
        // Right eye
        bulge(w * rand(0.62, 0.69), h * rand(0.32, 0.39), w * rand(0.12, 0.19), randStr(1.8, 2.8, 0.25, 0.65));
        // Nose
        bulge(w * rand(0.46, 0.54), h * rand(0.52, 0.60), w * rand(0.11, 0.18), randStr(2.5, 4.2, 0.20, 0.55));
        // Left ear
        bulge(w * rand(0.07, 0.14), h * rand(0.41, 0.50), w * rand(0.09, 0.15), randStr(2.0, 3.2, 0.25, 0.65));
        // Right ear
        bulge(w * rand(0.86, 0.93), h * rand(0.41, 0.50), w * rand(0.09, 0.15), randStr(2.0, 3.2, 0.25, 0.65));
        // Mouth
        bulge(w * rand(0.45, 0.55), h * rand(0.67, 0.74), w * rand(0.11, 0.17), randStr(2.0, 3.4, 0.22, 0.60));
        // Chin / jaw
        bulge(w * rand(0.45, 0.55), h * rand(0.81, 0.91), w * rand(0.13, 0.21), randStr(1.8, 3.0, 0.28, 0.65));

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}
