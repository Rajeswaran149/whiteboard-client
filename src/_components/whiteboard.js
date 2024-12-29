import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import Logout from "./logout";

// Connect to the WebSocket server, passing the JWT token for authentication
const socket = io("http://localhost:5000", {
  query: { token: localStorage.getItem("token") },
});

const Whiteboard = () => {
  const [color, setColor] = useState("#000000");
  const [drawing, setDrawing] = useState(false);
  const [eraser, setEraser] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [drawHistory, setDrawHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    // Sync session state when a new user joins
    socket.on("sessionState", (sessionData) => {
      if (sessionData.drawingActions) {
        sessionData.drawingActions.forEach((action) => {
          const ctx = ctxRef.current;
          ctx.strokeStyle = action.color;
          ctx.lineTo(action.x, action.y);
          ctx.stroke();
        });
      }
    });

    // Handle real-time updates from other users
    socket.on("draw", (data) => {
      const { x, y, color } = data;
      const ctx = ctxRef.current;
      ctx.strokeStyle = color;
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Update the drawing color based on other users' actions
    socket.on("colorChange", (newColor) => {
      setColor(newColor);
    });

    // Handle user join/leave events
    socket.on("userJoined", (username) => {
      setActiveUsers((prevUsers) => [...prevUsers, username]);
    });

    socket.on("userLeft", (username) => {
      setActiveUsers((prevUsers) =>
        prevUsers.filter((user) => user !== username)
      );
    });

    // Handle undo/redo from other users
    socket.on("undo", () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    });

    socket.on("redo", () => {
      if (currentIndex < drawHistory.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    });

    socket.on("clearCanvas", () => {
      clearCanvas();
    });

    // Clean up the event listeners when the component unmounts
    return () => {
      socket.off("sessionState");
      socket.off("draw");
      socket.off("colorChange");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("undo");
      socket.off("redo");
      socket.off("clearCanvas");
    };
  }, [currentIndex, drawHistory]);

  useEffect(() => {
    // Initialize the canvas context
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;
  }, []);

  // Start drawing
  const startDrawing = (e) => {
    setDrawing(true);
    draw(e);
  };

  // Stop drawing
  const stopDrawing = () => {
    setDrawing(false);
    const ctx = ctxRef.current;
    ctx.beginPath();
  };

  // Handle drawing logic
  const draw = (e) => {
    if (!drawing) return;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    // Get mouse position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineCap = "round";

    // Change line width for the eraser tool
    if (eraser) {
      ctx.lineWidth = 25;
    } else {
      ctx.lineWidth = 5;
    }

    ctx.strokeStyle = eraser ? "#ffffff" : color;

    ctx.lineTo(x, y);
    ctx.stroke();

    // Save the drawing action to history for undo/redo
    saveDrawingHistory(x, y, eraser ? "#ffffff" : color);

    // Emit the drawing action to the server
    socket.emit("draw", {
      x,
      y,
      color: eraser ? "#ffffff" : color,
    });
  };

  // Save drawing history
  const saveDrawingHistory = (x, y, color) => {
    const newHistory = [
      ...drawHistory.slice(0, currentIndex + 1),
      { x, y, color },
    ];
    setDrawHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  // Undo action
  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      socket.emit("undo");
      redrawCanvas(currentIndex - 1);
    }
  };

  // Redo action
  const redo = () => {
    if (currentIndex < drawHistory.length - 1) {
      setCurrentIndex(currentIndex + 1);
      socket.emit("redo");
      redrawCanvas(currentIndex + 1);
    }
  };

  // Clear the canvas
  const clearCanvas = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // Do not reset drawing history here
    setCurrentIndex(-1);
    socket.emit("clearCanvas");
  };

  // Redraw canvas with the current drawing history up to the selected index
  const redrawCanvas = (index) => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const actionsToRedraw = drawHistory.slice(0, index + 1);
    actionsToRedraw.forEach((action) => {
      ctx.strokeStyle = action.color;
      ctx.lineTo(action.x, action.y);
      ctx.stroke();
    });
  };

  // Handle color change
  const handleColorChange = (newColor) => {
    setColor(newColor);
    socket.emit("colorChange", newColor);
  };

  // Handle eraser toggle
  const toggleEraser = () => {
    setEraser(!eraser);

    const canvas = canvasRef.current;
    // Change the cursor when eraser is active
    if (!eraser) {
      canvas.style.cursor = 'url("/path/to/eraser-cursor.png"), auto';
    } else {
      canvas.style.cursor = "crosshair";
    }
  };

  // Join a session dynamically
  const joinSession = (sessionId) => {
    socket.emit("joinSession", sessionId);
    setSessionId(sessionId);
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-6">
      {/* Active User List */}
      <div className="text-lg">
        <ul>
          {activeUsers.map((username, index) => (
            <li key={index} className="text-sm text-gray-700">
              {username}
            </li>
          ))}
        </ul>
      </div>

      {/* Session Management */}
      <div className="space-x-4">
        <button
          onClick={() => joinSession("session1")}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Join Session
        </button>
      </div>

      {/* Color Selection */}
      <div className="space-x-4">
        <button
          onClick={() => handleColorChange("#ff0000")}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
        >
          Red
        </button>
        <button
          onClick={() => handleColorChange("#00ff00")}
          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
        >
          Green
        </button>
        <button
          onClick={() => handleColorChange("#0000ff")}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Blue
        </button>
        <button
          onClick={toggleEraser}
          className={`p-2 ${
            eraser ? "bg-gray-500" : "bg-gray-300"
          } text-white rounded-lg hover:bg-gray-600 transition duration-200`}
        >
          {eraser ? "Eraser On" : "Eraser Off"}
        </button>
      </div>

      {/* Undo/Redo/Reset Canvas */}
      <div className="space-x-4">
        <button
          onClick={undo}
          className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-200"
        >
          Undo
        </button>
        <button
          onClick={redo}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Redo
        </button>
        <button
          onClick={clearCanvas}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
        >
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          className="border-2 border-gray-300 rounded-lg"
        />
      </div>
      <Logout />
    </div>
  );
};

export default Whiteboard;
