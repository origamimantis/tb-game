import {waitTime} from "./Utils.js";
import {WIDTH, HEIGHT} from "./Constants.js";
import {Album} from "./Images.js";

export class TiledEffect
{
  constructor(dx, dy)
  {
    this.x = 0;
    this.y = 0;
    this.dx = dx;
    this.dy = dy;
  }

  // CALL THIS FIRST, CAN'T HAVE ASYNC CONSTRUCTOR
  async load(image)
  {
    let img = Album.get(image);
    this.t_w = img.width;
    this.t_h = img.height;

    let num_cols = Math.ceil(WIDTH/this.t_w) + 1;
    let num_rows = Math.ceil(HEIGHT/this.t_h) + 1;

    this.w = num_cols*this.t_w;
    this.h = num_rows*this.t_h;
    
    let can = document.createElement("canvas");
    can.width = this.w;
    can.height = this.h;
    let ctx = can.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    
    for (let i = 0; i < num_cols; ++i)
    {
      for (let j = 0; j < num_rows; ++j)
      {
	ctx.drawImage(img, this.t_w*i, this.t_h*j);
      }
    }

    return new Promise( (resolve)=>
    {
      this.image = new Image();
      this.image.onload = resolve;
      this.image.src = can.toDataURL('image/png');
    });


  }
  setDirection(dx, dy)
  {
    this.dx = dx;
    this.dy = dy;
  }
  update()
  {
    this.x += this.dx;
    this.y += this.dy;
    if (this.x > 0)
      this.x -= this.t_w;
    else if (this.x + this.w < WIDTH)
      this.x += this.t_w;

    if (this.y > 0)
      this.y -= this.t_h;
    else if (this.y + this.h < HEIGHT)
      this.y += this.t_h;
  }
  draw(g, ctx)
  {
    g.ctx[ctx].drawImage(this.image, this.x, this.y);
  }

}
