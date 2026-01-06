
'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Pen, Undo, Redo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

const COLORS = ['#000000', '#FF0000', '#0000FF', '#008000']; // Black, Red, Blue, Green

export function DrawingCanvas({ onSave, width = 500, height = 400 }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const context = canvasRef.current?.getContext('2d');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = window.devicePixelRatio;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(scale, scale);
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;
      saveState();
    }
  }, [width, height]);
  
  useEffect(() => {
    if(context) {
        context.strokeStyle = color;
    }
  }, [color, context]);

  const saveState = () => {
    if(context && canvasRef.current) {
        const newHistory = history.slice(0, historyIndex + 1);
        const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHistory([...newHistory, imageData]);
        setHistoryIndex(newHistory.length);
    }
  }

  const restoreState = (index: number) => {
    if(context && canvasRef.current && history[index]) {
        context.putImageData(history[index], 0, 0);
    }
  }
  
  const handleUndo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        restoreState(newIndex);
    }
  }
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        restoreState(newIndex);
    }
  }

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if(!context) return;
    const { offsetX, offsetY } = nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if(!context) return;
    context.closePath();
    if(isDrawing) {
        saveState();
    }
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) {
      return;
    }
    const { offsetX, offsetY } = nativeEvent;
    if (isErasing) {
      context.clearRect(offsetX - 10, offsetY - 10, 20, 20);
    } else {
      context.lineTo(offsetX, offsetY);
      context.stroke();
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
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      saveState();
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
      <div className="flex items-center justify-center flex-wrap gap-2">
        <Button
          variant={isErasing ? 'outline' : 'secondary'}
          size="icon"
          onClick={() => setIsErasing(false)}
          title="Pen"
        >
          <Pen className="h-4 w-4" />
        </Button>
        <Button
          variant={!isErasing ? 'outline' : 'secondary'}
          size="icon"
          onClick={() => setIsErasing(true)}
          title="Eraser"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 p-1 border rounded-md">
            {COLORS.map(c => (
                <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn("h-6 w-6 rounded-full border-2", color === c ? 'border-primary' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                    aria-label={`Set color to ${c}`}
                />
            ))}
        </div>
        
        <Button variant="outline" size="icon" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
            <Undo className="h-4 w-4"/>
        </Button>
        <Button variant="outline" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
            <Redo className="h-4 w-4"/>
        </Button>

        <Button variant="outline" onClick={clearCanvas}>
          Clear
        </Button>
        <Button onClick={handleSave}>Save Drawing</Button>
      </div>
    </div>
  );
}
