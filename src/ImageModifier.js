
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

  // Recolors a given imaging using a given map, then stores it under name.
  //   Errors if the name is already in use and overwriting is not specified.
  static recolor(img, map, name, overwrite = false)
  {
    return new Promise( (resolve) => 
    {
    let [can, ctx, imageData] = this.setup(img, name, overwrite);

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
    
    this.album.images[name] = this.finalize(can, ctx, imageData, resolve);
    }
    );
  }
  
  static flipVertical(img, name, overwrite = false)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img, name, overwrite);
      let swap = imageData.data.slice(0, imageData.data.length/2);
      for (let i = 0; i < imageData.height/2; ++i)
      {
	for (let j = 0; j < 4*imageData.width; ++j)
	{
	  imageData.data[4*i*imageData.width + j] = imageData.data[4*(imageData.height - 1 - i)*imageData.width + j];
	  imageData.data[4*(imageData.height - 1 - i)*imageData.width + j] = swap[4*i*imageData.width + j];
	}
      }
      
      this.album.images[name] = this.finalize(can, ctx, imageData, resolve);
    });
  }
 
  static flipHorizontal(img, name, g, overwrite = false)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img, name, overwrite);
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
      this.album.images[name] = nImg;
      nImg.onload = resolve;

    });
  }
  
  static rotateLeft(img, name, overwrite = false)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img, name, overwrite);

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
      this.album.images[name] = nImg;
      nImg.onload = resolve;


    });
  }
  static rotateRight(img, name, overwrite = false)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img, name, overwrite);

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
      this.album.images[name] = nImg;
      nImg.onload = resolve;

    });
  }



  static rotate180(img, name, overwrite = false)
  {
    return new Promise( (resolve) => 
    {
      let [can, ctx, imageData] = this.setup(img, name, overwrite);
      let swap = imageData.data.slice(0, imageData.data.length/2);
      for (let i = 0; i < imageData.data.length/2; i += 4)
      {
	let swap = imageData.data.length - 4 - i;
	let curData = imageData.data.slice(i, i+4);
	let swapData = imageData.data.slice(swap, swap+4);

	imageData.data.set(swapData, i);
	imageData.data.set(curData, swap);
      }
      
      this.album.images[name] = this.finalize(can, ctx, imageData, resolve);
    })
  }
  static finalize(can, ctx, imageData, onload)
  {
    ctx.putImageData(imageData,0,0);
    
    let nImg = new Image();
    nImg.src = can.toDataURL('image/png');
    nImg.onload = onload;
    return nImg;
  }


  static setup(img, name, overwrite)
  {
    if (img.complete == false)
    {
      throw "Image not loaded";
    }
    if (this.album.get(name) != undefined && overwrite == false)
    {
      throw "Name '" + name + "' in use!";
    }

    let can = document.createElement("canvas");
    let ctx = can.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    let w = img.width;
    let h = img.height;

    can.width = w;
    can.height = h;

    ctx.drawImage(img, 0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    return [can, ctx, ctx.getImageData(0, 0, w, h)];
  }
  static async execute(script)
  {
    script = script.split("\n");
    for (let line of script)
    {
      let tokens = line.replace(/\s+/g, " ").trim().split(" ");
      if (tokens.length == 0)
      {
	continue;
      }
      else if (tokens.length != 3)
      {
	//throw "require 3 tokens";
      }
      else
      {
	switch(tokens[0].toUpperCase())
	{
	  case "FV":
	    await this.flipVertical(this.album.get(tokens[1]), tokens[2]);
	    break;
	  case "FH":
	    await this.flipHorizontal(this.album.get(tokens[1]), tokens[2]);
	    break;
	  case "RL":
	    await this.rotateLeft(this.album.get(tokens[1]), tokens[2]);
	    break;
	  case "RR":
	    await this.rotateRight(this.album.get(tokens[1]), tokens[2]);
	    break;
	  default:
	    //throw "unknown command";
	}
      }
    }







  }



}
