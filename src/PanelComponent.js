import {SEP, MAPPER} from "./SpriteFont.js";

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
