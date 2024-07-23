import React, { useState, useEffect } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import { Rows, Button, Text, TextInput, Select, ColorSelector, Slider, Box } from '@canva/app-ui-kit';
import 'styles/components.css';

interface Point {
  x: number;
  y: number;
}

const App: React.FC = () => {
  const [shapePath, setShapePath] = useState<Point[]>([]);
  const [text, setText] = useState<string>('');
  const [scaledPath, setScaledPath] = useState<Point[]>([]);
  const [viewBox, setViewBox] = useState<string>('0 0 500 300');
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(20);
  const [fontColor, setFontColor] = useState<string>('#000000');
  const [fontFamily, setFontFamily] = useState<string>('Arial');

  const handleShapeComplete = (path: Point[]) => {
    setShapePath(path);
  };

  const handleTextChange = (value: string) => {
    setText(value);
  };

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
  };

  const handleFontColorChange = (value: string) => {
    setFontColor(value);
  };

  const handleLetterSpacingChange = (value: number) => {
    setLetterSpacing(value);
  };

  const calculatePathLength = (points: Point[]) => {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  };

  const scalePath = (points: Point[], scale: number) => {
    return points.map(point => ({
      x: point.x * scale,
      y: point.y * scale
    }));
  };

  const calculateBoundingBox = (points: Point[]) => {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 500, maxY: 300 };

    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;

    points.forEach(point => {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });

    return { minX, minY, maxX, maxY };
  };

  useEffect(() => {
    const pathLength = calculatePathLength(shapePath);
    const textLength = text.length * 10; // Approximate text length, adjust factor as needed
    const scale = textLength > pathLength ? textLength / pathLength : 1;
    const scaled = scalePath(shapePath, scale);
    setScaledPath(scaled);

    const { minX, minY, maxX, maxY } = calculateBoundingBox(scaled);
    const width = maxX - minX;
    const height = maxY - minY;
    setViewBox(`${minX - 20} ${minY - 20} ${width + 30} ${height + 30}`);
  }, [text, shapePath]);

  const generatePathD = () => {
    if (scaledPath.length < 2) return '';

    let d = `M ${scaledPath[0].x},${scaledPath[0].y}`;
    for (let i = 0; i < scaledPath.length - 1; i++) {
      const p0 = scaledPath[i > 0 ? i - 1 : i];
      const p1 = scaledPath[i];
      const p2 = scaledPath[i + 1];
      const p3 = scaledPath[i + 2 < scaledPath.length ? i + 2 : i + 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const fontOptions = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Times New Roman', value: 'Times New Roman' }
    // Add more fonts as needed
  ];

  return (
    <Box width='full' paddingEnd='2u'>
    <div className="container">
        <div className="component">
          <Text variant='regular'>Draw your desired text path below.</Text>
          <DrawingCanvas onShapeComplete={handleShapeComplete} />
        </div>
        <br></br>
        <div className="component">
          <Text variant='bold'>Text</Text>
          <TextInput value={text} onChange={handleTextChange} placeholder="Enter text to display on path" />
        </div>
        <br></br>
        <div className="component">
          <Text variant='bold'>Font</Text>
          <Select stretch options={fontOptions} onChange={handleFontFamilyChange} />
        </div>
        <br></br>
        
        <div className="component">
          <Text variant='bold'>Font Size</Text>
          <Slider min={10} max={50} step={1} value={fontSize} onChange={handleFontSizeChange} />
        </div>
        <br></br>
        <div className="component">
          <Text variant='bold'>Letter Spacing</Text>
          <Slider min={0} max={20} step={1} value={letterSpacing} onChange={handleLetterSpacingChange} />
        </div>
        <br></br>
        <div className="component">
          <Text variant='bold'>Text Color</Text>
          <ColorSelector color={fontColor} onChange={handleFontColorChange} />
        </div>
        <br></br>
        {shapePath.length > 0 && (
          <svg viewBox={viewBox} version="1.1" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <path id="userPath" d={generatePathD()} />
            </defs>
            <g fill={fontColor}>
              <text fontSize={fontSize} fontFamily={fontFamily} letterSpacing={letterSpacing}>
                <textPath href="#userPath">
                  {text}
                </textPath>
              </text>
              <use x="0" y="0" href="#userPath" stroke="none" fill="none" />
            </g>
          </svg>
        )}
        <div className="component">
          <Button stretch alignment='center' variant='primary'>Create Text Box</Button>
        </div>
        <br></br>
    </div>
    </Box>
  );
};

export default App;