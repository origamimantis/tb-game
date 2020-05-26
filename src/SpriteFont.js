'use strict';

//[y,x]
export const SEP = 8;
export const MAPPER = 
    {
	"A":[0,0],   "a":[4,5],
	"B":[0,1],   "b":[4,6],
	"C":[0,2],   "c":[4,7],
	"D":[0,3],   "d":[5,0],
	"E":[0,4],   "e":[5,1],
	"F":[0,5],   "f":[5,2],
	"G":[0,6],   "g":[5,3],
	"H":[0,7],   "h":[5,4],
	"I":[1,0],   "i":[5,5],
	"J":[1,1],   "j":[5,6],
	"K":[1,2],   "k":[5,7],
	"L":[1,3],   "l":[6,0],
	"M":[1,4],   "m":[6,1],
	"N":[1,5],   "n":[6,2],
	"O":[1,6],   "o":[6,3],
	"P":[1,7],   "p":[6,4],
	"Q":[2,0],   "q":[6,5],
	"R":[2,1],   "r":[6,6],
	"S":[2,2],   "s":[6,7],
	"T":[2,3],   "t":[7,0],
	"U":[2,4],   "u":[7,1],
	"V":[2,5],   "v":[7,2],
	"W":[2,6],   "w":[7,3],
	"X":[2,7],   "x":[7,4],
	"Y":[3,0],   "y":[7,5],
	"Z":[3,1],   "z":[7,6],
	"1":[3,2],   "-":[7,7],
	"2":[3,3],   ".":[8,0],
	"3":[3,4],   "!":[8,1],
	"4":[3,5],   "?":[8,2],
	"5":[3,6],
	"6":[3,7],
	"7":[4,0],
	"8":[4,1],
	"9":[4,2],
	"0":[4,3],
	"/":[4,4],


	"end":[]
    };


export class SpriteFont
{
  constructor()
  {
    this.fonts = {};
    this.subCanvas = document.createElement("canvas");
    this.subCtx = this.subCanvas.getContext("2d");

    this.subCanvas.style.background = "transparent";
  }

  resizeCanvas(w, h)
  {
    this.subCanvas.width = w;
    this.subCanvas.height = h;

    this.subCtx.imageSmoothingEnabled = false;
    this.subCtx.clearRect(0,0,this.subCanvas.width, this.subCanvas.height);
  }
  loadFont(file)
  {
    return new Promise((resolve) =>
      {
        this.fonts[file] = new Image();
        this.fonts[file].onload = resolve;

        this.fonts[file].src = 'assets/sprite/' + file + '.png';
      })
  }
  get( font )
  {
    return this.fonts[font];
  }
  //justify: 0=left, 1=right 2=center
  drawText(g, ctx, string, offx, offy, scale = 1, justify = 0, wh = {x:10000, y:10000})
  {
    let fsize = 8;
    let width = Math.floor(wh.x/fsize/scale);
    let height = Math.floor(wh.y/(fsize+SEP)/scale);

    let data = string.split(" ");

    let x = 0;
    let y = 0;

    this.resizeCanvas(wh.x*scale, fsize*scale);


    for (let u = 0; u < data.length; ++u)
    {
      for (let t = 0; t < data[u].length; ++t)
      {
	if (data[u][t] == "\n")
	{
	  this._attachToMainCanvas(g, ctx, offx, offy, x, y, fsize, scale, justify)
	  
	  x = 0;
	  ++y;
	  if (y > height)
	  {
	    return;
	  }
	  continue;
	}
	else
	{
	  let k = MAPPER[data[u][t]];
	  if (k && x < width)
	  {
	    this.subCtx.drawImage(this.get("F_0"),
		fsize*k[1], fsize*k[0], fsize, fsize,
		fsize*scale*x, 0,
		scale*fsize, scale*fsize);
	  }
	  ++x;
	}
      }
      ++x;
      if (u + 1 < data.length && x+data[u+1].length > width)
      {
	this._attachToMainCanvas(g, ctx, offx, offy, x, y, fsize, scale, justify)

	x = 0;
	++y;
	if (y > height)
	{
	  return;
	}
      }
    }
    this._attachToMainCanvas(g, ctx, offx, offy, x, y, fsize, scale, justify)
  }

  // lx, ly are for additional offsets after applying the main offset
  _attachToMainCanvas(g, ctx, offx, offy, lx, ly, fsize, scale, justify)
  {
      if (justify == 0)
      {
	g.ctx[ctx].drawImage(this.subCanvas, offx, offy + (fsize+SEP)*scale*ly);
      }
      else if (justify == 1)
      {
	g.ctx[ctx].drawImage(this.subCanvas, offx - fsize*scale*(lx-1), offy + (fsize+SEP)*scale*ly);
      }
      else if (justify == 2)
      {
	g.ctx[ctx].drawImage(this.subCanvas, offx - fsize*scale*(lx-1)/2, offy + (fsize+SEP)*scale*ly);
      }
  }
}






/* font sheet is 8 x whatever
 * ABCDEFGH
 * IJKLMNOP
 * QRSTUVWX
 * YZ...
 */
