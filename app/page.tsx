"use client"

import { Separator } from "@/components/ui/separator"
import { useRef, useState } from "react"
import Webcam from "react-webcam"


type Props = {}

const HomePage  = (props: Props) => {
  const webcamRef=useRef<Webcam>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);

  const [mirrored, setmirrored] = useState<boolean>(false)

  return (<div className="flex h-screen">
    {/* left diviion-webcam and canvas */}
      <div className="relative">
        <div className="relative h-screen w-full">
          <Webcam 
          ref={webcamRef}
          mirrored={mirrored}
          className="h-full w-full object-contain p-2"
          />
          <canvas ref={canvasRef}
          className="absolute top-0 left-0 h-full w-full object-contain">

          </canvas>
        </div>

      </div>
      {/* right diviion-container for button panel and wiki section */}
      <div className="flex flex-row flex-1">
        <div className="border-primary/5 border-2 max-w-xs flex flex-col
        gap-2 justify-between shadow-md rounded-md p-4">
          {/* top section */}
          <div className="flex flex-col gap-2">
            <Separator/>
          </div>

        </div>
      </div>
    </div>
  )
}

export default HomePage;