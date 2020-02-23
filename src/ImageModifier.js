
export class ImageModifier
{
  constructor()
  {
    throw "Can't construct instance of ImageModifier";
  }
  static init( g )
  {
    this.g = g;
  }

  // map:
  //   find              replace with
  // { [r, g, b]string : [r, g, b] }

  // Recolors a given imaging using a given map, then stores it under name.
  //   Errors if the name is already in use and overwriting is not specified.
  static recolor(img, map, name, overwrite = false)
  {
    if (img.complete == false)
    {
      throw "Image not loaded";
    }
    if (this.g.Album.get(name) != undefined && overwrite == false)
    {
      throw "Name in use!";
    }

    let c = document.createElement("canvas");
    let ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    //let w = bw;
    let w = img.width;
    let h = img.height;

    c.width = w;
    c.height = h;

    ctx.drawImage(img, 0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    let imageData = ctx.getImageData(0, 0, w, h);

    // examine every pixel,
    // change any old rgb to the new-rgb

    for (var i=0;i<imageData.data.length;i+=4)
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
    // put the altered data back on the canvas
    ctx.putImageData(imageData,0,0);

    // put the re-colored image back on the image
    let nImg = new Image(w, h);;
    nImg.src = c.toDataURL('image/png');
    this.g.Album.images[name] = nImg;
  }




}
