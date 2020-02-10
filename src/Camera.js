'use strict';

const MOVE_BORDER = {x: 3,
		     y: 2}

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

    document.addEventListener("game_cursorMoveStart", (e) => {this.initCameraMove(e.detail.dest);}); 
    document.addEventListener("game_cursorMovement", (e) => {this.drawCursor(e.detail);});
    document.addEventListener("game_cursorChange", (e) => {this.moveEndSetCoord();});

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
/*
        let radx = Math.max(this.xMin, Math.min(this.xMax, g.cursor.drawx - Math.floor(this.sizeX/2)));
        if (this.xMin <= radx && radx <= this.xMax)
        {
            this.oldx = this.x;
            this.x = radx;
        }
        let rady = Math.max(this.xMin, Math.min(this.yMax, g.cursor.drawy - Math.floor(this.sizeY/2)));
	}
        if (this.yMin <= rady && rady <= this.yMax)
        {
            this.oldy = this.y;
            this.y = rady;

*/

export {Camera};
