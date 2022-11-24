class Tetris {
  // Square length in pixels
  static longitud_cuadrado = screen.width > 420 ? 30 : 20;
  static columnas = 13;
  static filas = 20;
  static ancho = this.longitud_cuadrado * this.columnas;
  static alto = this.longitud_cuadrado * this.filas;
  static color_vacio = "#a6e22e";
  static color_borde = "#ffffff";
  static color_fila_eliminada = "#d81c38";
  // When a piece collapses with something at its bottom, how many time wait for putting another piece? (in ms)
  static tiempo_nuevo_bloque = 300;
  // Speed of falling piece (in ms)
  static velocidad_pieza = 300;
  // Animation time when a row is being deleted
  static velocidad_eliminar_fila = 500;
  // Score to add when a square dissapears (for each square)
  static puntaje_por_cuadro = 1;
  static colores = [
    "#ffd300",
    "#de38c8",
    "#652ec7",
    "#33135c",
    "#13ca91",
    "#ff9472",
    "#35212a",
    "#ff8b8b",
    "#28cf75",
    "#00a9fe",
    "#04005e",
    "#120052",
    "#272822",
    "#f92672",
    "#66d9ef",
    "#a6e22e",
    "#fd971f",
  ];

  constructor(canvasId) {
    this.canvasId = canvasId;
    this.timeoutFlag = false;
    this.board = [];
    this.piezasExistentes = [];
    this.globalX = 0;
    this.globalY = 0;
    this.pausado = true;
    this.currentFigure = null;
    this.sounds = {};
    this.jugable = false;
    this.intervalId = null;
    this.init();
  }

// Run the game

  init() {
    this.mensajeVentanaEmergente();
    this.iniciarDOM();
    this.iniciarSonidos();
    this.reiniciarTetris();
    this.dibujarCanvas();
    this.iniciarControles();
  }

  reiniciarTetris() {
    this.score = 0;
    this.sounds.success.currentTime = 0;
    this.sounds.success.pause();
    this.sounds.background.currentTime = 0;
    this.sounds.background.pause();
    this.iniciarTablero_PiezasExistentes();
    this.elegirFiguraRandom();
    this.reiniciarXYGlobales();
    this.sincronizarPiezas_Tablero();
    this.refrescarPuntaje();
    this.pausarTetris();
  }

// Instructions window

  mensajeVentanaEmergente() {
    Swal.fire(
      "",
      `
        <ul class="list-group">
            <li class="list-group-item title"> <kbd>P</kbd><br>Pausar o reanudar </li>
            <li class="list-group-item title"> <kbd>R</kbd><br>Rotar</li>
            <li class="list-group-item title"> <kbd>Flechas de dirección</kbd><br>Mover figura hacia esa dirección</li>
            <li class="list-group-item title"><strong>También puedes usar los botones si estás en móvil</strong></li>
        </ul>
        `
    );
  }

// Controls

  iniciarControles() {
    document.addEventListener("keydown", (e) => {
      const { code } = e;
      if (!this.jugable && code !== "KeyP") {
        return;
      }
      switch (code) {
        case "ArrowRight":
          this.moverDerecha();
          break;
        case "ArrowLeft":
          this.moverIzquierda();
          break;
        case "ArrowDown":
          this.moverAbajo();
          break;
        case "KeyR":
        case "ArrowUp":
          this.rotarFigura();
          break;
        case "KeyP":
          this.pausarOcontinuar();
          break;
      }
      this.sincronizarPiezas_Tablero();
    });

// Event listeners

    this.$btnDown.addEventListener("click", () => {
      if (!this.jugable) return;
      this.moverAbajo();
    });
    this.$btnRight.addEventListener("click", () => {
      if (!this.jugable) return;
      this.moverDerecha();
    });
    this.$btnLeft.addEventListener("click", () => {
      if (!this.jugable) return;
      this.moverIzquierda();
    });
    this.$btnRotate.addEventListener("click", () => {
      if (!this.jugable) return;
      this.rotarFigura();
    });
    [this.$btnPause, this.$btnResume].forEach(($btn) =>
      $btn.addEventListener("click", () => {
        this.pausarOcontinuar();
      })
    );
  }

  moverDerecha() {
    if (this.siMoverDerecha()) {
      this.globalX++;
    }
  }

  moverIzquierda() {
    if (this.siMoverIzquierda()) {
      this.globalX--;
    }
  }

  moverAbajo() {
    if (this.siMoverAbajo()) {
      this.globalY++;
    }
  }

  rotarFigura() {
    this.siRotarFigura();
  }

  pausarOcontinuar() {
    if (this.pausado) {
      this.continuarTetris();
      this.$btnResume.hidden = true;
      this.$btnPause.hidden = false;
    } else {
      this.pausarTetris();
      this.$btnResume.hidden = false;
      this.$btnPause.hidden = true;
    }
  }

  pausarTetris() {
    this.sounds.background.pause();
    this.pausado = true;
    this.jugable = false;
    clearInterval(this.intervalId);
  }

  continuarTetris() {
    this.sounds.background.play();
    this.refrescarPuntaje();
    this.pausado = false;
    this.jugable = true;
    this.intervalId = setInterval(
      this.mainLoop.bind(this),
      Tetris.velocidad_pieza
    );
  }

  moverFiguras_PiezasExistentes() {
    this.jugable = false;
    for (const point of this.currentFigure.traerPuntaje()) {
      point.x += this.globalX;
      point.y += this.globalY;
      this.piezasExistentes[point.y][point.x] = {
        taken: true,
        color: point.color,
      };
    }
    this.reiniciarXYGlobales();
    this.jugable = true;
  }

  perderTetris() {
    // Check if there's something at Y 1. Maybe it is not fair for the player, but it works
    for (const point of this.piezasExistentes[1]) {
      if (point.taken) {
        return true;
      }
    }
    return false;
  }

  puntosParaEliminar = () => {
    const points = [];
    let y = 0;
    for (const row of this.piezasExistentes) {
      const isRowFull = row.every((point) => point.taken);
      if (isRowFull) {
        // We only need the Y coordinate
        points.push(y);
      }
      y++;
    }
    return points;
  };

  cambiarColorFilaEliminada(yCoordinates) {
    for (let y of yCoordinates) {
      for (const point of this.piezasExistentes[y]) {
        point.color = Tetris.color_fila_eliminada;
      }
    }
  }

  añadirPuntaje(rows) {
    if (Tetris.velocidad_pieza > 0) {
      Tetris.velocidad_pieza -= rows.length * 20;
      clearInterval(this.intervalId);
      this.intervalId = setInterval(
        this.mainLoop.bind(this),
        Tetris.velocidad_pieza
      );
    }
    this.score += Tetris.puntaje_por_cuadro * Tetris.columnas * rows.length;
    this.refrescarPuntaje();
  }

  removerFilasdePiezasExistentes(yCoordinates) {
    for (let y of yCoordinates) {
      for (const point of this.piezasExistentes[y]) {
        point.color = Tetris.color_vacio;
        point.taken = false;
      }
    }
  }

  verificar_eliminarFilas() {
    // Here be dragons
    const yCoordinates = this.puntosParaEliminar();
    if (yCoordinates.length <= 0) return;
    this.añadirPuntaje(yCoordinates);
    this.sounds.success.currentTime = 0;
    this.sounds.success.play();
    this.cambiarColorFilaEliminada(yCoordinates);
    this.jugable = false;
    setTimeout(() => {
      this.sounds.success.pause();
      this.removerFilasdePiezasExistentes(yCoordinates);
      this.sincronizarPiezas_Tablero();
      const invertedCoordinates = Array.from(yCoordinates);
      // Now the coordinates are in descending order
      invertedCoordinates.reverse();

      for (let yCoordinate of invertedCoordinates) {
        for (let y = Tetris.filas - 1; y >= 0; y--) {
          for (let x = 0; x < this.piezasExistentes[y].length; x++) {
            if (y < yCoordinate) {
              let counter = 0;
              let auxiliarY = y;
              while (
                this.esPuntoVacio(x, auxiliarY + 1) &&
                !this.puntoFueraDeLimites(x, auxiliarY + 1) &&
                counter < yCoordinates.length
              ) {
                this.piezasExistentes[auxiliarY + 1][x] =
                  this.piezasExistentes[auxiliarY][x];
                this.piezasExistentes[auxiliarY][x] = {
                  color: Tetris.color_vacio,
                  taken: false,
                };

                this.sincronizarPiezas_Tablero();
                counter++;
                auxiliarY++;
              }
            }
          }
        }
      }

      this.sincronizarPiezas_Tablero();
      this.jugable = true;
    }, Tetris.velocidad_eliminar_fila);
  }

  mainLoop() {
    if (!this.jugable) {
      return;
    }
    // If figure can move down, move down
    if (this.siMoverAbajo()) {
      this.globalY++;
    } else {
      // If figure cannot, then we start a timeout because
      // player can move figure to keep it going down
      // for example when the figure collapses with another points but there's remaining
      // space at the left or right and the player moves there so the figure can keep going down
      if (this.timeoutFlag) return;
      this.timeoutFlag = true;
      setTimeout(() => {
        this.timeoutFlag = false;
        // If the time expires, we re-check if figure cannot keep going down. If it can
        // (because player moved it) then we return and keep the loop
        if (this.siMoverAbajo()) {
          return;
        }
        // At this point, we know that the figure collapsed either with the floor
        // or with another point. So we move all the figure to the existing pieces array
        this.sounds.tap.currentTime = 0;
        this.sounds.tap.play();
        this.moverFiguras_PiezasExistentes();
        if (this.perderTetris()) {
          Swal.fire("Juego terminado", "Inténtalo de nuevo");
          this.sounds.background.pause();
          this.jugable = false;
          this.reiniciarTetris();
          return;
        }
        this.verificar_eliminarFilas();
        this.elegirFiguraRandom();
        this.sincronizarPiezas_Tablero();
      }, Tetris.tiempo_nuevo_bloque);
    }
    this.sincronizarPiezas_Tablero();
  }

  cleanTetrisBoardAndOverlapExistingPieces() {
    for (let y = 0; y < Tetris.filas; y++) {
      for (let x = 0; x < Tetris.columnas; x++) {
        this.board[y][x] = {
          color: Tetris.color_vacio,
          taken: false,
        };
        // Overlap existing piece if any
        if (this.piezasExistentes[y][x].taken) {
          this.board[y][x].color = this.piezasExistentes[y][x].color;
        }
      }
    }
  }

  overlapCurrentFigureOnTetrisBoard() {
    if (!this.currentFigure) return;
    for (const point of this.currentFigure.traerPuntaje()) {
      this.board[point.y + this.globalY][point.x + this.globalX].color =
        point.color;
    }
  }

  sincronizarPiezas_Tablero() {
    this.cleanTetrisBoardAndOverlapExistingPieces();
    this.overlapCurrentFigureOnTetrisBoard();
  }

  dibujarCanvas() {
    let x = 0,
      y = 0;
    for (const row of this.board) {
      x = 0;
      for (const point of row) {
        this.canvasContext.fillStyle = point.color;
        this.canvasContext.fillRect(
          x,
          y,
          Tetris.longitud_cuadrado,
          Tetris.longitud_cuadrado
        );
        this.canvasContext.restore();
        this.canvasContext.strokeStyle = Tetris.color_borde;
        this.canvasContext.strokeRect(
          x,
          y,
          Tetris.longitud_cuadrado,
          Tetris.longitud_cuadrado
        );
        x += Tetris.longitud_cuadrado;
      }
      y += Tetris.longitud_cuadrado;
    }
    setTimeout(() => {
      requestAnimationFrame(this.dibujarCanvas.bind(this));
    }, 17);
  }

  refrescarPuntaje() {
    this.$score.textContent = `Score: ${this.score}`;
  }

  iniciarSonidos() {
    this.sounds.background = Utils.cargarSonido(
      "../../assets/sounds/NewDonkBit.mp3",
      true
    );
    this.sounds.success = Utils.cargarSonido("../../assets/sounds/success.wav");//llena fila
    this.sounds.denied = Utils.cargarSonido("../../assets/sounds/denied.wav");//error o no movimiento
    this.sounds.tap = Utils.cargarSonido("../../assets/sounds/tap.wav");//game over
  }

  iniciarDOM() {
    this.$canvas = document.querySelector("#" + this.canvasId);
    this.$score = document.querySelector("#puntaje");
    this.$btnPause = document.querySelector("#btnPausar");
    this.$btnResume = document.querySelector("#btnIniciar");
    this.$btnRotate = document.querySelector("#btnRotar");
    this.$btnDown = document.querySelector("#btnAbajo");
    this.$btnRight = document.querySelector("#btnDerecha");
    this.$btnLeft = document.querySelector("#btnIzquierda");
    this.$canvas.setAttribute("width", Tetris.ancho + "px");
    this.$canvas.setAttribute("height", Tetris.alto + "px");
    this.canvasContext = this.$canvas.getContext("2d");
  }

  elegirFiguraRandom() {
    this.currentFigure = this.figuraRandom();
  }

  reiniciarXYGlobales() {
    this.globalX = Math.floor(Tetris.columnas / 2) - 1;
    this.globalY = 0;
  }

  figuraRandom() {

    switch (Utils.numeroRandomRango(1, 7)) {
      case 1:
      // Smashboy
        return new Tetromino([
          [new Point(0, 0), new Point(1, 0), new Point(0, 1), new Point(1, 1)],
        ]);
      case 2:
      // Hero
        return new Tetromino([
          [new Point(0, 0), new Point(1, 0), new Point(2, 0), new Point(3, 0)],
          [new Point(0, 0), new Point(0, 1), new Point(0, 2), new Point(0, 3)],
        ]);
      case 3:
      // Orange ricky
        return new Tetromino([
          [new Point(0, 1), new Point(1, 1), new Point(2, 1), new Point(2, 0)],
          [new Point(0, 0), new Point(0, 1), new Point(0, 2), new Point(1, 2)],
          [new Point(0, 0), new Point(0, 1), new Point(1, 0), new Point(2, 0)],
          [new Point(0, 0), new Point(1, 0), new Point(1, 1), new Point(1, 2)],
        ]);
      case 4:
      // Blue ricky
        return new Tetromino([
          [new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(2, 1)],
          [new Point(0, 0), new Point(1, 0), new Point(0, 1), new Point(0, 2)],
          [new Point(0, 0), new Point(1, 0), new Point(2, 0), new Point(2, 1)],
          [new Point(0, 2), new Point(1, 2), new Point(1, 1), new Point(1, 0)],
        ]);
      case 5:
      // Cleveland Z
        return new Tetromino([
          [new Point(0, 0), new Point(1, 0), new Point(1, 1), new Point(2, 1)],
          [new Point(0, 1), new Point(1, 1), new Point(1, 0), new Point(0, 2)],
        ]);
      case 6:
      // Rhode island Z
        return new Tetromino([
          [new Point(0, 1), new Point(1, 1), new Point(1, 0), new Point(2, 0)],
          [new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(1, 2)],
        ]);
      case 7:
      default:
      // Teewee
        return new Tetromino([
          [new Point(0, 1), new Point(1, 1), new Point(1, 0), new Point(2, 1)],
          [new Point(0, 0), new Point(0, 1), new Point(0, 2), new Point(1, 1)],
          [new Point(0, 0), new Point(1, 0), new Point(2, 0), new Point(1, 1)],
          [new Point(0, 1), new Point(1, 0), new Point(1, 1), new Point(1, 2)],
        ]);
    }
  }

  iniciarTablero_PiezasExistentes() {
    this.board = [];
    this.piezasExistentes = [];
    for (let y = 0; y < Tetris.filas; y++) {
      this.board.push([]);
      this.piezasExistentes.push([]);
      for (let x = 0; x < Tetris.columnas; x++) {
        this.board[y].push({
          color: Tetris.color_vacio,
          taken: false,
        });
        this.piezasExistentes[y].push({
          taken: false,
          color: Tetris.color_vacio,
        });
      }
    }
  }

  puntosFueraDeLimites(point) {
    const absoluteX = point.x + this.globalX;
    const absoluteY = point.y + this.globalY;
    return this.puntoFueraDeLimites(absoluteX, absoluteY);
  }

  puntoFueraDeLimites(absoluteX, absoluteY) {
    return (
      absoluteX < 0 ||
      absoluteX > Tetris.columnas - 1 ||
      absoluteY < 0 ||
      absoluteY > Tetris.filas - 1
    );
  }

  esPuntoVacio(x, y) {
    if (!this.piezasExistentes[y]) return true;
    if (!this.piezasExistentes[y][x]) return true;
    if (this.piezasExistentes[y][x].taken) {
      return false;
    } else {
      return true;
    }
  }

  puntoValido(point, points) {
    const emptyPoint = this.esPuntoVacio(
      this.globalX + point.x,
      this.globalY + point.y
    );
    const hasSameCoordinateOfFigurePoint =
      points.findIndex((p) => {
        return p.x === point.x && p.y === point.y;
      }) !== -1;
    const outOfLimits = this.puntosFueraDeLimites(point);
    if ((emptyPoint || hasSameCoordinateOfFigurePoint) && !outOfLimits) {
      return true;
    } else {
      return false;
    }
  }

  siMoverDerecha() {
    if (!this.currentFigure) return false;
    for (const point of this.currentFigure.traerPuntaje()) {
      const newPoint = new Point(point.x + 1, point.y);
      if (!this.puntoValido(newPoint, this.currentFigure.traerPuntaje())) {
        return false;
      }
    }
    return true;
  }

  siMoverIzquierda() {
    if (!this.currentFigure) return false;
    for (const point of this.currentFigure.traerPuntaje()) {
      const newPoint = new Point(point.x - 1, point.y);
      if (!this.puntoValido(newPoint, this.currentFigure.traerPuntaje())) {
        return false;
      }
    }
    return true;
  }

  siMoverAbajo() {
    if (!this.currentFigure) return false;
    for (const point of this.currentFigure.traerPuntaje()) {
      const newPoint = new Point(point.x, point.y + 1);
      if (!this.puntoValido(newPoint, this.currentFigure.traerPuntaje())) {
        return false;
      }
    }
    return true;
  }

  figuraPuedeRotar() {
    const newPointsAfterRotate = this.currentFigure.siguienteRotacion();
    for (const rotatedPoint of newPointsAfterRotate) {
      if (!this.puntoValido(rotatedPoint, this.currentFigure.traerPuntaje())) {
        return false;
      }
    }
    return true;
  }

  siRotarFigura() {
    if (!this.figuraPuedeRotar()) {
      this.sounds.denied.currentTime = 0;
      this.sounds.denied.play();
      return;
    }
    this.currentFigure.points = this.currentFigure.siguienteRotacion();
    this.currentFigure.incrementarRotacion();
  }

  async preguntarConfirmacionReset() {
    this.pausarTetris();
    const result = await Swal.fire({
      title: "¿Quieres reiniciar el juego?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#560772",
      cancelButtonColor: "#1CAC0B",
      cancelButtonText: "No",
      confirmButtonText: "Sí",
    });
    if (result.value) {
      this.reiniciarTetris();
    } else {
      this.continuarTetris();
    }
  }
}

class Utils {
  static numeroRandomRango = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  static colorRandom() {
    return Tetris.colores[
      Utils.numeroRandomRango(0, Tetris.colores.length - 1)
    ];
  }

  static cargarSonido(src, loop) {
    const sound = document.createElement("audio");
    sound.src = src;
    sound.setAttribute("preload", "auto");
    sound.setAttribute("controls", "none");
    sound.loop = loop || false;
    sound.style.display = "none";
    document.body.appendChild(sound);
    return sound;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Tetromino {
  constructor(rotations) {
    this.rotations = rotations;
    this.rotationIndex = 0;
    this.points = this.rotations[this.rotationIndex];
    const randomColor = Utils.colorRandom();
    this.rotations.forEach((points) => {
      points.forEach((point) => {
        point.color = randomColor;
      });
    });
    this.incrementarRotacion();
  }

  traerPuntaje() {
    return this.points;
  }

  incrementarRotacion() {
    if (this.rotations.length <= 0) {
      this.rotationIndex = 0;
    } else {
      if (this.rotationIndex + 1 >= this.rotations.length) {
        this.rotationIndex = 0;
      } else {
        this.rotationIndex++;
      }
    }
  }

  siguienteRotacion() {
    return this.rotations[this.rotationIndex];
  }
}

const game = new Tetris("canvas");
document.querySelector("#reset").addEventListener("click", () => {
  game.preguntarConfirmacionReset();
});
