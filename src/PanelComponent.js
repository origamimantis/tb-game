import {SEP, MAPPER} from "./SpriteFont.js";
import {Album} from "./Images.js";

export const PanelType = {TEXT : 0, ART : 1, HEALTHBAR : 2, SLIDEBAR : 3};

const noOff = {x:0, y:0};

export class PanelComponent
{
  constructor(type, arg, drawdata={})
  {
    this.type = type;
    this.drawdata = drawdata;

    switch (type)
    {
    case PanelType.TEXT:
      this.draw = this.drawText;
      break;

    case PanelType.ART:
      this.draw = this.drawArt;
      break;

    case PanelType.HEALTHBAR:
      this.draw = this.drawHB;
      break;

    case PanelType.SLIDEBAR:
      this.draw = this.drawSB;
      break;

    default:
      throw "a ball";
    }
    this.data = arg;
  }
  setData(arg)
  {
    switch (this.type)
    {
    case PanelType.TEXT:
      if (typeof arg == "number")
      {
	arg = arg.toString();
      }
    case PanelType.ART:
    case PanelType.HEALTHBAR:
      this.data = arg;
      break;

    default:
      throw "a ball";
    }
  }
  setDataType(type, arg)
  {
    switch (type)
    {
    case PanelType.TEXT:
      this.draw = this.drawText;
      if (typeof arg == "number")
      {
	arg = arg.toString();
      }
      break;

    case PanelType.ART:
      this.draw = this.drawArt;
      break;

    case PanelType.HEALTHBAR:
      this.draw = this.drawHB;
      break;

    default:
      throw "a ball";
    }
    this.data = arg;
  }

  notes()
  {
      if (typeof str == "number")
      {
	  str = str.toString();
      }
  }
  drawArt(g, off, xy, scrollOff = noOff)
  {
    Album.draw(4, this.data, off.x + xy.x + scrollOff.x, off.y + xy.y + scrollOff.y, xy.w, xy.h);
  }

  drawText(g, off, xy, scrollOff = noOff)
  {
    g.setTextProperty(4, xy.s, xy.w, xy.h);
    g.drawText(4, this.data, off.x+xy.x + scrollOff.x, off.y+xy.y + 4 + scrollOff.y);
  }
  drawHB(g, off, xy, scrollOff = noOff)
  {
    if (xy.w == null)
      xy.w = 184;
    if (xy.h == null)
      xy.h = 10;

    Album.drawHealthBar(4, this.data, off.x + xy.x + scrollOff.x, off.y + xy.y + scrollOff.y, xy.w, xy.h, this.drawdata.color);
  }

  drawSB(g, off, xy, scrollOff = noOff)
  {
    if (xy.w == null)
      xy.w = 184;
    if (xy.h == null)
      xy.h = 10;

    this.drawHB(g, off, xy, scrollOff);
    g.ctx[4].fillStyle = this.drawdata.indcolor
    g.ctx[4].fillRect(off.x+xy.x+scrollOff.x + this.data*(xy.w-this.drawdata.indwidth),
                      off.y+xy.y + scrollOff.y,
                      this.drawdata.indwidth, xy.h);

  }

}
