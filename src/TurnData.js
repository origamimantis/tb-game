export function TurnData(name, color, maptheme, btltheme)
{
  let ret = {};
  ret.turn = name;
  ret.bannercolor = color;
  ret.maptheme = maptheme;
  ret.btltheme = btltheme;

  return ret;
}
