
const SEP = 8;
const MAPPER =
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



export const PanelType = {TEXT : 0, ART : 1};


export class PanelComponent
{
  constructor(type, arg)
  {
    switch (type)
    {
    case PanelType.TEXT:
      this.draw = this.drawText;
      if (typeof arg == "number")
      {
	arg = arg.toString();
      }
      this.data = arg.split(" ");
      break;

    case PanelType.ART:
      this.draw = this.drawArt;
      this.data = arg;
      break;

    default:
      throw "a ball";
    }
  }
  setData(type, arg)
  {
    switch (type)
    {
    case PanelType.TEXT:
      this.draw = this.drawText;
      if (typeof arg == "number")
      {
	arg = arg.toString();
      }
      this.data = arg.split(" ");
      break;

    case PanelType.ART:
      this.draw = this.drawArt;
      this.data = arg;
      break;

    default:
      throw "a ball";
    }
  }

  notes()
  {
      if (typeof str == "number")
      {
	  str = str.toString();
      }
  }
  drawArt(g, off, xy)
  {
    g.Album.draw(g, 3, this.data, off.x + xy.x, off.y + xy.y, xy.sx, xy.sy);
  }

  drawText(g, off, xy)
  {
    let fsize = 8;
    let width = Math.floor(xy.sx/fsize);
    let height = Math.floor(xy.sy/(fsize+SEP));

    let x = 0;
    let y = 0;

    for (let u = 0; u < this.data.length; ++u)
    {
      for (let t = 0; t < this.data[u].length; ++t)
      {
	if (this.data[u][t] == "\n")
	{
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
	  let k = MAPPER[this.data[u][t]];
	  if (k && x < width)
	  {
	    g.ctx[3].drawImage(g.Fonts.get("F_0"),
		fsize*k[1], fsize*k[0], fsize, fsize,
		off.x + xy.x + fsize*x, off.y + xy.y+(fsize+SEP)*y + SEP/2,
		fsize, fsize);
	  }
	  ++x;
	}
      }
      ++x;
      if (u + 1 < this.data.length && x+this.data[u+1].length > width)
      {
	x = 0;
	++y;
	if (y > height)
	{
	  return;
	}
      }
    }
  }
}
