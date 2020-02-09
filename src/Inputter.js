'use strict';

const SELECT = "Period";
const CANCEL = "Comma";


import {getTile, inRange} from "./UsefulFunctions.js";
import {LoopSelector} from "./LoopSelector.js";

class Inputter
{
  constructor(g)
  {
    this.g = g;
    this.inputted = false;
    this.bufx = 0;
    this.bufy = 0;

    document.addEventListener
    (
      "keydown" , (e) =>
      {
	if (e.code == "ArrowUp" || e.code == "KeyW")
	{
	  this.cursorMove( 0,-1);
	}
	if (e.code == "ArrowDown" || e.code == "KeyS")
	{
	  this.cursorMove( 0, 1);
	}
	if (e.code == "ArrowLeft" || e.code == "KeyA")
	{
	  this.cursorMove(-1, 0);
	}
	if (e.code == "ArrowRight" || e.code == "KeyD")
	{
	  this.cursorMove( 1, 0);
	}
      }
    );
  }

  cursorMove(dx, dy)
  {
    this.g.cursor.move(dx, dy);
  }
}


export {Inputter};
