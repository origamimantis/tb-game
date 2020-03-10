"use strict";

import {waitTick} from "./Utils.js";

export function SwordKnight(atkr, defr, max, min)
{
  return new Promise( async (resolve) =>
    { 
      let direction = distBetween(atkr, defr);
      if (Math.abs(direction) > max)
      {
	atkr.setAnimation("run")

	while ( Math.abs(direction) > min)
	{
	  atkr.x += 2*Math.sign(direction);
	  direction = distBetween(atkr, defr);
	  await waitTick();
	}
      }
      resolve();
    }
  );
}


function distBetween(atkr, defr)
{
  // TODO may have to change defr.curAnim().w to atkr.curAnim.w
  return 512 - atkr.x - defr.x - defr.curAnim().w;
}
