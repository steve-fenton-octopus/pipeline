export function canMoveTo(x, y, maze, config) {
    const s = config.cellSize;
    const r = config.playerRadius;
    const pw = 40;
    const margin = (pw / 2) - r + 5;

    const cellX = Math.floor(x / s);
    const cellY = Math.floor(y / s);

    if (cellX < 0 || cellX >= config.mazeWidth || cellY < 0 || cellY >= config.mazeHeight) return false;

    const cell = maze[cellY][cellX];
    const centerX = cellX * s + s / 2;
    const centerY = cellY * s + s / 2;

    const distToCenter = Math.hypot(x - centerX, y - centerY);
    if (distToCenter < margin) return true;

    if (!cell.walls.right && x > centerX && Math.abs(y - centerY) < margin && x < (cellX + 1) * s + s / 2) return true;
    if (cellX > 0 && !maze[cellY][cellX - 1].walls.right && x < centerX && Math.abs(y - centerY) < margin && x > (cellX - 1) * s + s / 2) return true;

    if (!cell.walls.bottom && y > centerY && Math.abs(x - centerX) < margin && y < (cellY + 1) * s + s / 2) return true;
    if (cellY > 0 && !maze[cellY - 1][cellX].walls.bottom && y < centerY && Math.abs(x - centerX) < margin && y > (cellY - 1) * s + s / 2) return true;

    return false;
}
