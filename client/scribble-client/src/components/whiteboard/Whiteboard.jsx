import { useEffect, useRef, useState } from "react"
import { fabric } from "fabric"
import socket from "../../Socket"
import { Lock, Unlock } from "lucide-react"

export default function Whiteboard({ roomCode, mainUsername, roomData }) {
  const canvasRef = useRef(null)
  const [canDraw, setCanDraw] = useState(true)
  const canDrawRef = useRef(true) // ✅ Ref to avoid stale closure
  const [color, setColor] = useState("black")
  const undoStack = useRef([])
  const redoStack = useRef([])
  const canvasInstance = useRef(null)
  const lastTurnRef = useRef(null)

  useEffect(() => {
    const shouldDraw = roomData?.turn === mainUsername
    setCanDraw(shouldDraw)
    canDrawRef.current = shouldDraw
    console.log("🔄 canDraw updated:", shouldDraw)
  }, [roomData, mainUsername])

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
    })

    canvas.freeDrawingBrush.color = color
    canvas.freeDrawingBrush.width = 2
    canvas.isDrawingMode = canDrawRef.current
    canvasInstance.current = canvas

    // ✏️ Drawing
    canvas.on("path:created", (opt) => {
      const path = opt.path
      undoStack.current.push(path)
      redoStack.current = []

      if (canDrawRef.current) {
        socket.emit("drawing", {
          roomCode,
          pathData: {
            path: path.path,
            options: path.toObject(),
          },
        })
      }
    })

    // 📩 Receive live drawing
    socket.on("drawing", ({ pathData }) => {
      if (!canDrawRef.current && pathData) {
        const path = new fabric.Path(pathData.path)
        path.set(pathData.options)
        canvas.add(path)
        canvas.renderAll()
      }
    })

    // 🔄 Receive full canvas sync (undo/redo or new join)
    socket.on("update-canvas", ({ fullCanvas }) => {
      canvas.loadFromJSON(fullCanvas, () => {
        canvas.renderAll()
      })
    })

    // 🆕 New player joins, send full canvas
    socket.on("request_canvas_sync", (targetSocketId) => {
      if (canDrawRef.current) {
        socket.emit("send_canvas_sync", {
          target: targetSocketId,
          fullCanvas: canvas.toJSON(),
        })
      }
    })

    // ⬅️ Receive canvas when joining
    socket.on("receive_canvas_sync", ({ fullCanvas }) => {
      canvas.loadFromJSON(fullCanvas, () => {
        canvas.renderAll()
      })
    })

    return () => {
      socket.off("drawing")
      socket.off("update-canvas")
      socket.off("request_canvas_sync")
      socket.off("receive_canvas_sync")
      canvas.dispose()
    }
  }, [])

  useEffect(() => {
    const canvas = canvasInstance.current
    if (!canvas) return
    canvas.isDrawingMode = canDraw
    canvas.freeDrawingBrush.color = color
  }, [canDraw, color])

  useEffect(() => {
    const canvas = canvasInstance.current
    if (!canvas || roomData?.turn == null) return

    if (lastTurnRef.current && lastTurnRef.current !== roomData.turn) {
      canvas.clear()
      undoStack.current = []
      redoStack.current = []
    }

    lastTurnRef.current = roomData.turn
  }, [roomData?.turn])

  const undo = () => {
    const canvas = canvasInstance.current
    const objects = canvas.getObjects()
    if (objects.length === 0) return
    const last = objects.pop()
    canvas.remove(last)
    undoStack.current.pop()
    redoStack.current.push(last)

    if (canDrawRef.current) {
      socket.emit("undo_redo", {
        roomCode,
        fullCanvas: canvas.toJSON(),
      })
    }
  }

  const redo = () => {
    const canvas = canvasInstance.current
    const last = redoStack.current.pop()
    if (last) {
      canvas.add(last)
      undoStack.current.push(last)

      if (canDrawRef.current) {
        socket.emit("undo_redo", {
          roomCode,
          fullCanvas: canvas.toJSON(),
        })
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="flex gap-4 items-center">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button onClick={undo} className="px-3 py-1 bg-yellow-400 rounded">
          Undo
        </button>
        <button onClick={redo} className="px-3 py-1 bg-green-400 rounded">
          Redo
        </button>

        {/* 🔒 Drawing permission indicator */}
        <div className="flex items-center gap-1">
          {canDraw ? (
            <>
              <Unlock size={20} className="text-green-600" />
              <span className="text-green-600 text-sm font-semibold">You can draw</span>
            </>
          ) : (
            <>
              <Lock size={20} className="text-red-500" />
              <span className="text-red-500 text-sm font-semibold">You can't draw</span>
            </>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-700 font-medium">
        Current turn: <span className="text-blue-600">{roomData?.turn || "—"}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-black bg-white"
      />
    </div>
  )
}