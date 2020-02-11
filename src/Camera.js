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
    this.off = {x: g.cursor.x,
		y: g.cursor.y};
    this.wsize = {x: wx, y: wy};
    this.max = {x: mx - wx, y: my - wy};
    this.topleft = {x: 0, y: 0};
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


//  Follow cursor by adding/removing event listeners
/*
class Camera
{
  constructor( g, wx, wy, mx, my )
  {
    this.g = g;
    this.off = {x: g.cursor.x,
		y: g.cursor.y};
    this.wsize = {x: wx, y: wy};
    this.max = {x: mx - wx, y: my - wy};
    this.topleft = {x: 0, y: 0};
    this.offset = {x: 0, y: 0};

    this.toMove = {x: false, y: false};

    this.followCursor = null;
    this.updateCoord = null;

    document.addEventListener("game_cursorMoveStart", (e) => {this.initCameraMove(e.detail);});

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
      if (this.followCursor == null)
      {
	this.followCursor = this._followCursor.bind(this);
	this.updateCoord = this._updateCoord.bind(this);
	document.addEventListener("game_cursorMovement", this.followCursor);
	document.addEventListener("game_cursorChange", this.updateCoord);
      }
    }
    else
    {
      if (this.followCursor != null)
      {
	document.removeEventListener("game_cursorMovement", this.followCursor);
	document.removeEventListener("game_cursorChange", this.updateCoord);
	this.followCursor = null;
	this.updateCoord = null;
      }
      //document.removeEventListener("game_cursorMovement", initMove);
      //forgetEvent("game_cursorChange", (e) => {this.updateCoord();});
    }
  }

  _updateCoord()
  {
    this.offset.x = this.topleft.x = Math.round(this.offset.x);
    this.offset.y = this.topleft.y = Math.round(this.offset.y);
    console.log(this.offset);
  }

  adjustedPos(a)
  {
    return {x: a.x - this.topleft.x,
	    y: a.y - this.topleft.y};
  }
    
  _followCursor(vis)
  {
    if (this.toMove.x == true)
    {
    this.offset.x = Math.max(Math.min( this.offset.x + vis.detail.x, this.max.x), 0);
    }
    if (this.toMove.y == true)
    {
    this.offset.y = Math.max(Math.min( this.offset.y + vis.detail.y, this.max.y), 0);
    }

  }

}
*/


export {Camera};
