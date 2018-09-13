<template>
  <div class="hello">
<p>Points: {{this.points}}</p>
<canvas id="myCanvas" :width="canvasWidth" :height="canvasHeight" @keydown="test()">
Your browser does not support the HTML5 canvas tag.</canvas>

<p>copyright by PZ</p>

<div v-if="this.paused||!this.currentBlock" class="alert"><h1>{{gameOver ? "Game Over" : (paused ? "Paused" : "Ready to start?")}}</h1>
<p>{{gameOver ? "press Enter to start new game" : "press Space to resume"}}</p></div>


<div class="settings" v-if="this.paused||this.gameOver">
  Width [blocks]<el-slider v-model="maxx" show-input :min="5" :max="40" @change="settingsChanged=true"></el-slider>
  Height [blocks]<el-slider v-model="maxy" show-input :min="5" :max="50" @change="settingsChanged=true"></el-slider>
  Block Size [pixels]<el-slider v-model="size" show-input :min="5" :max="50" @change="settingsChanged=true"></el-slider>
  Initial Speed [ticks/min]<el-slider v-model="speed" show-input :min="30" :max="600" @change="settingsChanged=true"></el-slider>
  Speed Boost [%] <el-slider v-model="speedBoost" show-input :min="0" :max="50" @change="settingsChanged=true"></el-slider>
  Speed Boost Interval [point] <el-slider v-model="speedBoostInterval" show-input :min="1" :max="100" @change="settingsChanged=true"></el-slider>
<el-upload
  class="upload-demo"
  action=""
  ref="upload"   
  :auto-upload="false" :multiple="false" :on-change="newImage">
  <el-button  slot="trigger" size="small" type="primary">upload new background image</el-button>
  
  <div class="el-upload__tip" slot="tip">jpg/png files</div>
</el-upload>
 


</div>

<div id="bg">
  <img :src="image" :alt="image">
</div>

</div>
</template>

<script>



class Canvas
{
  maxOffsetX = 0;
  maxOffsetY = 0;
  unitSize = 0;
  ctx = null;
  bgColor = "#FFFFFF";
  matrix = [];  //macierz pol 0 i max = granice. indeksy pol na polu zaczynaja sie od 1
  colors = ["#AAAAAA","#FF0000","#00FF00","#0000FF","#FFD700","#FF1493","#00BFFF","#483D8B","#BC8F8F","#008000"];

 constructor(size, maxx, maxy, bgcolor, ctx)
  {
    this.unitSize=size;
    this.maxOffsetX=maxx;
    this.maxOffsetY=maxy;
    this.bgColor=bgcolor;
    this.ctx=ctx;

    this.matrix = new Array(this.maxOffsetX+2);
    this.clearMatrix();
  }

  clearMatrix()
  {
    for (var i = 0 ; i < (this.maxOffsetX+2); i++) {
      this.matrix[i] = new Array(this.maxOffsetY+2);
      for (var j = 0; j < (this.maxOffsetY+2); j++) {
        if ((i==0) || (i==this.maxOffsetX+1) || (j==0) || (j==this.maxOffsetY+1)) this.matrix[i][j] = 1;
        else this.matrix[i][j] = -1;
      }
    }
    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.maxOffsetX*this.unitSize, this.maxOffsetY*this.unitSize);
  }

  reDraw()
  {
    for (var i = 1 ; i < (this.maxOffsetX+1); i++) {
      for (var j = 1; j < (this.maxOffsetY+1); j++) {
                let newColor = this.bgColor;
                if(this.matrix[i][j]>-1) newColor=this.colors[this.matrix[i][j]];
                this.ctx.fillStyle = newColor;
                this.ctx.fillRect((i-1)*this.unitSize,(j-1)*this.unitSize,this.unitSize,this.unitSize);
      }
    }
  }

  cutFullLines()
  {
    let linesDeleted=false; // czy sa skasowane linie - tzn czy trzeba odswiezyc wyglad canvasu
    for (var j = 1; j < (this.maxOffsetY+1); j++)
    {
      let lineFull=true;
      for (var i = 1 ; i < (this.maxOffsetX+1); i++)
      {
        if (this.matrix[i][j]==-1)
        {
          lineFull=false;
          break;
        }
      }
      if (lineFull)  // zaktualizuj matrix kasujac pelne wiersze
      {
        linesDeleted=true;

        for (var z = j; z > 0; z--)
          for (var i = 1 ; i < (this.maxOffsetX+1); i++)
          {
            if (z>1) this.matrix[i][z]=this.matrix[i][z-1];
            else this.matrix[i][z]=-1;
          }

      }

    }

    if (linesDeleted) this.reDraw();
    return linesDeleted;
  }

}




class Block {
  canvas = null;
  static size; // unit size /scale
  nodes = []; //rotation 1-4, node nr, x/y
  rotation = 0;
  color = 1;  //from canvas colors
  static bgcolor = "#FFFFFF";
  offsetX = 0;
  offsetY = 0;
  canvasWidth = 500;

  constructor(canvas, color) {
    this.canvas=canvas;
    //this.canvas.ctx = canvas.ctx;
    //this.canvas.unitSize = size;
    this.color=color;
    this.initializeNodes();

    this.offsetX=Math.floor((this.canvas.maxOffsetX-3)/2); /// dopracuj wyśrodkowanie
  }

  draw() {    
    this.canvas.ctx.fillStyle = this.canvas.colors[this.color];
    this.nodes[this.rotation].forEach(function(item, index) {
      this.canvas.ctx.fillRect((this.offsetX+item[0])*this.canvas.unitSize,(this.offsetY+item[1])*this.canvas.unitSize,this.canvas.unitSize,this.canvas.unitSize);
      //this.ctx.stroke();
    }, this);
  }

  erase() {    
    this.canvas.ctx.fillStyle = this.canvas.bgColor;
    this.nodes[this.rotation].forEach(function(item, index) {
      this.canvas.ctx.fillRect((this.offsetX+item[0])*this.canvas.unitSize,(this.offsetY+item[1])*this.canvas.unitSize,this.canvas.unitSize,this.canvas.unitSize);
      //this.ctx.stroke();
    }, this);
  }

  initializeNodes() {}

  rotateRight() {
    //dodaj ograniczenia przy krawęedzi (nie zawsze da sie obrocic bo nie zawsze figura sie zmiesci)
    
    //this.offsetY++;
    //this.rotation < 3 ? this.rotation++ : (this.rotation = 0);
    
    let newRotation=(this.rotation < 3) ? this.rotation+1 : 0;
    

    
    let spaceOK=true; //is there a place to put the block?
    this.nodes[newRotation].forEach(function(item, index)
    {      
      //console.log(this.canvas.matrix[newOffsetX+1+item[0]][this.offsetY+item[1]]);
      //if ((this.offsetX+1+item[0]>this.canvas.maxOffsetX+1) || (this.canvas.matrix[this.offsetX+1+item[0]][this.offsetY+1+item[1]]>0))
      if (this.canvas.matrix[this.offsetX+1+item[0]][this.offsetY+1+item[1]]>-1)
      {
        spaceOK=false;
        //break;
      }
    }, this);

    if (spaceOK)
    {      
      this.erase();
      this.rotation=newRotation;
      this.draw();
    }

  }

  rotateLeft() {
    this.erase();
    this.rotation > 0 ? this.rotation-- : (this.rotation = 3);
    this.draw();
  }

  moveDown()
  {
    let newOffsetY=this.offsetY+1;
    var spaceOK=true; //is there a place to put the block?
    this.nodes[this.rotation].forEach(function(item, index)
    {      
      //console.log(this.canvas.matrix[newOffsetX+1+item[0]][this.offsetY+item[1]]);
      if (this.canvas.matrix[this.offsetX+1+item[0]][newOffsetY+1+item[1]]>-1)
      {
        spaceOK=false;
        //break;
      }
    }, this);

    if (spaceOK)
    {      
      this.erase();
      this.offsetY=newOffsetY;
      this.draw();
    }
    else
    {
      this.nodes[this.rotation].forEach(function(item, index)
      {
        this.canvas.matrix[this.offsetX+1+item[0]][this.offsetY+1+item[1]]=this.color;
      },this);
    }
    return spaceOK;
  }

  moveLeft()
  {
    let newOffsetX=this.offsetX-1;
    let spaceOK=true; //is there a place to put the block?
    this.nodes[this.rotation].forEach(function(item, index)
    {      
      //console.log(this.canvas.matrix[newOffsetX+1+item[0]][this.offsetY+item[1]]);
      if (this.canvas.matrix[newOffsetX+1+item[0]][this.offsetY+1+item[1]]>-1)
      {
        spaceOK=false;
        //break;
      }
    }, this);

    if (spaceOK)
    {      
      this.erase();
      this.offsetX=newOffsetX;
      this.draw();
    }
  }

  moveRight()
  {
    let newOffsetX=this.offsetX+1;
    let spaceOK=true; //is there a place to put the block?
    this.nodes[this.rotation].forEach(function(item, index)
    {      
      //console.log(this.canvas.matrix[newOffsetX+1+item[0]][this.offsetY+item[1]]);
      if (this.canvas.matrix[newOffsetX+1+item[0]][this.offsetY+1+item[1]]>0)
      {
        spaceOK=false;
        //break;
      }
    }, this);

    if (spaceOK)
    {      
      this.erase();
      this.offsetX=newOffsetX;
      this.draw();
    }
  }
}

class Rectangle extends Block {
  initializeNodes() {
    let rot1 = [[0, 1], [1, 1], [2, 1]];  // wspolrzedne klockow/kwadratow
    let rot2 = [[1, 0], [1, 1], [1, 2]];
    let rot3 = rot1;
    let rot4 = rot2;
    this.nodes = [rot1, rot2, rot3, rot4];
  }
}

class Tblock extends Block {
  initializeNodes() {

    let rot1 = [[0, 1],[1, 1],[2, 1],[1,0]];
    let rot2 = [[2, 1],[1, 1],[1, 0],[1,2]];
    let rot3 = [[0, 1],[1, 1],[2, 1],[1,2]];
    let rot4 = [[0, 1],[1, 1],[1, 0],[1,2]];
    this.nodes = [rot1, rot2, rot3, rot4];
  }
}

class Box extends Block {
  initializeNodes() {
    let rot1 = [[0, 0],[0, 1],[1, 0],[1,1]];
    let rot2 = rot1;
    let rot3 = rot1; 
    let rot4 = rot1;
    this.nodes = [rot1, rot2, rot3, rot4];
  }
}

class Lblock extends Block {
  initializeNodes() {
    let rot1 = [[0, 0],[0, 1],[0, 2],[1,2]];
    let rot2 = [[0, 1],[1, 1],[2, 1],[0,2]];
    let rot3 = [[0, 0],[1, 0],[1, 1],[1,2]];
    let rot4 = [[0, 1],[1, 1],[2, 1],[2,0]];
    this.nodes = [rot1, rot2, rot3, rot4];
  }
}

class RLblock extends Block {
  initializeNodes() {
    let rot1 = [[1, 0],[1, 1],[1, 2],[0,2]];
    let rot2 = [[0, 0],[0, 1],[1, 1],[2,1]];
    let rot3 = [[1, 0],[2, 0],[1, 1],[1,2]];
    let rot4 = [[0, 1],[1, 1],[2, 1],[2,2]];
    this.nodes = [rot1, rot2, rot3, rot4];
  }
}

class Sblock extends Block {
  initializeNodes() {
    let rot1 = [[0, 0],[0, 1],[1, 1],[1,2]];
    let rot2 = [[0, 1],[1, 1],[1, 0],[2,0]];
    let rot3 = rot1;
    let rot4 = rot2;
    this.nodes = [rot1, rot2, rot3, rot4];
  }
}


export default {
  name: "Game",
  props: {
    msg: String
  },
  data: function() {
    return {
      c: null,
      ctx: null,
      size: 20,
      maxx: 10,
      maxy: 20,
      currentBlock: null,
      
      paused: false,
      canvas: null,
      bgcolor: "#ffffff",
      blocks: [Rectangle, Tblock, Box, Lblock, RLblock, Sblock],
      colors: [],
      
      speed: 120,
      //initialTimeInterval: 500,
      timeInterval: 500,
      points: 0,
      speedBoost: 10,
      speedBoostInterval: 10,
      gameOver: false,

      settingsChanged: false,

      image: "../assets/maroko.jpg"

    

    };
  },
  created() {
    window.addEventListener('keydown',this.test,false);
  },
  mounted() {
    this.c = document.getElementById("myCanvas");
    this.ctx = this.c.getContext("2d");
    this.resetCanvas();
  },
  computed: {
    canvasWidth: function () {
      return this.size*this.maxx;
    },
    canvasHeight: function () {
      return this.size*this.maxy;
    }
  },
  methods: {
    newImage(response,file,fileList)
    {
      console.log(file[0].name);
      console.log(file[0].url);
      this.image=file[0].url;
    },
    resetCanvas()
    {
      delete this.canvas;
      this.canvas = new Canvas(this.size,this.maxx,this.maxy,this.bgcolor,this.ctx);
      this.resetGame();
      
    },
    resetGame()
    {
      this.timeInterval=Math.round(60000/this.speed);
      this.points=0;
      this.canvas.clearMatrix();
      //this.canvas.reDraw();
      this.gameOver=false;
      this.paused=false;
      let newBlock = Math.round(Math.random()*(this.blocks.length-1));
      let newColor = Math.round(Math.random()*(this.canvas.colors.length-1));
      this.currentBlock = new this.blocks[newBlock](this.canvas, newColor);
      this.currentBlock.draw();
      this.continue();
    },
    moveDown()
    {
        let movedDown=this.currentBlock.moveDown();
        if (!movedDown)
        {
          this.points++;
          if ((this.points % this.speedBoostInterval)==0) this.timeInterval=Math.round(this.timeInterval*(100-this.speedBoost)/100);


          let y=this.currentBlock.offsetY;
          delete this.currentBlock;

          if (y>1)
          {
          let newBlock = Math.round(Math.random()*(this.blocks.length-1));
          let newColor = Math.round(Math.random()*(this.canvas.colors.length-1));
          this.currentBlock = new this.blocks[newBlock](this.canvas, newColor);
          this.canvas.cutFullLines();
          this.currentBlock.draw()
          }
          else
          {
            this.paused=true;
            this.gameOver=true;
            //console.log("game over"); 
          }
        }
    },
    test(event)
    {


      switch (event.which)
      {
        case 13:
          
          if (this.settingsChanged)
          {
            this.settingsChanged=false;
            this.resetCanvas();
          }
          else if (this.gameOver) this.resetGame();
          else this.rotateRight();          
          break;
        case 37:
          this.moveLeft();
          break;
        case 39:
          this.moveRight();
          break;
        case 40:
          if (!this.paused&&!this.gameOver) this.moveDown();
          break;
        case 32:
          if (!this.gameOver) this.paused=!this.paused;
          if (this.settingsChanged)
          {
            this.settingsChanged=false;
            this.resetCanvas();
          }
          else
          {
            this.continue();
          }
          break;
        default:
          console.log('key pressed: ' + event.which);

      }

    },

    rotateRight()
    {
      if (!this.paused)
      {
        this.currentBlock.rotateRight();
      }
    },


    moveLeft()
    {
      if (!this.paused)
      {
        this.currentBlock.moveLeft();
      }
    },

    moveRight()
    {
      if (!this.paused)
      {
        this.currentBlock.moveRight();
      }
    },
    continue()
    {
      //console.log(this.timeInterval);
      const self=this; 
      setTimeout(function(){ self.tick(); },this.timeInterval);
    },
    tick()
    {
      if (!this.paused&!this.gameover)
      {
        // /console.log(this.blocks);
        
        //console.log(Math.round(Math.random()*(this.blocks.length-1)));
        this.moveDown();
        this.continue();
      
      }
    }
  }
};

//dolacz tu albo w main.js plik .js w ktorym zdefiniujemy class figure i klasy potomne definiujące wierzchołki każdej z figu w każej z 4 rotacji z parametrem skalowania
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#myCanvas {
  border:1px solid #d3d3d3;
  opacity: .9;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.settings
{
  width: 50vh;
  background-color: #cccccc;
  margin: auto;
  padding: 10px;
  opacity: .7;
  border-radius: 10px;
}

#bg {
  position: fixed; 
  top: -50%; 
  left: -50%; 
  width: 200%; 
  height: 200%;
  z-index: -1;
}
#bg img {
  position: absolute; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  margin: auto; 
  min-width: 50%;
  min-height: 50%;
  opacity: .9;
}
.alert  {
  color: #000000;
  background-image: linear-gradient(#444444, #eeeeee);
  width: 30vh;  
  margin: auto;
  margin-bottom: 5px;
  padding: 2px;
  opacity: .4;
  border-radius: 10px;
}
</style>


/*
destroy block objects

create canvas matrix



*/