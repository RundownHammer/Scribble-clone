import { useEffect, useRef, useState } from "react"
import { fabric } from "fabric"
import socket from "../../Socket"

export default function Whiteboard({ roomCode, mainUsername, roomData }) {
  const canvasRef = useRef(null)
  const [canDraw, setCanDraw] = useState(false)
  const [color, setColor] = useState("black")
  const undoStack = useRef([])
  const redoStack = useRef([])
  const canvasInstance = useRef(null)
  const lastTurnRef = useRef(null)

  // Update drawing permission
  useEffect(() => {
    const isTurn = roomData?.turn === mainUsername
    setCanDraw(isTurn)
  }, [roomData, mainUsername])

  // Initialize canvas
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
    })

    canvas.freeDrawingBrush.color = color
    canvas.freeDrawingBrush.width = 2
    canvas.isDrawingMode = canDraw
    canvasInstance.current = canvas

    // When drawing is made, emit full canvas JSON
    canvas.on("path:created", (opt) => {
      const pathData = opt.path
      undoStack.current.push(pathData)
      redoStack.current = []

      if (canDraw) {
        socket.emit("drawing", {
          roomCode,
          data: pathData.toObject(),
          fullCanvas: canvas.toJSON(),
        })
      }
    })

    // Receive a drawing or update from others
    socket.on("drawing", ({ fullCanvas }) => {
      if (!canDraw && fullCanvas) {
        canvas.loadFromJSON(fullCanvas, canvas.renderAll.bind(canvas))
      }
    })

    socket.on("update-canvas", ({ fullCanvas }) => {
      if (!canDraw && fullCanvas) {
        canvas.loadFromJSON(fullCanvas, canvas.renderAll.bind(canvas))
      }
    })

    return () => {
      socket.off("drawing")
      socket.off("update-canvas")
      canvas.dispose()
    }
  }, [])

  // Update brush settings if color/permission changes
  useEffect(() => {
    const canvas = canvasInstance.current
    if (!canvas) return
    canvas.isDrawingMode = canDraw
    canvas.freeDrawingBrush.color = color
  }, [canDraw, color])

  // Clear and reset canvas when turn changes
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

    if (canDraw) {
      socket.emit("update-canvas", {
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

      if (canDraw) {
        socket.emit("update-canvas", {
          roomCode,
          fullCanvas: canvas.toJSON(),
        })
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 items-center">
      {(
        <div>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <button
            onClick={undo}
            className="mx-2 px-3 py-1 bg-yellow-400 rounded"
          >
            Undo
          </button>
          <button
            onClick={redo}
            className="px-3 py-1 bg-green-400 rounded"
          >
            Redo
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-black bg-white"
      />
    </div>
  )
}
