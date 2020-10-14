export const FPS = 30;
export const TICK_RATE = Math.floor(1000/FPS);

export const TILES = { ROAD : "0",
                TREE : "1",
                WALL : "9",
                ENEMY : "E"
	      }

export const UNIT_MAX_WEAP = 8;
export const UNIT_MAX_ITEM = 8;

export const STATS = [ "maxhp","atk","spd","skl","def","con","mov" ];

export const WIDTH = 512;
export const HEIGHT = 384;

export const C_WIDTH = 1024;
export const C_HEIGHT = 768;

//TODO modify all sprite to double resolution and change this to SCALE = 1.
//     this will require tweaks to scene objects.
export const SCALE = 2;

export const WINDOWGRID_X = 16;
export const WINDOWGRID_Y = 12;

export const GRIDSIZE_X = C_WIDTH/WINDOWGRID_X/SCALE;
export const GRIDSIZE_Y = C_HEIGHT/WINDOWGRID_Y/SCALE;
export const gx = GRIDSIZE_X;
export const gy = GRIDSIZE_Y;

export const CURSOR_SPEED = 4;

export const NUMLAYER = 5;

export const TEST_ENABLED = false;


