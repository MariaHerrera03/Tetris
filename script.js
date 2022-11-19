let canvas;
let context;

class Game {
    static SQUARE_LENGTH = screen.width > 300 ? 30 : 20;
    static COLUMNS = 10;
    static ROWS = 20;
    static CANVAS_WIDTH = this.SQUARE_LENGTH * this.COLUMNS;
    static CANVAS_HEIGHT = this.SQUARE_HEIGHT * this.ROWS;
    static BORDER_COLOR = "#ffffff";
    static EMPTY_COLOR = "#eaeaea";
    static DELETE_ROW_COLOR = "#d81c38";
    static TIMEOUT_LOCK_PUT_NEXT_PIECE = 400;
    static PIECE_SPEED = 400;
    static DELETE_ROW_ANIMATION = 500;
    static PER_SQUARE_SCORE = 1;
    static colors = [
        "#ffd300",
        "#de38c8",
        "#652ec7",
        "#33135c",
        "#13ca91",
        "#ff9472",
        "#35212a",
    ];

}



function inicializa(){
    canvas = document.getElementById("canvas");
    context = document.getContext("2d");
}

class point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Tetromino {
    constructor(rotations) {
        this.rotations = rotations;
        this.rotationsIndex = 0;
        this.points = this.rotations[this.rotationsIndex];
        const randomColor = Utils.getRandomColor();
        this.rotations.forEach(Points => {
            points.forEach(point => {
                point.color = randomColor;
            });
        });
        this.incrementRotationIndex();
    }

    getPoints(){
        return this.points;
    }

    incrementRotationIndex(){
        if (this.rotations.length <= 0) {
            this.rotationsIndex = 0;
        } else {
            if (this.rotationIndex + 1 >= this.rotations.length) {
                this.rotationIndex = 0;
            } else {
                this.rotationsIndex++;
            }
        }
    }
    getNextRotation(){
        return this.rotations[this.rotationIndex];
    }
}

class Utils {
    const getRandomNumberInRange = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const getRandomColor() {
        return Game.colors[Utils.getRandomNumberInRange(0, Game.colors.length -1)]
    }
}

constructor(canvasId) {
    this.canvasId = canvasId;
    this.timeoutFlag = false;
    this.board = [];
    this.existingPieces = [];
    this.globalX = 0;
    this.globalY = 0;
    this.paused = true;
    this.currentFigure = null;
    this.canPlay = false;
    this.intervalId = null;
    this.init();
}

init() {
    this.showWelcome();
    this.initDomElements();
    this.resetGame();
    this.draw();
    this.initControls();
}

getRandomFigure(){
    switch (Utils.getRandomNumberInRange(1, 7)) {
        case 1:
            return new Tetromino([
                [new Point(0, 0), [new Point(0, 1), [new Point(1, 1),]
            ]);
        case 2:
            return new Tetromino([
                [new Point(0, 0), new Point(1, 0), new Point(2, 0), new Point(3, 0)],
                [new Point(0, 0), new Point(0, 1), new Point(0, 2), new Point(0, 3)].
                ,
            ]);
    }
}

draw() {
    let x = 0, y = 0;
    for (const row of this.board) {
        x = 0;
        for (const point of row) {
            this.canvasContext.fillStyle = point.color;
            this.canvasContext.fillRect(x, y, Game.SQUARE_LENGTH, Game.SQUARE_LENGTH;
            this.canvasContext.restore();
            this.canvasContext.strokeStyle = Game.BORDER_COLOR;
            this.canvasContext.strokeRect(x, y, Game.SQUARE_LENGTH, Game.SQUARE_LENGTH);
            x += Game.SQUARE_LENGTH;
        }
        y += Game.SQUARE_LENGTH;
    }
    setTimeout(() => {
        requestAnimationFrame(this.draw.bind(this));
    }, 17)
}


