import React, { useRef, useState, useEffect } from 'react';
import { tokens } from '@canva/app-ui-kit';

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

  const startDrawing = (x: number, y: number) => {
    setDrawing(true);
    setShapePath([{ x, y }]);
  };

  const draw = (x: number, y: number) => {
    if (!drawing) return;
    setShapePath((prevPath) => [...prevPath, { x, y }]);
  };

  const stopDrawing = () => {
    setDrawing(false);
    onShapeComplete(shapePath);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const { offsetX, offsetY } = event.nativeEvent;
    startDrawing(offsetX, offsetY);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const { offsetX, offsetY } = event.nativeEvent;
    draw(offsetX, offsetY);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    startDrawing(x, y);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    draw(x, y);
  };

  const handleTouchEnd = () => {
    stopDrawing();
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      width={310}
      height={300}
    />
  );
};

export default DrawingCanvas;