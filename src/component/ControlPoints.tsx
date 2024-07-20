import React from 'react';

interface Point {
  x: number;
  y: number;
}

interface ControlPointsProps {
  points: Point[];
  onUpdate: (points: Point[]) => void;
}

const ControlPoints: React.FC<ControlPointsProps> = ({ points, onUpdate }) => {
  const handleDrag = (index: number, event: React.MouseEvent) => {
    const { clientX, clientY } = event;
    const updatedPoints = [...points];
    updatedPoints[index] = { x: clientX, y: clientY };
    onUpdate(updatedPoints);
  };

  return (
    <>
      {points.map((point, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: point.x,
            top: point.y,
            width: '10px',
            height: '10px',
            backgroundColor: 'red',
            cursor: 'pointer',
          }}
          onMouseDown={(event) => event.preventDefault()}
          onMouseMove={(event) => handleDrag(index, event)}
        />
      ))}
    </>
  );
};

export default ControlPoints