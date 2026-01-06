
'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Pen } from 'lucide-react';

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export function DrawingCanvas({ onSave, width = 500, height = 400 }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust for device pixel ratio for sharper drawing
    const scale = window.devicePixelRatio;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.scale(scale, scale);
    context.lineCap = 'round';
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    contextRef.current = context;
  }, [width, height]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const { offsetX, offsetY } = nativeEvent;
    if (isErasing) {
      contextRef.current?.clearRect(offsetX - 10, offsetY - 10, 20, 20);
    } else {
      contextRef.current?.lineTo(offsetX, offsetY);
      contextRef.current?.stroke();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
        ref={canvasRef}
        className="border-2 border-dashed rounded-lg cursor-crosshair bg-white"
      />
      <div className="flex items-center gap-2">
        <Button
          variant={isErasing ? 'outline' : 'secondary'}
          size="icon"
          onClick={() => setIsErasing(false)}
        >
          <Pen className="h-4 w-4" />
        </Button>
        <Button
          variant={!isErasing ? 'outline' : 'secondary'}
          size="icon"
          onClick={() => setIsErasing(true)}
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={clearCanvas}>
          Clear
        </Button>
        <Button onClick={handleSave}>Save Drawing</Button>
      </div>
    </div>
  );
}
