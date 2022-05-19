
class Cell {
    constructor(x=0, y=0, g=0, h=0) {
        this.x = x;
        this.y = y;
        this.g = g;
        this.h = h;
        this.f = g + h;
    }
    set gcost(v) {
        this.g = v;
        this.f = this.g + this.h;
    }
    set hcost(v) {
        this.h = v;
        this.f = this.g + this.h;
    }
}

class Grid {
    // 0 = Begehbar
    // 1 = Nicht begehbar

    constructor(w=0, h=0, cellSize=50) {
        if (w < 0) w = 0;
        if (h < 0) h = 0;
        this.width = this.w = w;
        this.height = this.h = h;
        this.cellSize = cellSize;
        this.grid = Array(h).fill(null).map(_ => Array(w).fill(0));
    }

    get(x, y) {
        if (x == undefined || y == undefined || this.grid.length == 0
            || y < 0 || y >= this.grid.length 
            || x < 0 || x >= this.grid[0].length) return null;
        return this.grid[y][x];
    }
    set(x, y, v=1) {
        if (x == undefined || y == undefined || this.grid.length == 0
            || y < 0 || y >= this.grid.length 
            || x < 0 || x >= this.grid[0].length) return this;
        this.grid[y][x] = v;
        return this;
    }
    fill(x1, y1, x2, y2, v=1) {
        if (x1 == undefined || y1 == undefined || 
            x2 == undefined || y2 == undefined || this.grid.length == 0
            || y1 < 0 || y1 >= this.grid.length 
            || y2 < 0 || y2 >= this.grid.length 
            || x1 < 0 || x1 >= this.grid[0].length
            || x2 < 0 || x2 >= this.grid[0].length) return this;
        if (x1 > x2) {
            let tmp = x1;
            x1 = x2;
            x2 = tmp;
        }
        if (y1 > y2) {
            let tmp = y1;
            y1 = y2;
            y2 = tmp;
        }
        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                this.grid[y][x] = v;
            }
        }
        return this;
    }
    neighbours(x, y) {
        if (x == undefined || y == undefined || this.grid.length == 0
            || y < 0 || y >= this.grid.length 
            || x < 0 || x >= this.grid[0].length) return [];
        let nb = [];
        let indexes = Array(3).fill().map((_, i) => i - 1);
        indexes.flatMap(x => indexes.map(y => {return {x: x, y: y}}))
            .filter(v => v.x != 0 || v.y != 0)
            .forEach(v => {
                if (this.get(x + v.x, y + v.y) != null && this.get(x + v.x, y + v.y) != 1 &&
                    (this.get(x, y + v.y) != 1 || this.get(x + v.x, y) != 1)) {
                    nb.push(new Cell(x + v.x, y + v.y));
                }
            })
        return nb;
    }
    clear() {
        this.fill(0, 0, this.w-1, this.h-1, 0);
    }
    print() {
        console.log(this.grid.map(v => '[' + v.join(', ') + ']').join('\n'));
    }
}


let canvas;
let ctx;
let grid;

let openSet = [];
let closedSet = [];
let path = [];

document.addEventListener("DOMContentLoaded", function(event) {
    grid = new Grid(20, 9);
    canvas = document.getElementById('as-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.width = grid.w * grid.cellSize;
    canvas.height = grid.h * grid.cellSize;

    grid.fill(6, 2, 6, 6);
    grid.fill(10, 0, 10, 3);
    grid.fill(10, 5, 10, 8);
    grid.fill(14, 2, 14, 6);

    drawGrid();
    startAlgorithm();
});

function drawGrid() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#161616';
    ctx.beginPath();
    for (let y = 0; y < grid.h; y++) {
        ctx.moveTo(0, y * grid.cellSize);
        ctx.lineTo(canvas.width, y * grid.cellSize);
        ctx.stroke();
    }
    for (let x = 0; x < grid.w; x++) {
        ctx.moveTo(x * grid.cellSize, 0);
        ctx.lineTo(x * grid.cellSize, canvas.height);
        ctx.stroke();
    }
    ctx.closePath();
    grid.set(1, 4, 0);
    grid.set(18, 4, 0);
    for (let y = 0; y < grid.h; y++) {
        for (let x = 0; x < grid.w; x++) {
            if (grid.get(x, y) != 0) {
                ctx.fillStyle = '#000';
                drawCell(x, y);
            }
        }
    }

    for (let cell of openSet) {
        drawCostCell(cell, '#69C100');
    }
    for (let cell of closedSet) {
        drawCostCell(cell, '#C21000');
    }

    ctx.fillStyle = '#299BC3';
    drawCell(1, 4);
    drawCell(18, 4);
    
    for (let cell of path) {
        drawCostCell(cell, '#299BC3');
    }
}

function drawCell(x=0, y=0) {
    ctx.fillRect(x * grid.cellSize + 1, y * grid.cellSize + 1, grid.cellSize - 2, grid.cellSize - 2);
}

function drawCostCell(cell=new Cell(0,0), color='#68B255') {
    ctx.fillStyle = color;
    drawCell(cell.x, cell.y);
    ctx.fillStyle = '#000';
    ctx.font = "10px Consolas";
    ctx.textAlign = "left";
    ctx.fillText(cell.g, cell.x * grid.cellSize + 4, cell.y * grid.cellSize + 15);
    ctx.textAlign = "right";
    ctx.fillText(cell.h, (cell.x+1) * grid.cellSize - 4, cell.y * grid.cellSize + 15);
    ctx.font = "18px Consolas";
    ctx.textAlign = "center";
    ctx.fillText(cell.f, (cell.x+0.5) * grid.cellSize, (cell.y+0.5) * grid.cellSize + 10);
    // G   H
    //   F
}

function startAlgorithm() {
    getPath(1, 4, 18, 4);
}

function getPath(x=0, y=0, tx=0, ty=0) {
    openSet = [new Cell(x, y)];
    closedSet = [];
    path = [];

    let loop = setInterval(() => {
        let currentNode = openSet[0];
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < currentNode.f || (openSet[i].f == currentNode.f && openSet[i].h < currentNode.h)) {
                currentNode = openSet[i];
            }
        }

        openSet.splice(openSet.indexOf(currentNode), 1);
        closedSet.push(currentNode);

        if (currentNode.x == tx && currentNode.y == ty) {
            path = retracePath(new Cell(x, y), currentNode);
            endAlgorithm(loop);
            return;
        }

        for (let nb of grid.neighbours(currentNode.x, currentNode.y)) {
            if (setIncludes(closedSet, nb)) continue;

            let newCost = currentNode.g + getDist(currentNode.x, currentNode.y, nb.x, nb.y);
            if (newCost < nb.g || !setIncludes(openSet, nb)) {
                nb.gcost = newCost;
                nb.hcost = getDist(nb.x, nb.y, tx, ty);
                nb.parent = currentNode;

                if (!setIncludes(openSet, nb)) {
                    openSet.push(nb);
                } else {
                    let index = getIndex(openSet, nb);
                    openSet[index].gcost = nb.g;
                    openSet[index].hcost = nb.h;
                }
            }
        }
        drawGrid();
        
        if (openSet.length == 0) endAlgorithm(loop);
    }, 100);
}

function endAlgorithm(loop) {
    drawGrid();
    clearInterval(loop);

    // Stats
    console.log('Rechenschritte: ', closedSet.length);
    console.log('Rechenschritte (% von Gesamt): ', ((closedSet.length * 100) / (grid.w * grid.h - grid.grid.flatMap(v=>v).filter(v=>v==1).length)) + '%');
    console.log('Schritte zum Ziel: ', path.length);
}

function retracePath(start, end) {
    let path = [];
    let current = end;

    while (current.x != start.x || current.y != start.y) {
        path.push(current);
        current = current.parent;
    }
    return path.reverse();
}

function getDist(x1=0, y1=0, x2=0, y2=0) {
    // Euclidean
    // return Math.floor(Math.sqrt((x1-x2)**2 + (y1-y2)**2) * 10); 
    // Octil
    // return Math.floor(Math.max(Math.abs(x1-x2), Math.abs(y1-y2) + (Math.sqrt(2)-1) * Math.min(Math.abs(x1-x2), Math.abs(y1-y2))) * 10);
    // Manhattan
    // return Math.min(Math.abs(x1-x2), Math.abs(y1-y2)) * 14 + Math.abs(Math.abs(x1-x2) - Math.abs(y1-y2)) * 10

    // Manhattan (fancy)
    let dX = Math.abs(x1 - x2);
    let dY = Math.abs(y1 - y2);

    if (dX > dY) return 14 * dY + 10 * (dX - dY);
    else return 14 * dX + 10 * (dY - dX);
}

function setIncludes(set, cell) {
    return set.filter(v => v.x == cell.x && v.y == cell.y).length > 0;
}

function getIndex(set, cell) {
    let index = -1;
    set.map((v, i) => {
        if (v.x == cell.x && v.y == cell.y) index = i;
    })
    return index;
}