import {SEP, MAPPER} from "./SpriteFont.js";

export const PanelType = {TEXT : 0, ART : 1, HEALTHBAR : 2};


export class PanelComponent
{
  constructor(type, arg)
  {
    this.type = type;
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
  drawArt(g, off, xy)
  {
    g.Album.draw(4, this.data, off.x + xy.x, off.y + xy.y, xy.w, xy.h);
  }

  drawText(g, off, xy)
  {
    g.setTextProperty(4, xy.s, xy.w, xy.h);
    g.drawText(4, this.data, off.x+xy.x, off.y+xy.y + 4);
  }
  drawHB(g, off, xy)
  {
    if (xy.w == null)
      xy.w = 184;
    if (xy.h == null)
      xy.h = 10;

    g.Album.drawHealthBar(4, this.data, off.x + xy.x, off.y + xy.y, xy.w, xy.h);
  }

}
