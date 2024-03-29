import {Album} from "./Images.js";
import {C_WIDTH, C_HEIGHT} from "./Constants.js";

export class LoadScreen
{
  constructor(m)
  {
    this.m = m;
    this.loaded = 0;
    this.total = 0;
    this.x = 0;
    // for consistency
    this.inputting = false;
    this.cursor = undefined;
  }
  reset(total)
  {
    this.loaded = 0;
    this.total = total;
  }
  update()
  {
  }
  eventUpdate(text)
  {
    ++ this.loaded;
    Album.clearAllCtx();
    this.m.ctx[2].globalAlpha = 1;
    this.m.ctx[2].fillStyle = "#bb0000";
    this.m.ctx[2].fillRect(156, 170, 200, 20)
    this.m.ctx[2].fillStyle = "#00bb00";
    this.m.ctx[2].fillRect(156, 170, (200*this.loaded)/this.total, 20)
    Album.setTextProperty(2, "#000000", "11px ABCD Mono",  "center");
    Album.drawText(2, text, 256, 250);
  }
  draw()
  {
  }
}
