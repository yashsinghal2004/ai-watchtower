"use client"

import { ModeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { VolumeFeature } from "@/components/volumefeature"
import { Camera, Divide, FlipHorizontal, MoonIcon, PersonStanding, SunIcon, Video } from "lucide-react"
import { RefObject, useEffect, useRef, useState } from "react"
import { Rings } from "react-loader-spinner"
import Webcam from "react-webcam"
import { toast } from "sonner"
import * as cocossd from "@tensorflow-models/coco-ssd"
import "@tensorflow/tfjs-backend-cpu"
import "@tensorflow/tfjs-backend-webgl"
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd"
import { drawOncanvas } from "@/utils/draw"
import { beep } from "@/utils/audio"


type Props = {}

let interval:any=null;
let stopTimeout:any=null;
const HomePage  = (props: Props) => {
  const webcamRef=useRef<Webcam>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);

  const [mirrored, setmirrored] = useState<boolean>(true);
  const [isRecording, setisRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setautoRecordEnabled] = useState<boolean>(false);
  const [model, setmodel] = useState<ObjectDetection>();
  const [loading, setloading] = useState(false);
  const [volume, setvolume] = useState(0.8);

  const mediaRecorderRef=useRef<MediaRecorder | null>(null);

  const userPromptScreenshot=()=>{
    //take picture
    if(!webcamRef.current){
      toast("Camera not found. Please refresh.")
    }
    else{
      const imageSrc=webcamRef.current.getScreenshot();
      const blob=base64toBlob(imageSrc);

      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=`${formatDate(new Date())}.png`;
      a.click();
    }

    //and save it to downloads
  }

  const userPromptRecord=()=>{

    if(!webcamRef.current){
      toast("Camera is not found. Please refresh.")
    }

    if(mediaRecorderRef.current?.state=="recording"){
      //check if recording
      //then stop recording
      //and save to downloads
      mediaRecorderRef.current.requestData();
      clearTimeout(stopTimeout);
      mediaRecorderRef.current.stop();
      toast("Recording saved to downloads");
    }
    else{
      //if not recording
      //then start recording
      startRecording(false);
    }

  }

  const startRecording=(doBeep:boolean)=>{
    if(webcamRef.current && mediaRecorderRef.current?.state!=="recording"){
      mediaRecorderRef.current?.start();
      doBeep && beep(volume);

      stopTimeout=setTimeout(() => {
        if(mediaRecorderRef.current?.state=="recording"){
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        }
      }, 30000);
    }
  }

  const toggleAutoRecord=()=>{
    if(autoRecordEnabled){
      setautoRecordEnabled(false);
      //show toast to user to notify change
      toast("Autorecord disabled");
    }
      else{
        setautoRecordEnabled(true);
        //show toast 
        toast("Autorecord enabled");
      }
  }
  function RenderFeatureHighlightsSection() {
    return <div className="text-xs text-muted-foreground">
      <ul className="space-y-4">
        <li>
          <strong>Dark Mode/Sys Theme 🌗</strong>
          <p>Toggle between dark mode and system theme.</p>
          <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
            <SunIcon size={14} />
          </Button>{" "}
          /{" "}
          <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
            <MoonIcon size={14} />
          </Button>
        </li>
        <li>
          <strong>Horizontal Flip ↔️</strong>
          <p>Adjust horizontal orientation.</p>
          <Button className='h-6 w-6 my-2'
            variant={'outline'} size={'icon'}
            onClick={() => {
              setmirrored((prev) => !prev)
            }}
          ><FlipHorizontal size={14} /></Button>
        </li>
        <Separator />
        <li>
          <strong>Take Pictures 📸</strong>
          <p>Capture snapshots at any moment from the video feed.</p>
          <Button
            className='h-6 w-6 my-2'
            variant={'outline'} size={'icon'}
            onClick={userPromptScreenshot}
          >
            <Camera size={14} />
          </Button>
        </li>
        <li>
          <strong>Manual Video Recording 📽️</strong>
          <p>Manually record video clips as needed.</p>
          <Button className='h-6 w-6 my-2'
            variant={isRecording ? 'destructive' : 'outline'} size={'icon'}
            onClick={userPromptRecord}
          >
            <Video size={14} />
          </Button>
        </li>
        <Separator />
        <li>
          <strong>Enable/Disable Auto Record 🚫</strong>
          <p>
            Option to enable/disable automatic video recording whenever
            required.
          </p>
          <Button className='h-6 w-6 my-2'
            variant={autoRecordEnabled ? 'destructive' : 'outline'}
            size={'icon'}
            onClick={toggleAutoRecord}
          >
            {autoRecordEnabled ? <Rings color='white' height={30} /> : <PersonStanding size={14} />}

          </Button>
        </li>

        <li>
          <strong>Volume Slider 🔊</strong>
          <p>Adjust the volume level of the notifications.</p>
        </li>
        <li>
          <strong>Camera Feed Highlighting 🎨</strong>
          <p>
            Highlights persons in{" "}
            <span style={{ color: "#FF0F0F" }}>red</span> and other objects in{" "}
            <span style={{ color: "#00B612" }}>green</span>.
          </p>
        </li>
        <Separator />
      </ul>
      </div>
  }

  useEffect(()=>{
    setloading(true);
    initModel();
  },[]);

  const initModel= async()=>{
    const loadedModel:ObjectDetection=await cocossd.load({
      base: "mobilenet_v2"
    });
    setmodel(loadedModel);
  };

  useEffect(()=>{
    if(model){
       setloading(false);
    }
  },[model]);

  const runprediction=async()=>{
    if(model && webcamRef.current 
      &&webcamRef.current.video && webcamRef.current.video.readyState===4){
        const predictions:DetectedObject[]=await model.detect(webcamRef.current.video);
        
        resizeCanvas(canvasRef,webcamRef);
        drawOncanvas(mirrored,predictions,canvasRef.current?.getContext("2d"))
      
        let isPerson:boolean=false;
        if(predictions.length>0){
          predictions.forEach((prediction)=>{
            isPerson=prediction.class==="person";
          })

          if(isPerson && autoRecordEnabled ){
            startRecording(true);
          }
        }
      }
  }

  useEffect(()=>{
    interval=setInterval(()=>{
      runprediction();
    },100);

    return ()=>clearInterval(interval);
  },[webcamRef.current,model,mirrored,autoRecordEnabled,runprediction]);

  
  //initialize the media recorder
  useEffect(()=>{
    if(webcamRef && webcamRef.current){
      const stream=(webcamRef.current.video as any).captureStream();
      if(stream){
        mediaRecorderRef.current=new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable=(e)=>{
          if(e.data.size>0){
            const recordedBlob=new Blob([e.data],{type:"video"});
            const videoURL=URL.createObjectURL(recordedBlob);

            const a =document.createElement("a");
            a.href=videoURL;
            a.download=`${formatDate(new Date())}.webm`;
            a.click();
          }
        };
        mediaRecorderRef.current.onstart=(e)=>{
          setisRecording(true);       
        }
        mediaRecorderRef.current.onstop=(e)=>{
          setisRecording(false);       
        }
      }
    }
  },[webcamRef]);

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
            <ModeToggle/>
            <Button 
            variant={"outline"}
            size={"icon"}
            onClick={()=>{
              setmirrored((prev)=>!prev)
            }}>
              <FlipHorizontal/>
            </Button>

            <Separator className="my-2"/>
          </div>

          {/* middle section */}
          <div className="flex flex-col gap-2">
          <Separator className="my-2"/>
            <Button
            variant={"outline"} size={"icon"}
            onClick={userPromptScreenshot}>
              <Camera/>
            </Button>

            <Button
            variant={isRecording?"destructive":"outline"} size={"icon"}
            onClick={userPromptRecord}>
              <Video/>
            </Button>
            <Separator className="my-2"/>

            <Button
            variant={autoRecordEnabled?"destructive":"outline"}
            size={"icon"}
            onClick={toggleAutoRecord}>
              {autoRecordEnabled? <Rings color="white" height={45} /> :<PersonStanding/>}
            </Button>
          </div>

          {/* bottom section */}
          <div className="flex flex-col gap-2">
          <Separator className="my-2"/>

          <VolumeFeature/>
          </div>
        </div>

        <div className="h-full flex-1 py-4 px-2 overflow-y-scroll">
          <RenderFeatureHighlightsSection/>
        </div>
      </div>
      {loading && <div className="z-50 absolute w-full h-full flex items-center justify-center
      bg-primary-foreground">
        Getting things ready . . .<Rings height={50} color="red"/>
        </div>}
    </div>
  )
}

export default HomePage;

const resizeCanvas=(canvasRef: RefObject<HTMLCanvasElement>, webcamRef: RefObject<Webcam>)=> {
  const canvas=canvasRef.current;
  const video=webcamRef.current?.video;

  if(canvas && video){
    const {videoWidth,videoHeight}=video;
    canvas.width=videoWidth;
    canvas.height=videoHeight;
  }
}

const formatDate=(d:Date)=>{
  const formattedDate =
    [
      (d.getMonth() + 1).toString().padStart(2, "0"),
      d.getDate().toString().padStart(2, "0"),
      d.getFullYear(),
    ]
      .join("-") +
    " " +
    [
      d.getHours().toString().padStart(2, "0"),
      d.getMinutes().toString().padStart(2, "0"),
      d.getSeconds().toString().padStart(2, "0"),
    ].join("-");
  return formattedDate;
}

function base64toBlob(base64Data: any) {
  const byteCharacters = atob(base64Data.split(",")[1]);
  const arrayBuffer = new ArrayBuffer(byteCharacters.length);
  const byteArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: "image/png" }); // Specify the image type here
}