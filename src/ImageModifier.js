"use strict"

import {triggerEvent} from "./Utils.js";

const LOG = false;

export class ImageModifier
{
  constructor()
  {
    throw "Can't construct instance of ImageModifier";
  }
  static init( album )
  {
    this.album = album;
  }

  // map:
  //   find              replace with
  // { [r, g, b]string : [r, g, b] }

  static recolor_nosave(img, map)
  {
    let [can, ctx, imageData] = this.setup(img);

    // examine every pixel,
    // change any old rgb to the new-rgb

    for (let i = 0; i < imageData.data.length; i += 4)
    {
      // is this pixel the old rgb?
      let pixel = imageData.data.slice(i, i+3);
      if (map[pixel] != undefined)
      {
	imageData.data[i  ] = map[pixel][0];
	imageData.data[i+1] = map[pixel][1];
	imageData.data[i+2] = map[pixel][2];
      }
    }
    ctx.putImageData(imageData,0,0);
    return can
  }
  // Recolors a given imaging using a given map, then stores it under name.
  //   Errors if the name is already in use and overwriting is not specified.
  static recolor(img, map)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img);

      // examine every pixel,
      // change any old rgb to the new-rgb

      for (let i = 0; i < imageData.data.length; i += 4)
      {
	// is this pixel the old rgb?
	let pixel = imageData.data.slice(i, i+3);
	if (map[pixel] != undefined)
	{
	  imageData.data[i  ] = map[pixel][0];
	  imageData.data[i+1] = map[pixel][1];
	  imageData.data[i+2] = map[pixel][2];
	}
      }
      
      let nImg = this.finalize(can, ctx, imageData);
      nImg.onload = ()=>{resolve(nImg)};
    });
  }
  
  static flipVertical(img)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img);
      let swap = imageData.data.slice(0, imageData.data.length/2);
      for (let i = 0; i < imageData.height/2; ++i)
      {
	for (let j = 0; j < 4*imageData.width; ++j)
	{
	  imageData.data[4*i*imageData.width + j] = imageData.data[4*(imageData.height - 1 - i)*imageData.width + j];
	  imageData.data[4*(imageData.height - 1 - i)*imageData.width + j] = swap[4*i*imageData.width + j];
	}
      }
      
      let nImg = this.finalize(can, ctx, imageData);
      nImg.onload = ()=>{resolve(nImg)};
    });
  }
 
  static flipHorizontal(img, g)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img);
      for (let i = 0; i < imageData.height; ++i)
      {
	for (let j = 0; j < imageData.width/2; ++j)
	{
	  let cur = 4*(i*imageData.width + j);
	  let swap = 4*((i+1)*imageData.width - 1 - j);
	  let curData = imageData.data.slice(cur, cur+4);
	  let swapData = imageData.data.slice(swap, swap+4);

	  imageData.data.set(swapData, cur);
	  imageData.data.set(curData, swap);

	}
      }
      
      let times = can.width/can.height;
      for (let i = 0; i < times; ++i)
      {
	// some jank stuff, i'm not sure how putImageData does things but it's not the obvious way
	ctx.putImageData(imageData,
		  (2*i - times + 1)*can.height,
		  0, (times - i - 1)*can.height, 0, can.height, can.height);
      }
      let nImg = new Image();
      nImg.src = can.toDataURL('image/png');
      nImg.onload = ()=>{resolve(nImg)};

    });
  }
  
  static rotateLeft(img)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img);

      let w = imageData.width;
      let h = imageData.height;
      let modBase = [];
      for (let j = w - 1; j >= 0; --j)
      {
	for (let i = 0; i < h; ++i)
	{
	  let cur = 4*(i*w + j);
	  let curData = imageData.data.slice(cur, cur + 4);
	  modBase.push(...curData);

	}
      }
      imageData.data.set(modBase, 0);
      imageData = new ImageData( imageData.data , imageData.height, imageData.width);
      
      let times = can.width/can.height;
      for (let i = 0; i < times; ++i)
      { ctx.putImageData(imageData,i*can.height, (i+1)*can.height - can.width);}
      let nImg = new Image();
      nImg.src = can.toDataURL('image/png');

      nImg.onload = ()=>{resolve(nImg)};

    });
  }
  static rotateRight(img)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img);

      let w = imageData.width;
      let h = imageData.height;
      let modBase = [];
      for (let j = 0; j < w; ++j)
      {
	for (let i = h-1; i >= 0; --i)
	{
	  let cur = 4*(i*w + j);
	  let curData = imageData.data.slice(cur, cur + 4);
	  modBase.push(...curData);

	}
      }
      imageData.data.set(modBase, 0);
      imageData = new ImageData( imageData.data , imageData.height, imageData.width);
      


      let times = can.width/can.height;
      for (let i = 0; i < times; ++i)
      {	ctx.putImageData(imageData,i*can.height, -i*can.height);}
      let nImg = new Image();
      nImg.src = can.toDataURL('image/png');
      
      nImg.onload = ()=>{resolve(nImg)};

    });
  }



  static rotate180(img)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img);
      let swap = imageData.data.slice(0, imageData.data.length/2);
      for (let i = 0; i < imageData.data.length/2; i += 4)
      {
	let swap = imageData.data.length - 4 - i;
	let curData = imageData.data.slice(i, i+4);
	let swapData = imageData.data.slice(swap, swap+4);

	imageData.data.set(swapData, i);
	imageData.data.set(curData, swap);
      }
      
      let nImg = this.finalize(can, ctx, imageData);
      nImg.onload = ()=>{resolve(nImg)};
    })
  }
  static finalize(can, ctx, imageData, onload)
  {
    ctx.putImageData(imageData,0,0);
    
    let nImg = new Image();
    nImg.src = can.toDataURL('image/png');
    return nImg;
  }


  static setup(img)
  {
    if (img.complete == false)
    {
      throw "Image not loaded @ ImageModifier.js";
    }

    let can = document.createElement("canvas");
    let ctx = can.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    let w = img.width;
    let h = img.height;

    can.width = w;
    can.height = h;

    ctx.drawImage(img, 0, 0, w, h);

    return [can, ctx, ctx.getImageData(0, 0, w, h)];
  }
  static async execute(script)
  {
    script = script.split("\n");
    for (let line of script)
    {
      //console.log(line)
      let tokens = line.replace(/\s+/g, " ").trim().split(" ");

      if (this.album.get(tokens[2]) != undefined)
      {
	if (LOG)
	  console.log("imgmod: '" + tokens[2] + "' found, skipping")
	continue;
      }
      let nImg;
      if (tokens.length == 1 &&  tokens[0].length == 0)
      {
	continue;
      }
      else if (tokens.length == 3)
      {
	switch(tokens[0].toUpperCase())
	{
	  case "FV":
	    nImg = await this.flipVertical(this.album.get(tokens[1]));
	    break;
	  case "FH":
	    nImg = await this.flipHorizontal(this.album.get(tokens[1]));
	    break;
	  case "RL":
	    nImg = await this.rotateLeft(this.album.get(tokens[1]));
	    break;
	  case "RR":
	    nImg = await this.rotateRight(this.album.get(tokens[1]));
	    break;
	  default:
	    throw new Error("ImageModifier_UnknownCommandError");
	}
      }
      else
      {
	if (tokens[0].toUpperCase() == "RC")
	{
	  // RC src dst [r,g,b]->[r,g,b] [r,g,b]->[r,g,b] ...
	  let map = {};
	  let i = 3;
	  while (i < tokens.length)
	  {
	    let [a,b] = tokens[i].split("->");
	    map[JSON.parse(a)] = JSON.parse(b);
	    ++i;
	  }
	  nImg = await this.recolor(this.album.get(tokens[1]), map);
	}
	else
	{
	  throw new Error("ImageModifier_BadCommand");
	}
      }
      this.album.images[tokens[2]] = nImg;
      triggerEvent("load_progress", `Generated image ${tokens[2]}.png`);
    }
  }
}
