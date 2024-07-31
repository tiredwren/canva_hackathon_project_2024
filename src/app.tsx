import React, { useState, useEffect, useRef } from "react";
import DrawingCanvas from "./components/DrawingCanvas";
import {
  Button,
  Text,
  TextInput,
  Select,
  ColorSelector,
  Slider,
  Box,
  tokens,
} from "@canva/app-ui-kit";
import "styles/components.css";

interface Point {
  x: number;
  y: number;
}

const App: React.FC = () => {
  const [shapePath, setShapePath] = useState<Point[]>([]);
  const [text, setText] = useState<string>("");
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(20);
  const [fontColor, setFontColor] = useState<string>("#000000");
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [textMode, setTextMode] = useState<string>("follow");

  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const clipPathRef = useRef<SVGPathElement>(null);

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

  const calculateBoundingBox = (points: Point[]) => {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 300, maxY: 300 };

    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = points[0].x;
    let maxY = points[0].y;

    points.forEach((point) => {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });

    return { minX, minY, maxX, maxY };
  };

  const measureTextWidth = (text: string, fontSize: number, fontFamily: string) => {
    const canvas = textCanvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    return metrics.width;
  };

  const generatePathD = () => {
    if (shapePath.length < 2) return "";

    let d = `M ${shapePath[0].x},${shapePath[0].y}`;
    for (let i = 0; i < shapePath.length - 1; i++) {
      const p0 = shapePath[i > 0 ? i - 1 : i]; // previous point
      const p1 = shapePath[i]; // current point
      const p2 = shapePath[i + 1]; // next point
      const p3 = shapePath[i + 2 < shapePath.length ? i + 2 : i + 1]; // two points after current

      const cp1x = p1.x + (p2.x - p0.x) / 3;
      const cp1y = p1.y + (p2.y - p0.y) / 3;
      const cp2x = p2.x - (p3.x - p1.x) / 3;
      const cp2y = p2.y - (p3.y - p1.y) / 3;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const fitTextToPath = () => {
    const path = pathRef.current;
    if (!path) return;

    const pathLength = path.getTotalLength();
    let currentFontSize = fontSize;
    let textWidth = measureTextWidth(text, currentFontSize, fontFamily);

    while (textWidth > pathLength && currentFontSize > 1) {
      currentFontSize -= 1;
      textWidth = measureTextWidth(text, currentFontSize, fontFamily);
    }

    setFontSize(currentFontSize);
  };

  const wrapTextToFitShape = (text: string, fontSize: number, maxWidth: number) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let word of words) {
      const testLine = currentLine + word + ' ';
      const testWidth = measureTextWidth(testLine, fontSize, fontFamily);
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) lines.push(currentLine.trim());

    return lines;
  };

  useEffect(() => {
    const { minX, minY, maxX, maxY } = calculateBoundingBox(shapePath);
    const width = maxX - minX;
    const height = maxY - minY;
    const viewBoxWidth = 300;
    const viewBoxHeight = 300;

    if (width > viewBoxWidth || height > viewBoxHeight) {
      const scaleFactor = Math.min(viewBoxWidth / width, viewBoxHeight / height);
      setFontSize((prevFontSize) => prevFontSize * scaleFactor);
    }

    fitTextToPath();
  }, [shapePath, text, fontFamily, letterSpacing]);

  const fontOptions = [
    { label: "Arial", value: "Arial" },
    { label: "Courier New", value: "Courier New" },
    { label: "Times New Roman", value: "Times New Roman" },
    // Add more fonts as needed
  ];

  return (
    <Box width="full" paddingEnd="2u">
      <div className="container">
        <div style={{ border: "1px solid", borderRadius: "3px", borderColor: tokens.colorBorder, padding: "10px", marginBottom: "20px" }}>
          {shapePath.length > 0 && (
            <svg
              viewBox="0 0 300 300" // Set the viewBox height to 300
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", width: "100%", height: "300px" }} // Set height to 300px
            >
              {textMode === "follow" && (
                <>
                  <defs>
                    <path ref={pathRef} id="userPath" d={generatePathD()} />
                  </defs>
                  <text
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    fill={fontColor}
                    x="10" // Ensure text starts closer to the left edge
                    y="20" // Ensure text starts closer to the top edge
                    letterSpacing={letterSpacing}
                  >
                    <textPath spacing='auto' href="#userPath">
                      {text}
                    </textPath>
                  </text>
                </>
              )}
              {textMode === "fill" && (
                <>
                  <defs>
                    <clipPath id="clip-shape">
                      <path ref={clipPathRef} d={generatePathD()} />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#clip-shape)" fill={fontColor}>
                    {wrapTextToFitShape(text, fontSize, 300).map((line, row) => (
                      <text
                        key={row}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        letterSpacing={letterSpacing}
                        x="0" // Align text to the left
                        y={(row * (fontSize + letterSpacing)) + fontSize} // Adjust vertical position
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                </>
              )}
            </svg>
          )}
        </div>
        <div className="component">
          <Text variant="bold">Text</Text>
          <TextInput
            value={text}
            defaultValue="hello world"
            onChange={handleTextChange}
            placeholder="Enter text"
          />
        </div>
        <br />
        <div className="component">
          <Text variant="bold">Font</Text>
          <Select
            stretch
            options={fontOptions}
            onChange={handleFontFamilyChange}
          />
        </div>
        <br />
        <div className="component">
          <Text variant="bold">Font Size</Text>
          <Slider
            min={10}
            max={50}
            step={1}
            value={fontSize}
            onChange={handleFontSizeChange}
          />
        </div>
        <br />
        <div className="component">
          <Text variant="bold">Letter Spacing</Text>
          <Slider
            min={0}
            max={20}
            step={1}
            value={letterSpacing}
            onChange={handleLetterSpacingChange}
          />
        </div>
        <br />
        <div className="component">
          <Text variant="bold">Text Color</Text>
          <ColorSelector color={fontColor} onChange={handleFontColorChange} />
        </div>
        <br />
        <div className="component">
          <Text variant="bold">Text Mode</Text>
          <Select
            stretch
            options={[
              { label: "Follow Path", value: "follow" },
              { label: "Fill Shape", value: "fill" },
            ]}
            onChange={(value) => setTextMode(value)}
          />
        </div>
        <br />
        <div className="component">
          <Text variant="regular">Draw your desired text path below.</Text>
          <DrawingCanvas onShapeComplete={handleShapeComplete} />
        </div>
        <br />
        <div className="component">
          <Button stretch alignment="center" variant="primary">
            Create Text Box
          </Button>
        </div>
        <br />
      </div>
      <canvas ref={textCanvasRef} style={{ display: "none" }} />
    </Box>
  );
};

export default App;
