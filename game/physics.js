const PATH_WIDTH = 40;
const PADDING = 5;

/**
 * Checks whether a player can move to (x, y) by testing
 * if the position falls within a maze corridor.
 */
export function canMoveTo(x, y, maze, config) {
    const { cellSize, playerRadius, mazeWidth, mazeHeight } = config;
    const margin = (PATH_WIDTH / 2) - playerRadius + PADDING;

    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);

    const isOutOfBounds = cellX < 0 || cellX >= mazeWidth
        || cellY < 0 || cellY >= mazeHeight;
    if (isOutOfBounds) return false;

    const cell = maze[cellY][cellX];
    const centerX = cellX * cellSize + cellSize / 2;
    const centerY = cellY * cellSize + cellSize / 2;

    // Within the central safe zone of the cell
    if (Math.hypot(x - centerX, y - centerY) < margin) return true;

    // Can move right through an open right wall
    const rightNeighborCenter = (cellX + 1) * cellSize + cellSize / 2;
    if (!cell.walls.right
        && x > centerX
        && x < rightNeighborCenter
        && Math.abs(y - centerY) < margin) return true;

    // Can move left through the Neighbor's open right wall
    const leftNeighborCenter = (cellX - 1) * cellSize + cellSize / 2;
    if (cellX > 0
        && !maze[cellY][cellX - 1].walls.right
        && x < centerX
        && x > leftNeighborCenter
        && Math.abs(y - centerY) < margin) return true;

    // Can move down through an open bottom wall
    const bottomNeighborCenter = (cellY + 1) * cellSize + cellSize / 2;
    if (!cell.walls.bottom
        && y > centerY
        && y < bottomNeighborCenter
        && Math.abs(x - centerX) < margin) return true;

    // Can move up through the Neighbor's open bottom wall
    const topNeighborCenter = (cellY - 1) * cellSize + cellSize / 2;
    if (cellY > 0
        && !maze[cellY - 1][cellX].walls.bottom
        && y < centerY
        && y > topNeighborCenter
        && Math.abs(x - centerX) < margin) return true;

    return false;
}
