import { useState, useEffect, useRef } from "react";
import * as React from "react";
import {
  Button,
  Text,
  TextInput,
  ColorSelector,
  Slider,
  Box,
  tokens,
  Select,
} from "@canva/app-ui-kit";
import "styles/components.css";
import { requestFontSelection, Font } from "@canva/asset";
import { initAppElement } from "@canva/design";
import * as fabric from "fabric";
import { PointsNode } from "@shopify/react-native-skia/lib/typescript/src/dom/nodes/drawings";

interface Point {
  x: number;
  y: number;
}

interface DrawingCanvasProps {
  onShapeComplete: (path: Point[]) => void,
  ctrlpts: Point[],
}

const drawCurve = (ctx: CanvasRenderingContext2D, points: Point[]) => {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 === points.length ? i + 1 : i + 2];

    for (let t = 0; t <= 1; t += 0.02) {
      const x = 0.5 * ((-p0.x + 3*p1.x - 3*p2.x + p3.x) * (t * t * t) + 
                      (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * (t * t) + 
                      (-p0.x + p2.x) * t + 
                      2*p1.x);

      const y = 0.5 * ((-p0.y + 3*p1.y - 3*p2.y + p3.y) * (t * t * t) + 
                      (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * (t * t) + 
                      (-p0.y + p2.y) * t + 
                      2*p1.y);

      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle = "dodgerblue";
  ctx.fillStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onShapeComplete, ctrlpts }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWidth = 300;
  const canvasHeight = 200;
  let initialControlPoints = [
    { x: canvasWidth / 6, y: canvasHeight / 2 },
    { x: (canvasWidth / 6) * 2, y: canvasHeight / 2 },
    { x: (canvasWidth / 6) * 3, y: canvasHeight / 2 },
    { x: (canvasWidth / 6) * 4, y: canvasHeight / 2 },
    { x: (canvasWidth / 6) * 5, y: canvasHeight / 2 }
  ];
  const [controlPoints, setControlPoints] = useState<Point[]>(initialControlPoints);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);

  const getMousePosition = (event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = event instanceof MouseEvent ? event.clientX - rect.left : event.touches[0].clientX - rect.left;
    const y = event instanceof MouseEvent ? event.clientY - rect.top : event.touches[0].clientY - rect.top;
    return { x, y };
  };

  ctrlpts=controlPoints;

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
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.strokeStyle = "dodgerblue";
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

  const resetCanvas = () => {
    setControlPoints(initialControlPoints);
  };

  return (
    <div>
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
      <br></br>
      <br></br>
      <br></br>
      <Button stretch variant="secondary" onClick={resetCanvas}>Reset curves</Button>
    </div>
  );
};


export default function App() {
  
type AppElementData = {
  shapePath: string;
  text: string;
  letterSpacing: number;
  fontSize: number;
  fontName: string;
  fontColor: string;
}

  const [state, setState] = React.useState ({
    shapePathX: `[{"x":50,"y":100},{"x":100,"y":100},{"x":150,"y":100},{"x":200,"y":100},{"x":250,"y":100}]`,
    text: "hello world",
    letterSpacing: 5,
    fontSize: 20,
    fontColor: "#FF877D",
    selectedFont: "Verdana",
    isSelected: false
  });

  React.useEffect(() => {
    appElementClient.registerOnElementChange((element) => {
      if (element) {
        setState({
          shapePathX: element.data.shapePath,
          text: element.data.text,
          letterSpacing: element.data.letterSpacing,
          fontSize: element.data.fontSize,
          fontColor: element.data.fontColor,
          selectedFont: element.data.fontName,
          isSelected: true,
        });
        console.log(state)
      } else {
        setState({
          shapePathX: `[{"x":50,"y":100},{"x":100,"y":100},{"x":150,"y":100},{"x":200,"y":100},{"x":250,"y":100}]`,
          text: "",
          letterSpacing: 5,
          fontSize: 20,
          fontColor: "#FF877D",
          selectedFont: "Verdana",
          isSelected: false
        });
        console.log(state)
      }
    });
  }, []);

  const [shapePath, setShapePath] = useState<Point[]>([]);
  const [text, setText] = useState<string>("");
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(20);
  const [fontColor, setFontColor] = useState<string>("#FF877D");
  const [fontName, setFontName] = useState<string>("")

  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  if (fontName == null) {
    setFontName("'Arial Black', sans-serif")
  }
  
  const handleShapeComplete = (path: Point[]) => {
    setShapePath(path);
    setState((prevState) => ({
      ...prevState,
      shapePathX: JSON.stringify(path),
    }));
  };

const handleFontFamilyChange = (value: string) => {
  setFontName(value);
  setState((prevState) => ({
    ...prevState,
    selectedFont: value,
  }));
};

const handleTextChange = (value: string) => {
  setText(value);
  setState((prevState) => ({
    ...prevState,
    text: value,
  }));
  console.log(value)
};

const handleFontSizeChange = (value: number) => {
  setFontSize(value);
  setState((prevState) => ({
    ...prevState,
    fontSize: value,
  }));
  console.log(fontSize)
};

const handleFontColorChange = (value: string) => {
  setFontColor(value);
  setState((prevState) => ({
    ...prevState,
    fontColor: value,
  }));
  console.log(fontColor)
};

const handleLetterSpacingChange = (value: number) => {
  setLetterSpacing(value);
  setState((prevState) => ({
    ...prevState,
    letterSpacing: value,
  }));
  console.log(letterSpacing)
};

  function createTextBox() {
    appElementClient.addOrUpdateElement({
      shapePath: state.shapePathX,
      text: state.text,
      letterSpacing: state.letterSpacing,
      fontSize: state.fontSize,
      fontName: state.selectedFont,
      fontColor: state.fontColor,
    });
  }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      setState((prevState) => {
        return {
          ...prevState,
          [event.target.name]: event.target.value,
        };
      });
    }

  const calculateBoundingBox = (points: Point[]) => {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 300, maxY: 200 };

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

  const measureTextHeightX = (points: string) => {
    let most = 2;
    let least = 0
    const array = JSON.parse(points);
    console.log(array)
    const p1 = array[0].x
    const p2 = array[1].x
    const p3 = array[2].x
    const p4 = array[3].x
    const p5 = array[4].x

    least = Math.min(p1,p2,p3,p4,p5)
    most = Math.max(p1,p2,p3,p4,p5)

    return (most-least);
  }

  const measureTextHeight = (points: string) => {
    let most = 2;
    let least = 0
    const array = JSON.parse(points);
    console.log(array)
    const p1 = array[0].y
    const p2 = array[1].y
    const p3 = array[2].y
    const p4 = array[3].y
    const p5 = array[4].y

    least = Math.min(p1,p2,p3,p4,p5)
    most = Math.max(p1,p2,p3,p4,p5)

    return (most-least+state.fontSize);
  }

  const measureTextWidth = (text: string, fontSize: number, fontFamily: string, letterSpacing: number) => {
    const canvas = textCanvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
  
    // set font
    ctx.font = `${fontSize}px ${fontFamily}`;
  
    // measure the width of the entire text
    let totalWidth = 0;
  
    // loop through each character in the text
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const metrics = ctx.measureText(char);
      totalWidth += metrics.width;
  
      // add letter spacing, but not after the last character
      if (i < text.length - 1) {
        totalWidth += letterSpacing;
      }
    }
  
    console.log(`Total width with letter spacing: ${totalWidth}`);
    return totalWidth;
  };
  

  const generatePathD = () => {

    const path = JSON.parse(state.shapePathX);

    if (path.length < 2) return "";

    let d = `M ${path[0].x},${path[0].y}`;
    for (let i = 0; i < path.length - 1; i++) {
      const p0 = path[i > 0 ? i - 1 : i];
      const p1 = path[i];
      const p2 = path[i + 1];
      const p3 = path[i + 2 < path.length ? i + 2 : i + 1];

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
    let textWidth = measureTextWidth(text, currentFontSize, fontName, letterSpacing);
    let measuredTextWidth = textWidth*2 - 20

    while (measuredTextWidth > pathLength && currentFontSize > 1) {
      currentFontSize -= 1;
      measuredTextWidth = measureTextWidth(text, currentFontSize, fontName, letterSpacing);
    }

    handleFontSizeChange(currentFontSize);
    state.fontSize = (currentFontSize);
    console.log(currentFontSize)
  };

  useEffect(() => {
    const { minX, minY, maxX, maxY } = calculateBoundingBox(shapePath);

    fitTextToPath();
  }, [shapePath, text, letterSpacing, fontName, fontSize]);

const fontOptions = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Arial Black", value: "'Arial Black', sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Impact", value: "Impact, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Comic Sans MS", value: "'Comic Sans MS', sans-serif" },
  { label: "Lucida Console", value: "'Lucida Console', monospace" },
  { label: "Lucida Sans Unicode", value: "'Lucida Sans Unicode', sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Palatino Linotype", value: "'Palatino Linotype', serif" },
  { label: "Gill Sans", value: "'Gill Sans', sans-serif" },
  { label: "Century Gothic", value: "'Century Gothic', sans-serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Cambria", value: "Cambria, serif" },
  { label: "Candara", value: "Candara, sans-serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Franklin Gothic Medium", value: "'Franklin Gothic Medium', sans-serif" },
  { label: "Geneva", value: "Geneva, sans-serif" },
  { label: "Optima", value: "Optima, sans-serif" },
  { label: "Perpetua", value: "Perpetua, serif" },
  { label: "Rockwell", value: "Rockwell, serif" },
  { label: "Segoe UI", value: "'Segoe UI', sans-serif" },
  { label: "Sylfaen", value: "Sylfaen, serif" },
  { label: "Verdana Pro", value: "'Verdana Pro', sans-serif" },
  { label: "Courier", value: "Courier, monospace" },
  { label: "Consolas", value: "Consolas, monospace" },
  { label: "American Typewriter", value: "'American Typewriter', serif" },

    // Add more fonts as needed
];



function pointsToCatmullRomPath(points: string | any[]) {
  if (points.length < 2) return '';

  let pathData = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 === points.length ? i + 1 : i + 2];

    for (let t = 0; t <= 1; t += 0.02) {
      const x = 0.5 * ((-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * (t * t * t) +
                      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * (t * t) +
                      (-p0.x + p2.x) * t +
                      2 * p1.x);

      const y = 0.5 * ((-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * (t * t * t) +
                      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * (t * t) +
                      (-p0.y + p2.y) * t +
                      2 * p1.y);

      pathData += ` L ${x},${y}`;
    }
  }

  console.log(pathData);
  return pathData;
}

function pathToImage(shapePath: string, text: string, letterSpacing: number, fontSize: number, fontName: string, fontColor: string) {
  // ensure the shapePath is a string and convert it to points
  const pathData = JSON.parse(JSON.parse((shapePath)));

  console.log(JSON.parse(JSON.parse((shapePath))))
  
  const svgPathData = pointsToCatmullRomPath(pathData);

  // create a canvas using fabric.js
  const canvas = new fabric.Canvas('canvas', {
    width: measureTextHeightX(state.shapePathX),
    height: measureTextHeight(state.shapePathX)
  });

  console.log(canvas.height)

  // create the path using fabric.Path
  const path = new fabric.Path(svgPathData, {
    fill: '',
    selectable: false
  });

  console.log(canvas.height / 2)

  // add path to canvas
  canvas.add(path);

  // calculate the total length of the path using fabric.js utility
  const pathInfo = fabric.util.getPathSegmentsInfo(path.path);
  const pathLength = pathInfo[pathInfo.length - 1].length - 10;

  // adjust font size based on the path length and text length
  const adjustedFontSize = fontSize || (2.5 * pathLength / text.length);

  // create a dummy text object to measure character widths
  const dummyText = new fabric.FabricText('', {
    fontFamily: fontName,
    fontSize: adjustedFontSize,
  });

  // split the text into individual characters and position them along the path
  let currentOffset = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    dummyText.set('text', char);
    const charWidth = dummyText.width;

    // check if adding the next character would exceed the path length
    if (currentOffset + charWidth > pathLength) {
      break;
    }

    const charText = new fabric.FabricText(char, {
      fontFamily: fontName,
      fontSize: fontSize,
      fill: fontColor,
      left: 0,
      top: canvas.height,
      originX: 'left',
      originY: 'bottom',
      path: path,
      pathStartOffset: currentOffset,
    });

    // add character to the canvas
    canvas.add(charText);

    // increment offset for next character, including letterSpacing
    currentOffset += charWidth + letterSpacing;
  }

  console.log(canvas.height,canvas.width)

  // serialize the canvas to an image
  const imageData = canvas.toDataURL({
    format: 'png',
    multiplier: 3,
  });
  return imageData;
}

  const appElementClient = initAppElement<AppElementData>({
    render: (data) => {
      const dataUrl = pathToImage(JSON.stringify(data.shapePath), data.text, data.letterSpacing, data.fontSize, data.fontName, data.fontColor);
      return [
        {
          type: "IMAGE",
          dataUrl,
          width: (measureTextHeightX(state.shapePathX))*4,
          height: (measureTextHeight(state.shapePathX))*4,
          top: 0,
          left: 0,
        },
      ];
    },
  });

  return (
    <Box width="full" padding="2u">
      <div className="container">
      <Text>Note that the text will not fit itself to the path until a font is selected.</Text>
      <br></br>
        <div style={{ border: "1px solid", borderRadius: "3px", borderColor: tokens.colorBorder, padding: "10px", marginBottom: "20px" }}>
          <svg
              viewBox="0 0 300 200"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", width: "100%", height: "200" }}
            >
              <defs>
                <path ref={pathRef} id="userPath" d={generatePathD()} />
              </defs>
              <text
                fontFamily={state.selectedFont}
                fontSize={state.fontSize}
                fill={state.fontColor}
                x="10"
                y="20"
                letterSpacing={state.letterSpacing}
              >
                <textPath spacing="auto" href="#userPath">
                  {state.text}
                </textPath>
              </text>
            </svg>
        </div>
      </div>
        <div className="component">
          <Text variant="bold">Text</Text>
          <TextInput
            value={state.text}
            onChange={handleTextChange}
            placeholder="Enter text"
          />
        </div>
        <br />

        {/* testing selection */}
        <div className="component">
          <Text variant="bold">Font</Text>
          <Select
            stretch
            options={fontOptions}
            onChange={handleFontFamilyChange}
          />
        <br />
        <div className="component">
          <Text variant="bold">Font size</Text>
          <Slider
            min={1}
            max={50}
            step={1}
            value={state.fontSize}
            onChange={handleFontSizeChange}
          />
        </div>
        <br />
        <div className="component">
          <Text variant="bold">Letter spacing</Text>
          <Slider
            min={0}
            max={20}
            step={1}
            value={state.letterSpacing}
            onChange={handleLetterSpacingChange}
          />
        </div>
        <br />
        <div className="component">
          <Text variant="bold">Text color</Text>
          <ColorSelector color={state.fontColor} onChange={handleFontColorChange} />
        </div>
        <br />
        <div className="component">
          <Text variant="regular">Construct your desired text path below.</Text>
          <DrawingCanvas onShapeComplete={handleShapeComplete} ctrlpts={JSON.parse(state.shapePathX)}/>
        </div>
        <br />
        <div className="component">
          <Button stretch type="submit" alignment="center" variant="primary" onClick={createTextBox}>
            {state.isSelected ?  "Update text path" : "Create text path"}
          </Button>
        </div>
        <br />
      </div>
      <canvas ref={textCanvasRef} style={{ display: "none" }} />
    </Box>
  );
};

