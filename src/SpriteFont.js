'use strict';

//[y,x]
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


export class SpriteFont
{
    constructor()
    {
      this.fonts = {};
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

    drawText(ctx, str, x, y, scale = 1, width = 100, height= 4)
    {
	if (typeof str == "number")
	{
	    str = str.toString();
	}

	//ctx.fillRect(0,0,c.width, c.height);
	// x,y are string positions
	let splits = str.split(' ');
	let lines = [];
	let cur = "";
	let tmp;
	for (let word of splits)
	{
	    let dos = word.split('\n');
	    tmp = " " + dos[0];
	    if ( (cur +tmp).length <= width )
	    {
		cur += tmp;
	    }
	    else
	    {
		lines.push(cur.slice(1,cur.length));
		cur = tmp;
	    }
	    if (dos.length > 1)
	    {
		lines.push(cur.slice(1,cur.length));
		dos.shift();
		for (let d = 0; d < dos.length - 1; d++)
		{
		    lines.push(dos[d]);
		}
		cur = " " + dos[dos.length - 1];
	    }
	}
	lines.push(cur.slice(1,cur.length));
	for (let t = 0; t < lines.length; t++)
	{
	    for (let i = 0; i < lines[t].length; i++)
	    {
		if (lines[t][i] == " ") {continue;}
		let k = MAPPER[lines[t][i]];
		if (k)
		{
		    let offx = this.fsize*k[1];
		    let offy = this.fsize*k[0];
		    this.g.ctx[ctx].drawImage(this.img,
			offx, offy, this.fsize, this.fsize,
			x + this.fsize*i*scale, y+(this.fsize+8)*t*scale,
			this.fsize*scale, this.fsize*scale);
		}
	    }
	}

    }

}






/* font sheet is 8 x whatever
 * ABCDEFGH
 * IJKLMNOP
 * QRSTUVWX
 * YZ...
 */
