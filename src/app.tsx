import { useState, useEffect, useRef } from "react";
import * as React from "react";
import DrawingCanvas from "./components/DrawingCanvas";
import {
  Button,
  Text,
  TextInput,
  ColorSelector,
  Slider,
  Box,
  tokens,
  ArrowRightIcon,
} from "@canva/app-ui-kit";
import "styles/components.css";
import { requestFontSelection, Font } from "@canva/asset";
import { initAppElement } from "@canva/design";
import * as fabric from "fabric";

interface Point {
  x: number;
  y: number;
}


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
          fontColor: "FF877D",
          selectedFont: "Verdana",
          isSelected: false
        });
        console.log(state)
      }
    });
  }, []);

  const [shapePath, setShapePath] = useState<Point[]>([]);
  const [text, setText] = useState<string>("");
  const [letterSpacing, setLetterSpacing] = useState<number>(5);
  const [fontSize, setFontSize] = useState<number>(20);
  const [fontColor, setFontColor] = useState<string>("#FF877D");
  const [selectedFont, setSelectedFont] = React.useState<Font | undefined>();
  const [fontName, setFontName] = useState<string>("")

  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  async function selectFont() {
    const fontResponse = await requestFontSelection({
      selectedFontRef: selectedFont?.ref,
    });

    if (fontResponse.type !== "COMPLETED") {
      return;
    }

    // update selected font
    setSelectedFont(fontResponse.font);
    setFontName(selectedFont?.name.toString() || "Verdana")
  }
  
  const handleShapeComplete = (path: Point[]) => {
    setShapePath(path);
    setState((prevState) => ({
      ...prevState,
      shapePathX: JSON.stringify(path),
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
      fontColor: state.fontColor
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
      const p0 = shapePath[i > 0 ? i - 1 : i];
      const p1 = shapePath[i];
      const p2 = shapePath[i + 1];
      const p3 = shapePath[i + 2 < shapePath.length ? i + 2 : i + 1];

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
    let textWidth = measureTextWidth(text, currentFontSize, selectedFont?.name || "Verdana");
    let measuredTextWidth = textWidth*2 - 20

    while (measuredTextWidth > pathLength && currentFontSize > 1) {
      currentFontSize -= 1;
      measuredTextWidth = measureTextWidth(text, currentFontSize, selectedFont?.name || "Verdana");
    }

    setFontSize(currentFontSize);
  };

  useEffect(() => {
    const { minX, minY, maxX, maxY } = calculateBoundingBox(shapePath);
    const width = maxX - minX;
    const height = maxY - minY;
    const viewBoxWidth = 300;
    const viewBoxHeight = 200;

    if (width > viewBoxWidth || height > viewBoxHeight) {
      const scaleFactor = Math.min(viewBoxWidth / width, viewBoxHeight / height);
      setFontSize((prevFontSize) => prevFontSize * scaleFactor);
    }

    fitTextToPath();
  }, [shapePath, text, letterSpacing, selectedFont, fontSize]);


//   function pathToImage(shapePath: string, text: string, letterSpacing: number, fontSize: number, fontName: string): string {
//     const canvas = document.createElement("canvas");

//     canvas.width = 300;
//     canvas.height = 200;

//     const context = canvas.getContext("2d");

//     if (!context) {
//         throw new Error("Can't get CanvasRenderingContext2D");
//     }

//     // convert shapePath string to an array of points
//     const arrayPath = JSON.parse(JSON.parse(shapePath));

//     context.font = `${fontSize}px ${fontName}`;
//     console.log(`params: ${fontName}, ${fontSize}, ${JSON.stringify(letterSpacing)}`)
//     context.letterSpacing = `${JSON.stringify(letterSpacing)}px`;
//     context.fillStyle = fontColor;
//     context.fillText(`${text}`,arrayPath[0].x, arrayPath[0].y);
    
//     return canvas.toDataURL();
// }


function pointsToCatmullRomPath(points) {
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
    width: 300,
    height: 200
  });

  // create the path using fabric.Path
  const path = new fabric.Path(svgPathData, {
    fill: '',
    selectable: false
  });

  path.set({
    left: canvas.width / 2 - path.width / 2,
    top: canvas.height / 2 - path.height / 2,
  });

  // add path to canvas
  canvas.add(path);

  // calculate the total length of the path using fabric.js utility
  const pathInfo = fabric.util.getPathSegmentsInfo(path.path);
  const pathLength = pathInfo[pathInfo.length - 1].length - 10;

  // adjust font size based on the path length and text length
  const adjustedFontSize = fontSize || (2.5 * pathLength / text.length);

  // create a dummy text object to measure character widths
  const dummyText = new fabric.FabricText('', {
    fontFamily: fontName || "Verdana",
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
      fontFamily: fontName || "Verdana",
      fontSize: fontSize,
      fill: fontColor,
      left: canvas.width / 2,
      top: canvas.height / 2,
      originX: 'center',
      originY: 'center',
      path: path,
      pathStartOffset: currentOffset,
    });

    // add character to the canvas
    canvas.add(charText);

    // increment offset for next character, including letterSpacing
    currentOffset += charWidth + letterSpacing;
  }

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
          width: 900,
          height: 600,
          top: 0,
          left: 0,
        },
      ];
    },
  });

  return (
    <Box width="full" padding="2u">
      <div className="container">
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
        <div className="component">
          <Text variant="bold">Text</Text>
          <TextInput
            value={state.text}
            onChange={handleTextChange}
            placeholder="Enter text"
          />
        </div>
        <br />
        <div className="component">
          <Text variant="bold">Font</Text>
          <Button
            variant="secondary"
            stretch
            alignment="start"
            onClick={selectFont}
            icon={ArrowRightIcon}
            iconPosition="end"
          >
            {selectedFont?.name || "Verdana"}
          </Button>
        </div>
        <br />
        <div className="component">
          <Text variant="bold">Font size</Text>
          <Slider
            min={10}
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
          <DrawingCanvas onShapeComplete={handleShapeComplete} />
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