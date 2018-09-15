
export class Canvas
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

export class Block {
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