"use client";

import React, { useEffect, useRef, useState } from "react";
import { EraserButton } from "./button/EraserButton";
import { LineThicknessButton } from "./button/LineThicknessButton";
import { ColorButton } from "./button/ColorButton";
import { UndoButton } from "./button/UndoButton";
import { RedoButton } from "./button/RedoButton";
import { AllClearButton } from "./button/AllClearButton";
import { io, Socket } from "socket.io-client";
import { SaveImageButton } from "./button/SaveImageButton";

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_API_URL;

const Whiteboard = () => {
  const socketRef = useRef<Socket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineColor, setLineColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const [hasStartedDrawing, setHasStartedDrawing] = useState(false);
  const [isUndoRedoInProgress, setIsUndoRedoInProgress] = useState(false);
  const firstRenderingRef = useRef<boolean>(true);
  const prevXRef = useRef<number | null>(null);
  const prevYRef = useRef<number | null>(null);
  const MAX_HISTORY = 10;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor;
      ctxRef.current = ctx;
    }
  }, [lineWidth, lineColor]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL);

      socketRef.current.on("connect", () => {
        console.log("Connected to the server");
      });

      socketRef.current.on("history", ({ history, redoHistory }) => {
        setHistory(history);
        setRedoHistory(redoHistory);
      });

      socketRef.current.on("drawing", (data) => {
        const { prevX, prevY, x, y, color, lineWidth } = data;
        if (ctxRef.current) {
          ctxRef.current.strokeStyle = color;
          ctxRef.current.lineWidth = lineWidth;
          ctxRef.current.beginPath();
          ctxRef.current.moveTo(prevX, prevY);
          ctxRef.current.lineTo(x, y);
          ctxRef.current.stroke();
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("history");
        socketRef.current.off("drawing");
        socketRef.current?.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    console.log(
      "history-count:",
      history.length,
      "redoHistory-count:",
      redoHistory.length
    );
  }, [history, redoHistory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isEraser) {
      canvas.style.cursor = "url('/eraserImage.png') 16 16, auto";
    } else {
      canvas.style.cursor = "url('/penImage.png') 8 8, auto";
    }
    return () => {
      if (canvas) {
        canvas.style.cursor = "default";
      }
    };
  }, [isEraser, isDrawing]);

  useEffect(() => {
    if (isUndoRedoInProgress) {
      setIsUndoRedoInProgress(false);
      return;
    }
    if (history.length > 0 && !isDrawing) {
      const img = new Image();
      img.src = history[history.length - 1];
      img.onload = () => {
        if (ctxRef.current && canvasRef.current) {
          ctxRef.current.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          ctxRef.current.drawImage(img, 0, 0);
        }
      };
    } else if (history.length === 0 && ctxRef.current && canvasRef.current) {
      if (!firstRenderingRef.current) {
        ctxRef.current.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
      firstRenderingRef.current = false;
    }
  }, [history]);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!ctxRef.current || !canvasRef.current) return;
    const x = "touches" in e ? e.touches[0].clientX : e.nativeEvent.offsetX;
    const y = "touches" in e ? e.touches[0].clientY : e.nativeEvent.offsetY;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);

    setIsDrawing(true);
    setHasStartedDrawing(true);

    prevXRef.current = x;
    prevYRef.current = y;
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !ctxRef.current) return;

    if ("touches" in e) {
      e.preventDefault();
    }

    const x = "touches" in e ? e.touches[0].clientX : e.nativeEvent.offsetX;
    const y = "touches" in e ? e.touches[0].clientY : e.nativeEvent.offsetY;

    if (isEraser) {
      ctxRef.current.clearRect(x - 10, y - 10, 20, 20);
    } else {
      if (prevXRef.current != null && prevYRef.current != null) {
        ctxRef.current.lineTo(x, y);
        ctxRef.current.strokeStyle = lineColor;
        ctxRef.current.lineWidth = lineWidth;
        ctxRef.current.stroke();
      }

      socketRef.current?.emit("drawing", {
        prevX: prevXRef.current,
        prevY: prevYRef.current,
        x,
        y,
        color: lineColor,
        lineWidth,
      });

      prevXRef.current = x;
      prevYRef.current = y;
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    if (!hasStartedDrawing) {
      return;
    }
    if (!isDrawing) {
      const canvasData = canvasRef.current?.toDataURL();
      if (canvasData) {
        setHistory((prevHistory) => {
          const newHistory = [...prevHistory, canvasData];
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
          }
          socketRef.current?.emit("history", {
            history: newHistory,
            redoHistory,
          });
          return newHistory;
        });
        setHasStartedDrawing(false);
      }
    }
  }, [isDrawing, hasStartedDrawing]);

  const undo = () => {
    if (!ctxRef.current || !canvasRef.current || history.length === 0) return;

    setIsUndoRedoInProgress(true);
    const newRedoHistory = [history[history.length - 1], ...redoHistory];
    setRedoHistory(newRedoHistory);

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    socketRef.current?.emit("history", {
      history: newHistory,
      redoHistory: newRedoHistory,
    });

    if (newHistory.length === 0) {
      ctxRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    } else if (newHistory.length >= 1) {
      const lastImage = newHistory[newHistory.length - 1];
      const img = new Image();
      img.src = lastImage as string;
      img.onload = () => {
        ctxRef.current!.clearRect(
          0,
          0,
          canvasRef.current!.width,
          canvasRef.current!.height
        );
        ctxRef.current!.drawImage(img, 0, 0);
      };
    }
  };

  const redo = () => {
    if (redoHistory.length === 0) return;

    setIsUndoRedoInProgress(true);

    const redoLatestImage = redoHistory[0];

    const newHistory = [...history, redoLatestImage];
    setHistory(newHistory);

    const newRedoHistory = redoHistory.slice(1);
    setRedoHistory(newRedoHistory);

    socketRef.current?.emit("history", {
      history: newHistory,
      redoHistory: newRedoHistory,
    });

    const img = new Image();
    img.src = redoLatestImage as string;
    img.onload = () => {
      ctxRef.current!.clearRect(
        0,
        0,
        canvasRef.current!.width,
        canvasRef.current!.height
      );
      ctxRef.current!.drawImage(img, 0, 0);
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSliderActive) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSliderActive || !isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSliderMouseDown = () => {
    setIsSliderActive(true);
  };

  const handleSliderMouseUp = () => {
    setIsSliderActive(false);
  };

  const toggleEraser = () => {
    setIsEraser((prev) => !prev);
  };

  const handleClearCanvas = () => {
    clearCanvas();
    const canvasData = canvasRef.current?.toDataURL();
    if (canvasData) {
      setHistory((prevHistory) => {
        const newHistory = [...prevHistory, canvasData];
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }
        socketRef.current?.emit("history", {
          history: newHistory,
          redoHistory: redoHistory,
        });
        return newHistory;
      });
    }
  };

  const clearCanvas = () => {
    if (ctxRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveCanvasAsImage = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.drawImage(canvas, 0, 0);

    const image = tempCanvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = "canvas-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen w-full grid place-items-center">
      <div
        className="absolute p-4 bg-[#d9fef0] shadow-lg z-10 text-[#333333] rounded-xl text-xs font-semibold cursor-pointer flex flex-col gap-2 items-start"
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex">
          <label htmlFor="strokeColor">
            <ColorButton className="text-3xl" />
          </label>
          <input
            type="color"
            id="strokeColor"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
            className="ml-2"
          />
          <button
            onClick={saveCanvasAsImage}
            className="cursor-pointer hover:opacity-40"
          >
            <SaveImageButton className="text-3xl ml-10 text-[#4a4a4a]" />
          </button>
        </div>
        <div className="flex pl-[2px]">
          <label htmlFor="lineWidth">
            <LineThicknessButton className="text-2xl" />
          </label>
          <input
            type="range"
            id="lineWidth"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="ml-2 cursor-pointer"
            onMouseDown={handleSliderMouseDown}
            onMouseUp={handleSliderMouseUp}
          />
        </div>
        <div className="pl-[2px] flex gap-3">
          <button
            onClick={toggleEraser}
            className={`${
              isEraser && "text-[#ff5757]"
            } rounded-xl cursor-pointer hover:opacity-40`}
          >
            <EraserButton className="text-3xl" />
          </button>
          <button onClick={undo} className="cursor-pointer hover:opacity-40">
            <UndoButton className="text-3xl" />
          </button>
          <button onClick={redo} className="cursor-pointer hover:opacity-40">
            <RedoButton className="text-3xl" />
          </button>
          <button
            onClick={handleClearCanvas}
            className="cursor-pointer hover:opacity-40"
          >
            <AllClearButton className="text-3xl" />
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="border border-gray-300 bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
};

export default Whiteboard;
