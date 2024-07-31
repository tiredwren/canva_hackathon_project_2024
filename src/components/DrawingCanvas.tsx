import React, { useRef, useState, useEffect } from "react";
import { tokens } from "@canva/app-ui-kit";

interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  onShapeComplete: (path: Point[]) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onShapeComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWidth = 300;
  const canvasHeight = 300;
  const [controlPoints, setControlPoints] = useState<Point[]>([
    { x: canvasWidth / 6, y: canvasHeight / 2 },
    { x: (canvasWidth / 6) * 2, y: canvasHeight / 2 },
    { x: (canvasWidth / 6) * 3, y: canvasHeight / 2 },
    { x: (canvasWidth / 6) * 4, y: canvasHeight / 2 },
    { x: (canvasWidth / 6) * 5, y: canvasHeight / 2 }
  ]);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);

  const getMousePosition = (event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = event instanceof MouseEvent ? event.clientX - rect.left : event.touches[0].clientX - rect.left;
    const y = event instanceof MouseEvent ? event.clientY - rect.top : event.touches[0].clientY - rect.top;
    return { x, y };
  };

  const handleMouseDown = (event: React.MouseEvent | React.TouchEvent, index: number) => {
    event.preventDefault();
    setDraggingPointIndex(index);
  };

  const handleMouseMove = (event: MouseEvent | TouchEvent) => {
    if (draggingPointIndex === null) return;
    event.preventDefault();
    const { x, y } = getMousePosition(event);
    setControlPoints((prevPoints) =>
      prevPoints.map((point, index) =>
        index === draggingPointIndex ? { x, y } : point
      )
    );
  };

  const handleMouseUp = () => {
    setDraggingPointIndex(null);
    onShapeComplete(controlPoints);
  };

  const drawCurve = (ctx: CanvasRenderingContext2D, points: Point[]) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 2; i++) {
      const cp1x = (points[i].x + points[i + 1].x) / 2;
      const cp1y = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, cp1x, cp1y);
    }

    const cp1x = (points[points.length - 2].x + points[points.length - 1].x) / 2;
    const cp1y = (points[points.length - 2].y + points[points.length - 1].y) / 2;
    ctx.quadraticCurveTo(points[points.length - 2].x, points[points.length - 2].y, cp1x, cp1y);
    ctx.quadraticCurveTo(cp1x, cp1y, points[points.length - 1].x, points[points.length - 1].y);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawCurve(ctx, controlPoints);

    controlPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2, true);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.strokeStyle = "red";
      ctx.stroke();
    });
  }, [controlPoints]);

  useEffect(() => {
    const handleMouseMoveDocument = (event: MouseEvent) => handleMouseMove(event);
    const handleMouseUpDocument = () => handleMouseUp();

    document.addEventListener('mousemove', handleMouseMoveDocument);
    document.addEventListener('mouseup', handleMouseUpDocument);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUpDocument);

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveDocument);
      document.removeEventListener('mouseup', handleMouseUpDocument);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUpDocument);
    };
  }, [draggingPointIndex]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        borderRadius: "3px",
        border: "1px solid",
        borderColor: tokens.colorBorder,
      }}
      onMouseDown={(e) => {
        const pos = getMousePosition(e.nativeEvent);
        controlPoints.forEach((point, index) => {
          if (Math.hypot(point.x - pos.x, point.y - pos.y) < 5) {
            handleMouseDown(e, index);
          }
        });
      }}
      onTouchStart={(e) => {
        const pos = getMousePosition(e.nativeEvent);
        controlPoints.forEach((point, index) => {
          if (Math.hypot(point.x - pos.x, point.y - pos.y) < 5) {
            handleMouseDown(e, index);
          }
        });
      }}
      width={canvasWidth}
      height={canvasHeight}
    />
  );
};

export default DrawingCanvas;
