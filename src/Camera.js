'use strict';

import {respondToEvent} from "./Utils.js";


const MOVE_BORDER = {x: 3,
		     y: 2}

//  Follow cursor by responding to listeners by doing something/nothing
class Camera
{
  constructor( g, wx, wy, mx, my )
  {
    this.g = g;
    
    this.wsize = {x: wx, y: wy};
    this.max = {x: mx - wx, y: my - wy};
    // topleft is camera's internal position relative to map
    this.topleft = {x: 0, y: 0};
    // offset is camera's visible position relative to map
    this.offset = {x: 0, y: 0};

    this.toMove = {x: false, y: false};

    this.drawCursor = doNothing;
    this.updateCoord = doNothing;

    respondToEvent("game_cursorMoveStart", (dest) => {this.initCameraMove(dest);}); 
    respondToEvent("game_cursorMovement", (e) => {this.drawCursor(e);});
    respondToEvent("game_cursorChange", (e) => {this.updateCoord();});

  }

  initCameraMove(dest)
  {
    let a = this.adjustedPos(dest);
    
    this.toMove.x= ( (a.x >= this.wsize.x - MOVE_BORDER.x && this.topleft.x < this.max.x)
		  || (a.x <= MOVE_BORDER.x		    && this.topleft.x > 0) )
    this.toMove.y= ( (a.y >= this.wsize.y - MOVE_BORDER.y && this.topleft.y < this.max.y)
		  || (a.y <= MOVE_BORDER.y		    && this.topleft.y > 0) )

    if (this.toMove.x || this.toMove.y)
    {
      this.drawCursor = this.followCursor;
      this.updateCoord = this.moveEndSetCoord;
    }
    else
    {
      this.drawCursor = doNothing;
      this.updateCoord = doNothing;
    }
  }

  moveEndSetCoord()
  {
    this.offset.x = this.topleft.x = Math.round(this.offset.x);
    this.offset.y = this.topleft.y = Math.round(this.offset.y);
  }

  adjustedPos(a)
  {
    return {x: a.x - this.topleft.x,
	    y: a.y - this.topleft.y};
  }
    
  followCursor(vis)
  {
    if (this.toMove.x == true)
    {
    this.offset.x = Math.max(Math.min( this.offset.x + vis.x, this.max.x), 0);
    }
    if (this.toMove.y == true)
    {
    this.offset.y = Math.max(Math.min( this.offset.y + vis.y, this.max.y), 0);
    }

  }

}

function doNothing()
{}


export {Camera};
