// src/components/DrawingCanvas.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Rows, tokens } from '@canva/app-ui-kit';

interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  onShapeComplete: (path: Point[]) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onShapeComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [shapePath, setShapePath] = useState<Point[]>([]);

  const startDrawing = (event: React.MouseEvent) => {
    setDrawing(true);
    const { offsetX, offsetY } = event.nativeEvent;
    setShapePath([{ x: offsetX, y: offsetY }]);
  };

  const draw = (event: React.MouseEvent) => {
    if (!drawing) return;
    const { offsetX, offsetY } = event.nativeEvent;
    setShapePath((prevPath) => [...prevPath, { x: offsetX, y: offsetY }]);
  };

  const stopDrawing = () => {
    setDrawing(false);
    onShapeComplete(shapePath);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    shapePath.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }, [shapePath]);

  return (
    <canvas
      ref={canvasRef}
      style={{ borderRadius: '3px', border: '1px solid', borderColor: tokens.colorBorder }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      width={320}
      height={300}
    />
  );
};

export default DrawingCanvas;
