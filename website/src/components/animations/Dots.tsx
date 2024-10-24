import React from 'react';

import dynamic from 'next/dynamic';

// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => ({
  default: mod.default
})), {
  ssr: false,
});

// :any is there because this a typescript file, ignore this for now
let cellsWide: any;
let cellsHigh: any;
let total: any;
let cells: any[] = [];
let cellSize: any;
let showfood: any;
let constGrowth: any;
let oldMouseX: any;
let oldMouseY: any;

class Life {
  private cell: any;
  private hue: any;
  private metabolism: any;
  private size: any;
  private agression: any;
  private c: any;
  private resistance: number;
  private p5JS: any;

  constructor(parent: any, p5: any) {
    this.p5JS = p5;
    this.cell = parent;
    this.hue = p5.random(1);
    this.metabolism = p5.random(1);
    this.size = p5.random(1);
    this.agression = p5.random(1);
    let mappedS = p5.map(this.metabolism, 0, 1, 0.5, 1);
    let mappedL = p5.map(1 - this.agression, 0, 1, 0.5, 1);
    p5.colorMode(p5.HSB, 1);
    this.c = p5.color(this.hue, mappedS, mappedL);
    this.resistance = 0;
  }

  lifestats(h: any, m: any, a: any) {
    this.hue = h;
    this.metabolism = m;
    this.size = this.cell.food / 2;
    this.agression = a;
    let mappedS = this.p5JS.map(1 - this.metabolism, 0, 1, 0.5, 1);
    let mappedL = this.p5JS.map(this.agression, 0, 1, 0.5, 1);
    this.p5JS.colorMode(this.p5JS.HSB, 1);
    this.c = this.p5JS.color(this.hue, mappedS, mappedL);
  }

  update() {
    this.cell.food = this.cell.food - this.metabolism * this.size;
    //food in cell goes down in proportion to metablism and createCanvas
    this.size *= this.cell.food / this.size;
    // size change is proportional to excess or surplus food
    this.size = this.p5JS.constrain(this.size, 0, 1);
    if (this.size < 0.2) {
      this.cell.killLife();
    }
    //console.log(metabolism, cell.food, createCanvas);
    if (this.p5JS.random(1) * this.p5JS.random(1) < this.metabolism) {
      //if (random(0.5) < metabolism) {
      this.haveChild();
    }
    let n = 0;
    let e = 0;
    let s = 0;
    let w = 0;
    if (this.cell.north != null) {
      if (this.cell.north.life != null) {
        n = 1 - this.cell.north.life.agression;
      }
    }
    if (this.cell.east != null) {
      if (this.cell.east.life != null) {
        e = 1 - this.cell.east.life.agression;
      }
    }
    if (this.cell.south != null) {
      if (this.cell.south.life != null) {
        s = 1 - this.cell.south.life.agression;
      }
    }
    if (this.cell.west != null) {
      if (this.cell.west.life != null) {
        w = 1 - this.cell.west.life.agression;
      }
    }
    this.resistance = (n + e + s + w) / 4 / this.agression;
  }

  haveChild() {
    let i = this.p5JS.round(this.p5JS.random(4));
    //console.log(i);
    //prletln("i: " + i);
    let h = this.hue * this.p5JS.random(0.95, 1.05);
    //let h = resistance;
    if (h < 0) {
      h += 1;
    }
    if (h > 1) {
      h -= 1;
    }
    let a = this.agression * this.p5JS.random(0.95, 1.05);
    if (a < 0) {
      a += 1;
    }
    if (a > 1) {
      a -= 1;
    }
    let m = this.metabolism * this.p5JS.random(0.95, 1.05);
    if (m < 0) {
      m += 1;
    }
    if (m > 1) {
      m -= 1;
    }
    //prletln(h, m, a);
    switch (i) {
      case 0:
        if (this.cell.north != null) {
          let l = new Life(this.cell.north, this.p5JS);
          l.lifestats(h, m, a);
          this.cell.north.addExistingLife(l);
          //console.log(h,m,a);
        }
        break;
      case 1:
        if (this.cell.east != null) {
          let l = new Life(this.cell.east, this.p5JS);
          l.lifestats(h, m, a);
          this.cell.east.addExistingLife(l);
          //console.log(h,m,a);
        }
        break;
      case 2:
        if (this.cell.south != null) {
          let l = new Life(this.cell.south, this.p5JS);
          l.lifestats(h, m, a);
          this.cell.south.addExistingLife(l);
          //console.log(h,m,a);
        }
        break;
      case 3:
        if (this.cell.west != null) {
          let l = new Life(this.cell.west, this.p5JS);
          l.lifestats(h, m, a);
          this.cell.west.addExistingLife(l);
          //console.log(h,m,a);
        }
    }
  }
}

class Cell {
  private size: any;
  private growthMod: number;
  private pos: any;
  private food: number;
  private occupied: boolean;
  private life: any;
  private north: any;
  private east: any;
  private south: any;
  private west: any;
  private growth: number;
  private agro: number;
  private defence: number;
  private lifeMargin: number;
  private p5JS: any;

  constructor(s: any, p: any, p5: any) {
    this.p5JS = p5;
    this.size = s;
    this.growthMod = 1;
    this.pos = p5.createVector(p.x, p.y);
    this.food = p5.random(1);
    this.occupied = false;
    this.life = null;
    this.north = null;
    this.east = null;
    this.south = null;
    this.west = null;
    this.growth =
      this.p5JS.noise(
        p.x / 10 + this.p5JS.second() / 100,
        p.y / 10 + this.p5JS.second() / 100,
      ) *
      constGrowth *
      this.growthMod;
    //this.growth = this.growthMod
    this.agro = 0;
    this.defence = 0;
    this.lifeMargin = 0;
  }

  foodOccupied(f: any, o: any) {
    this.food = f;
    this.occupied = o;
  }

  init() {
    if (this.pos.y - 1 > -1) {
      this.north = cells[this.pos.x][this.pos.y - 1];
    } else {
      this.north = cells[this.pos.x][cellsHigh - 1];
    }
    if (this.pos.x + 1 < cellsWide) {
      this.east = cells[this.pos.x + 1][this.pos.y];
    } else {
      this.east = cells[0][this.pos.y];
    }
    if (this.pos.y + 1 < cellsHigh) {
      this.south = cells[this.pos.x][this.pos.y + 1];
    } else {
      this.south = cells[this.pos.x][0];
    }
    if (this.pos.x - 1 > -1) {
      this.west = cells[this.pos.x - 1][this.pos.y];
    } else {
      this.west = cells[cellsWide - 1][this.pos.y];
    }
  }

  displayLife() {
    if (this.life != null) {
      this.p5JS.push(); // isolate translation
      this.p5JS.strokeWeight(0);
      this.p5JS.colorMode(this.p5JS.HSB, 1);
      this.p5JS.fill(this.life.hue, this.life.metabolism, this.life.agression);
      this.p5JS.fill(
        ((this.life.hue * 3) % 3) / 3,
        this.p5JS.map(1 - this.life.agression, 0, 1, 0.2, 0.8),
        this.p5JS.map(this.life.metabolism, 0, 1, 0.7, 0.99),
      );
      //this.p5JS.fill(this.life.c)

      this.p5JS.rectMode(this.p5JS.CENTER); // draw from centre
      this.p5JS.ellipseMode(this.p5JS.CENTER);
      this.p5JS.translate(this.size / 2, this.size / 2); //translate by half the createCanvas
      this.p5JS.translate(this.size * this.pos.x, this.size * this.pos.y);
      this.p5JS.ellipse(
        0,
        0,
        this.size * this.life.size + 2,
        this.size * this.life.size + 2,
      );
      //rect(0, 0, (createCanvas*life.createCanvas)+2, (createCanvas*life.createCanvas)+2); // draw the square
      this.p5JS.pop(); // out
    }
  }

  display() {
    // this.p5JS.push() // isolate translation
    // this.p5JS.noStroke()
    // this.p5JS.strokeWeight(0)
    // this.p5JS.colorMode(this.p5JS.HSB, 1)
    // if (showfood == true) {
    //   this.p5JS.fill(this.food / 2, 0.5)
    // } else {
    //   const col = this.p5JS.color("#ffffff25")
    //   this.p5JS.fill(col)
    // }
    // this.p5JS.rectMode(this.p5JS.CENTER) // draw from centre
    // this.p5JS.translate(this.size / 2, this.size / 2) //translate by half the size
    // this.p5JS.translate(this.size * this.pos.x, this.size * this.pos.y)
    // this.p5JS.rect(0, 0, this.size, this.size) // draw the square
    // this.p5JS.pop() // out
    this.displayLife();
  }

  addLife() {
    if (this.life == null) {
      this.life = new Life(this, this.p5JS);
      this.displayLife();
    }
  }

  addExistingLife(l: any) {
    if (this.life == null) {
      this.life = l;
      this.displayLife();
    } else if (this.life.resistance > l.agression) {
      this.defence++;
      this.life.resistance *= 1.01;
      this.displayLife();
    } else if (this.life.resistance < l.agression) {
      this.agro++;
      this.food *= this.life.size;
      l.agression *= 1.01;
      this.life = l;
      this.displayLife();
    }
  }

  killLife() {
    if (this.life != null) {
      //prletln(agro, defence);
      //prletln(food);
      this.food += this.life.size / 2;
      //growth += 0.1;
      //prletln(growth);
      this.life = null;
      this.displayLife();
    }
  }

  clicked() {
    if (this.life == null) {
      this.addLife();
    } else {
      this.killLife();
    }
  }

  next() {
    //this.growth = (noise((this.pos.x/10)+second()/100, (this.pos.y/10)+second()/100)*constGrowth*this.growthMod);
    this.growth = this.growthMod;
    if (this.life != null) {
      this.life.update();
    } else {
      this.food = this.growth * this.food * (1 - this.food);
    }
    this.food = this.p5JS.constrain(this.food, 0.01, 1);
    if (this.food == 0 && this.growth > 1 && this.p5JS.random(1) > 0.99) {
      this.food += 0.01;
    }
  }
}

function toroidalDistance(x1: any, y1: any, x2: any, y2: any, p5: any) {
  let dx = p5.abs(x2 - x1);
  let dy = p5.abs(y2 - y1);

  if (dx > cellsWide / 2) dx = cellsWide - dx;

  if (dy > cellsHigh / 2) dy = cellsHigh - dy;

  return p5.sqrt(dx * dx + dy * dy);
}

function invert(c: any, p5: any) {
  p5.colorMode(p5.RGB, 1);
  let redcol = 1 - p5.red(c);
  let greencol = 1 - p5.green(c);
  let bluecol = 1 - p5.blue(c);
  let alpha = 0.1;
  let col = p5.color(redcol, greencol, bluecol);
  if (p5.red(c) + p5.green(c) + p5.blue(c) > 1) {
    col = p5.color(0, 0, 0, alpha);
  } else {
    col = p5.color(1, 1, 1, alpha);
  }

  return col;
}

export const DembraneSketch = ({
  pageWidth,
  paused,
}: {
  pageWidth: number;
  paused: boolean;
}) => {
  //console.log(paused)
  const setup = (p5: any, canvasParentRef: any) => {
    // use parent to render the canvas in this ref
    // (without that p5 will render the canvas outside of your component)
    //Declarations

    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    cellSize = p5.map(p5.width * p5.height, 300000, 10000000, 10, 25);
    cellsWide = p5.ceil(p5.width / cellSize);
    cellsHigh = p5.ceil(p5.height / cellSize);
    total = cellsWide * cellsHigh;
    //color[] colors = new color[total];

    showfood = false;
    constGrowth = 8;
    p5.background('#ffffff');
    p5.frameRate(60);
    //fullScreen();
    for (let i = 0; i < cellsWide; i++) {
      cells[i] = [];
      for (let j = 0; j < cellsHigh; j++) {
        let pos = p5.createVector(i, j);
        cells[i][j] = new Cell(cellSize, pos, p5);
        cells[i][j].display();
      }
    }
    for (let i = 0; i < cellsWide; i++) {
      for (let j = 0; j < cellsHigh; j++) {
        cells[i][j].init();
      }
    }
    //cells[p5.round(cellsWide / 2)][p5.round(cellsHigh / 2)].clicked()
    oldMouseX = p5.mouseX;
    oldMouseY = p5.mouseY;
  };

  const draw = (p5: any) => {
    if (paused) {
      return;
    } else {
      let number = 0;
      let mousePosX = p5.mouseX;
      let mousePosY = p5.mouseY;

      let x = p5.floor(mousePosX / cellSize);
      let y = p5.floor(mousePosY / cellSize);

      for (let i = 0; i < cellsWide; i++) {
        for (let j = 0; j < cellsHigh; j++) {
          cells[i][j].next();
          let dist = toroidalDistance(i, j, x, y, p5);
          //console.log(dist);
          cells[i][j].growthMod = 4 - dist / 5;
          if (cells[i][j].life != null) {
            //number++;
          }
        }
      }

      p5.push(); // isolate translation
      p5.noStroke();
      p5.strokeWeight(0);
      const col = p5.color('#ffffff10');
      p5.fill(col);
      p5.rect(0, 0, p5.windowWidth, p5.windowHeight); // draw the square
      p5.pop(); // out

      //prletln(cells[i][j].pos, cells[i][j].life);
      x = p5.constrain(x, 0, cellsWide - 1);
      y = p5.constrain(y, 0, cellsHigh - 1);
      if (mousePosX != oldMouseX && mousePosY != oldMouseY) {
        cells[x][y].clicked();
      } else if (p5.frameCount % 15 == 0) {
        cells[x][y].clicked();
        //console.log("time clicker");
      }
      //console.log(i,j);
      oldMouseX = p5.mouseX;
      oldMouseY = p5.mouseY;
      //p5.fill("#ffffffde")
      //p5.rect(0, 0, p5.width, p5.height)
    }
  };

  const windowResized = (p5: any) => {
    //console.log("window resized")
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    cellSize = p5.map(p5.width * p5.height, 300000, 10000000, 10, 25);
    cellsWide = p5.ceil(p5.width / cellSize);
    cellsHigh = p5.ceil(p5.height / cellSize);
    total = cellsWide * cellsHigh;
    for (let i = 0; i < cellsWide; i++) {
      cells[i] = [];
      for (let j = 0; j < cellsHigh; j++) {
        let pos = p5.createVector(i, j);
        cells[i][j] = new Cell(cellSize, pos, p5);
        cells[i][j].display();
      }
    }
    for (let i = 0; i < cellsWide; i++) {
      for (let j = 0; j < cellsHigh; j++) {
        cells[i][j].init();
      }
    }
  };

  return <Sketch setup={setup} draw={draw} windowResized={windowResized} />;
};
