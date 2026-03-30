import {aStarSearch} from "/pathfinding.js";

const svgns = "http://www.w3.org/2000/svg";

const grid = document.getElementById("grid");
const solutionPath = document.createElementNS(svgns, "path");
solutionPath.setAttributeNS(null, "id", "path");
grid.appendChild(solutionPath);


const cellSize = 15;
let width = 0; //Math.ceil(window.innerWidth/cellSize);
let height = 0; //Math.ceil(window.innerHeight/cellSize);
let existingWidth = 0;
let existingHeight = 0;
let canResize = true;

let startPos = [14, 1];
let targetPos = [6, 6];
let walls = [];
let isMousedown = false;
let isDragging = false;
let isDraggingStart = false;
let isDraggingCurrElem = null;

let isFindingSolution = false;

const cellStates = {
    blank: "blank",
    target: "target",
    start: "start",
    wall: "wall",
    path: "path",
    checked: "checked"
}

/**
 * @param cell {SVGRectElement}
 * @param newState {String}
 */
function setCellState(cell, newState){
    cell.setAttributeNS(null, "data-state", newState);
}

/**
 * @param cell {SVGRectElement}
 */
function getCellState(cell){
    return cell.getAttributeNS(null, "data-state") || cellStates.blank;
}

function clearPathSolution(){
    solutionPath.setAttributeNS(null, "d", "");
    
    for (let y = 0; y < existingHeight; y++){
        for (let x = 0; x < existingWidth; x++){
            let elem = document.getElementById(`${x},${y}`);
            let state = getCellState(elem);
            if (state === cellStates.path || state === cellStates.checked){
                setCellState(elem, cellStates.blank);
            }
        }
    }
}

function drawFunc(Path){
    let pathStr = `M ${(startPos[0]+0.5)*(cellSize+1)} ${(startPos[1]+0.5)*(cellSize+1)}`;
    while (Path.length > 0) {
        let p = Path.pop();
        pathStr = pathStr + ` L ${(p[1]+.5)*(cellSize+1)} ${(p[0]+0.5)*(cellSize+1)}`;
        let cell = document.getElementById(`${p[1]},${p[0]}`);
        let state = getCellState(cell)
        if (cell !== null && state !== cellStates.target && state !== cellStates.start){
            setCellState(cell, cellStates.path);
        }
    }
    
    solutionPath.setAttributeNS(null, "d", pathStr);
    
    grid.appendChild(solutionPath);
}

function evaluateGrid(){
    if (canResize === false || isFindingSolution === true) { return; }
    isFindingSolution = true;
    
    const grid = new Array(existingHeight);
    for (let y = 0; y < existingHeight; y++){
        grid[y] = new Array(existingWidth).fill(1);
        for (let x = 0; x < existingWidth; x++){
            let elem = document.getElementById(`${x},${y}`);
            if (elem === null) { continue; }
            if (getCellState(elem) === cellStates.wall){
                grid[y][x] = 0;
            }
        }
    }
    
    aStarSearch(grid, startPos, targetPos, drawFunc);
    
    isFindingSolution = false;
}

function updateGrid(){
    if (canResize === false || isFindingSolution === true) { return; }
    canResize = false;
    width = Math.ceil(window.innerWidth/cellSize);
    height = Math.ceil(window.innerHeight/cellSize);
    //let newChildren = [];
    
    for (let y = 0; y < height; y++){
        for (let x = 0; x < width; x++){
            if (y < existingHeight && x < existingWidth) { continue; }
            
            let newChild = document.createElementNS(svgns, 'rect');
            newChild.setAttributeNS(null, 'id', `${x},${y}`);
            newChild.setAttributeNS(null, 'x', x * (cellSize + 1));
            newChild.setAttributeNS(null, 'y', y * (cellSize + 1));
            //newChild.setAttributeNS(null, 'width', cellSize);
            //newChild.setAttributeNS(null, 'height', cellSize);
            if (x === startPos[0] && y === startPos[1]){
                setCellState(newChild, cellStates.start);
            } else if (x === targetPos[0] && y === targetPos[1]){
                setCellState(newChild, cellStates.target);
            }
            for (let i = 0; i < walls.length; i++){
                if (walls[i][0] === x && walls[i][1] === y){
                    setCellState(newChild, cellStates.wall);
                }
            }
            
            function addRemoveWall(){
                // also check if can add/remove walls
                let state = getCellState(newChild);
                if (state === cellStates.wall){
                    setCellState(newChild, cellStates.blank);
                } else if (state === cellStates.blank){
                    setCellState(newChild, cellStates.wall);
                    grid.appendChild(newChild);
                }
                clearPathSolution();
            }
            
            newChild.addEventListener("mousedown", e => {
                let state = getCellState(newChild);
                if (state === "start" && isDragging === false) {
                    isDragging = true;
                    isDraggingStart = true;
                    isDraggingCurrElem = newChild;
                } else if (state === "target" && isDragging === false){
                    isDragging = true;
                    isDraggingStart = false;
                    isDraggingCurrElem = newChild;
                }
                if (isDragging === false){
                    addRemoveWall();
                }
            });
            newChild.addEventListener("mouseenter", e => {
                let state = getCellState(newChild);
                if (state === "blank" && isDragging === true){
                    setCellState(isDraggingCurrElem, cellStates.blank);
                    setCellState(newChild, isDraggingStart === true ? cellStates.start : cellStates.target);
                    isDraggingCurrElem = newChild;
                    if (isDraggingStart === true){
                        setCellState(newChild, cellStates.start);
                        startPos = [x, y];
                    } else {
                        setCellState(newChild, cellStates.target);
                        targetPos = [x, y];
                    }
                    clearPathSolution();
                    return;
                } 
                if (isMousedown === true && isDragging === false) {
                    addRemoveWall();
                }
            });
            
            //newChildren.push(newChild);
            grid.appendChild(newChild);
        }
    }
    
    existingHeight = Math.max(height, existingHeight);
    existingWidth = Math.max(width, existingWidth);
    
    canResize = true;
    //grid.replaceChildren(...newChildren);
}

window.addEventListener("mousedown", e => {
    isMousedown = true;
});

window.addEventListener("mouseup", e => {
    isMousedown = false;
    
    isDragging = false;
    isDraggingStart = false;
    isDraggingCurrElem = null;
});

window.addEventListener("resize", e => {
    updateGrid();
});

window.addEventListener("keypress", e => {
    if (e.code !== "KeyQ"){ return; }
    if (isMousedown === true || isDraggingCurrElem !== null) { return; }
    //if (isFindingSolution === true) { return; }
    
    evaluateGrid();
});

grid.style.setProperty("--cell-size", `${cellSize}px`);

updateGrid();

evaluateGrid();
