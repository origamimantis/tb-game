"use strict";

export class GridSelector extends LoopSelector
{

  //         [[ . . . ]
  //          [ . . . ]
  //          [ . . . ]]
  constructor(two_d_array, startx = 0, starty = 0)
  {
    this._l = two_d_array;
    this.x = start_x;
    this.y = start_y;
  }
  _dx(delt)
  {
    let l = this._l[this.y];
    if (l.length > 0)
      this.x = ( l.length + this.x + delt ) % l.length;
  }
  _dy(delt)
  {
    if (this._l.length > 0)
    {
      this.y = ( this._l.length + this.y + delt ) % this._l.length;
      this.x = Math.min(this._l[this.y].length - 1, this.x);
    }
  }
  prev()
  {
    this._dy(-1);
  }
  next()
  {
    this._dy(1);
  }
  left()
  {
    this._dx(-1);
  }
  right()
  {
    this._dx(1);
  }
