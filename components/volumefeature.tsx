"use client"

import { Volume2 } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Slider } from "./ui/slider";
import { useState } from "react";
import { beep } from "@/utils/audio";

export const VolumeFeature = () => {
    const [volume, setvolume] = useState(0.8);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"outline"} size={"icon"}>
          <Volume2 />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Slider
         max={1}
         min={0}
         step={0.01}
         defaultValue={[volume]}
         onValueCommit={(val)=>{
            setvolume(val[0]);
            beep(val[0]);
         }}
          />
      </PopoverContent>
    </Popover>

  );
};
