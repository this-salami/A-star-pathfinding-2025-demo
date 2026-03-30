class cell {
    // Row and Column index of its parent
    // Note that 0 <= i <= ROW-1 & 0 <= j <= COL-1
    constructor(){
        this.parent_i = 0;
        this.parent_j = 0;
        this.f = 0;
        this.g = 0;
        this.h = 0;
    }
}

const adjOffset = [
    [-1, 0], //N
    [1 , 0], //S
    [0 , 1], //E
    [0 , -1], //W
    [-1, 1], //NE
    [-1, -1], //NW
    [1 , 1], //SE
    [1 , -1] //SW
    /*
    [-1, -1], [-1, 0], [-1, 1],
    [0 , -1],          [0 , 1],
    [1 , -1], [1 , 0], [1 , 1]
    */
];

const distanceCosts = [
    1, 1, 1, 1,
    1.414, 1.414, 1.414, 1.414
    /*
    1.414, 1, 1.414,
    1,        1,
    1.414, 1, 1.414
    */
];

function isValid(height, length, y, x) {
    return (y >= 0) && (y < height) && (x >= 0) && (x < length);
}
function isUnBlocked(grid, y, x) {
    return grid[y][x] === 1;
}
function isDestination(y, x, dest) {
    return y == dest[0] && x == dest[1];
}
function calculateHValue(x, y, dest){
    return (Math.sqrt((x - dest[1]) * (x - dest[1]) + (y - dest[0]) * (y - dest[0])));
}

function tracePath(cellDetails, dest, drawFunc) {
    //console.log("The Path is ");
    let row = dest[0];
    let col = dest[1];

    // stack<Pair> Path;
    let Path = [];

    while (!(cellDetails[row][col].parent_i == row && cellDetails[row][col].parent_j == col)) {
        Path.push([row, col]);
        let temp_row = cellDetails[row][col].parent_i;
        let temp_col = cellDetails[row][col].parent_j;
        row = temp_row;
        col = temp_col;
    }

    Path.push([row, col]);
    drawFunc(Path);
}

function paintCellVisited(x, y){
    let elem = document.getElementById(`${x},${y}`);
    if (elem === null) { return; }
    let state = elem.getAttributeNS(null, "data-state") || "blank";
    
    if (state === "blank") { 
        elem.setAttributeNS(null, "data-state", "checked");
     }
}

/**
 * @param grid {[Number[]]}
 */
export function aStarSearch(grid, src, dest, drawFunc){
    src = [src[1], src[0]];
    dest = [dest[1], dest[0]];
    
    let ROW = grid.length;
    let COL = grid[0].length;
    // Create a closed list and initialise it to false which
    // means that no cell has been included yet This closed
    // list is implemented as a boolean 2D array
    let closedList = new Array(ROW);
    for(let i = 0; i < ROW; i++){
        closedList[i] = new Array(COL).fill(false);
    }

    // Declare a 2D array of structure to hold the details
    // of that cell
    let cellDetails = new Array(ROW);
    for(let i = 0; i < ROW; i++){
        cellDetails[i] = new Array(COL);
    }

    let i, j;

    for (i = 0; i < ROW; i++) {
        for (j = 0; j < COL; j++) {
            cellDetails[i][j] = new cell();
            cellDetails[i][j].f = 2147483647;
            cellDetails[i][j].g = 2147483647;
            cellDetails[i][j].h = 2147483647;
            cellDetails[i][j].parent_i = -1;
            cellDetails[i][j].parent_j = -1;
        }
    }

    // Initialising the parameters of the starting node
    i = src[0], j = src[1];
    cellDetails[i][j].f = 0;
    cellDetails[i][j].g = 0;
    cellDetails[i][j].h = 0;
    cellDetails[i][j].parent_i = i;
    cellDetails[i][j].parent_j = j;

    /*
     Create an open list having information as-
     <f, <i, j>>
     where f = g + h,
     and i, j are the row and column index of that cell
     Note that 0 <= i <= ROW-1 & 0 <= j <= COL-1
     This open list is implemented as a set of pair of
     pair.*/
    let openList = new Map();

    // Put the starting cell on the open list and set its
    // 'f' as 0
    openList.set(0, [i, j]);

    // We set this boolean value as false as initially
    // the destination is not reached.
    let foundDest = false;

    while (openList.size > 0) {
        let p = openList.entries().next().value;

        // Remove this vertex from the open list
        openList.delete(p[0]);

        // Add this vertex to the closed list
        i = p[1][0];
        j = p[1][1];
        closedList[i][j] = true;

        /*
         Generating all the 8 successor of this cell

             N.W   N   N.E
               \   |   /
                \  |  /
             W----Cell----E
                  / | \
                /   |  \
             S.W    S   S.E

         Cell-->Popped Cell (i, j)
         N -->  North       (i-1, j)
         S -->  South       (i+1, j)
         E -->  East        (i, j+1)
         W -->  West           (i, j-1)
         N.E--> North-East  (i-1, j+1)
         N.W--> North-West  (i-1, j-1)
         S.E--> South-East  (i+1, j+1)
         S.W--> South-West  (i+1, j-1)*/

        // To store the 'g', 'h' and 'f' of the 8 successors
        let gNew, hNew, fNew;
        
        for (let index = 0; index < adjOffset.length; index++){
            let newI = i + adjOffset[index][0];
            let newJ = j + adjOffset[index][1];
            // Only process this cell if this is a valid one
            if (isValid(ROW, COL, newI, newJ) == true) {
                // If the destination cell is the same as the
                // current successor
                if (isDestination(newI, newJ, dest) == true) {
                    // Set the Parent of the destination cell
                    cellDetails[newI][newJ].parent_i = i;
                    cellDetails[newI][newJ].parent_j = j;
                    //console.log("The destination cell is found\n");
                    tracePath(cellDetails, dest, drawFunc);
                    foundDest = true;
                    return;
                }
                // If the successor is already on the closed
                // list or if it is blocked, then ignore it.
                // Else do the following
                else if (closedList[newI][newJ] == false && isUnBlocked(grid, newI, newJ) == true) {
                    gNew = cellDetails[i][j].g + distanceCosts[index];
                    hNew = calculateHValue(newI, newJ, dest);
                    fNew = gNew + hNew;

                    // If it isn’t on the open list, add it to
                    // the open list. Make the current square
                    // the parent of this square. Record the
                    // f, g, and h costs of the square cell
                    //                OR
                    // If it is on the open list already, check
                    // to see if this path to that square is
                    // better, using 'f' cost as the measure.
                    if (cellDetails[newI][newJ].f == 2147483647
                        || cellDetails[newI][newJ].f > fNew) {
                        openList.set(fNew, [newI, newJ]);

                        // Update the details of this cell
                        cellDetails[newI][newJ].f = fNew;
                        cellDetails[newI][newJ].g = gNew;
                        cellDetails[newI][newJ].h = hNew;
                        cellDetails[newI][newJ].parent_i = i;
                        cellDetails[newI][newJ].parent_j = j;
                    }
                }
                paintCellVisited(newJ, newI);
            }
        }
    }

    return;
}
