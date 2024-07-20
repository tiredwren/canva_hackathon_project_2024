// src/App.tsx
import React, { useState } from 'react';
import DrawingCanvas from './component/DrawingCanvas';
import ControlPoints from './component/ControlPoints';
import { Rows, Button, Text } from '@canva/app-ui-kit';

interface Point {
  x: number;
  y: number;
}

export const App: React.FC = () => {
  const [shapePath, setShapePath] = useState<Point[]>([]);

  const handleShapeComplete = (path: Point[]) => {
    setShapePath(path);
  };

  const handlePointsUpdate = (points: Point[]) => {
    setShapePath(points);
  };

  const createTextBox = () => {
    console.log("Text box shape path: " + JSON.stringify(shapePath));
  };

  return (
    <Rows spacing='3u'>
    <div>
      <Text>Draw your desired text box shape below.</Text>
      <DrawingCanvas onShapeComplete={handleShapeComplete} />
      {shapePath.length > 0 && (
        <ControlPoints points={shapePath} onUpdate={handlePointsUpdate} />
      )}
      <div>
        <br></br>
      <Button alignment='center' variant='primary' onClick={createTextBox}>Create Text Box</Button>
      </div>
    </div>
    </Rows>
  );
};