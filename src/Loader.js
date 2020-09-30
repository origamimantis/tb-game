'use strict';

import {requestFile} from "./Utils.js";
import {TileMap} from "./TileMap.js";
import {Album, ImageLoader} from "./Images.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {ImageModifier} from "./ImageModifier.js";
import {BattleAnimationAlbum} from "./BattleAnimationAlbum.js";
import {Characters} from "./Characters.js";

function bindInteractions(script)
{
  for (let [coord, ia] of Object.entries(script.interactions))
  {
    let c = coord.split(",");
    ia.position = {x: parseInt(c[0]), y: parseInt(c[1])};
    for (let key of Object.keys(ia))
    {
      if (typeof ia[key] == "function")
	ia[key].bind(ia);
    }
    // TODO bind for objects as well, not just interactions
  }
}

// thingsToLoad = {
//		    MapPath : string,	ie "assets/tilemaps/lvl1.txt"
//		    ImgLoad : [string], ie ["P_gen", "S_kn0"]
//
//
//
//
//		  }

// this loads everything that must be reloaded
// when a level is restarted
async function loadScript(script)
{
  let level = await import(script);
  level = rfdc({ proto: false, circles: false })(level.script)
  bindInteractions(level);
  return level;
}
async function loadMap(mapFile)
{
  let map = new TileMap();
  // load map
  mapFile = await requestFile(mapFile);
  map.generate(mapFile.responseText);
  return map;
}
async function loadImgs(imgList, imgMod)
{

  // load images
  Album.init();
  let i = new ImageLoader();
  await i.loadImgs( imgList );

  let imscript = await requestFile(imgMod);
  imscript = imscript.responseText;

  ImageModifier.init(Album);
  ImageModifier.execute(imscript)
}
async function loadMusic()
{
  await MusicPlayer.loadMusic();
}

async function loadFonts()
{
  document.fonts.load("11px ABCD Mono");
  document.fonts.load("11px ABCD Mono Bold");
  document.fonts.load("16.5px ABCD Mono");
  document.fonts.load("16.5px ABCD Mono Bold");
  document.fonts.load("22px ABCD Mono");
  document.fonts.load("22px ABCD Mono Bold");
}
