import "./style.css";

window.addEventListener("load", () => {
  // const textInput = document.querySelector<HTMLInputElement>(".textInput");
  const canvas = document.querySelector<HTMLCanvasElement>(".canvas1");
  const ctx = canvas?.getContext("2d", { willReadFrequently: true });
  if (!ctx || !canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  class Particle {
    originX: number;
    originY: number;
    x: number;
    y: number;
    size: number;
    dx: number;
    dy: number;
    vx: number;
    vy: number;
    force: number;
    angle: number;
    distance: number;
    friction: number;
    ease: number;

    constructor(
      private effect: Effect,
      x: number,
      y: number,
      private color: string
    ) {
      this.x = Math.random() * this.effect.canvasWidth;
      this.y = this.effect.canvasHeight;
      this.originX = x;
      this.originY = y;
      this.size = this.effect.gap;
      this.dx = 0;
      this.dy = 0;
      this.vx = 0;
      this.vy = 0;
      this.force = 0;
      this.angle = 0;
      this.distance = 0;
      this.friction = Math.random() * 0.6 + 0.15;
      this.ease = Math.random() * 0.1 + 0.01;
    }
    draw() {
      this.effect.context.fillStyle = this.color;
      this.effect.context.fillRect(this.x, this.y, this.size, this.size);
    }

    update() {
      this.dx = this.effect.mouse.x - this.x;
      this.dy = this.effect.mouse.y - this.y;
      this.distance = Math.sqrt(this.dx ** 2 + this.dy ** 2);
      this.force = -this.effect.mouse.radius / this.distance;

      if (this.distance < this.effect.mouse.radius) {
        this.angle = Math.atan2(this.dy, this.dx);
        this.vx += this.force * Math.cos(this.angle);
        this.vy += this.force * Math.sin(this.angle);
      }

      this.x +=
        (this.vx *= this.friction) + (this.originX - this.x) * this.ease;
      this.y +=
        (this.vy *= this.friction) + (this.originY - this.y) * this.ease;
    }
  }

  class Effect {
    textX: number;
    textY: number;
    fontSize: number;
    maxTextWidth: number;
    lineHeight: number;
    textInput: HTMLInputElement;
    particles: Particle[];
    gap: number;
    mouse: { radius: number; x: number; y: number };

    constructor(
      public context: CanvasRenderingContext2D,
      public canvasWidth: number,
      public canvasHeight: number
    ) {
      this.textX = this.canvasWidth / 2;
      this.textY = this.canvasHeight / 2;
      this.fontSize = 100;
      this.lineHeight = 80;
      this.maxTextWidth = this.canvasWidth * 0.8;
      this.textInput = document.querySelector<HTMLInputElement>(".textInput")!;
      this.textInput.addEventListener("keyup", (e: KeyboardEvent) => {
        if (e.key === " ") return;
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        if (e.target instanceof HTMLInputElement) {
          this.wrapText(e.target.value);
        }
      });
      this.particles = [];
      this.gap = 1;
      this.mouse = {
        radius: 200,
        x: 0,
        y: 0,
      };

      window.addEventListener("mousemove", (e: MouseEvent) => {
        this.mouse.x = e.x;
        this.mouse.y = e.y;
      });
    }

    wrapText(text: string) {
      const gradient = this.context.createLinearGradient(
        0,
        0,
        this.canvasWidth,
        this.canvasHeight
      );
      gradient.addColorStop(0.3, "red");
      gradient.addColorStop(0.5, "fuchsia");
      gradient.addColorStop(0.7, "purple");
      this.context.fillStyle = gradient;
      this.context.textAlign = "center";
      this.context.textBaseline = "middle";
      this.context.lineWidth = 1;
      this.context.strokeStyle = "red";
      this.context.font = this.fontSize + "px Lobster";

      let linesArray = [];
      let words = text.split(" ");
      let lineCounter = 0;
      let line = "";
      for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i] + " ";
        if (this.context.measureText(testLine).width > this.maxTextWidth) {
          linesArray[lineCounter] = line;
          line = words[i] + " ";
          lineCounter++;
        } else {
          line = testLine;
        }
        linesArray[lineCounter] = line;
      }
      const textHeight = this.lineHeight * lineCounter;
      this.textY = this.canvasHeight / 2 - textHeight / 2;
      linesArray.forEach((el, index) => {
        this.context.fillText(
          el,
          this.textX,
          this.textY + index * this.lineHeight
        );
        this.context.strokeText(
          el,
          this.textX,
          this.textY + index * this.lineHeight
        );
      });
      this.convertToParticles();
    }

    convertToParticles() {
      this.particles = [];
      const pixels = this.context.getImageData(
        0,
        0,
        this.canvasWidth,
        this.canvasHeight
      ).data;
      this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      for (let y = 0; y < this.canvasHeight; y += this.gap) {
        for (let x = 0; x < this.canvasWidth; x += this.gap) {
          const index = (y * this.canvasWidth + x) * 4;
          const alpha = pixels[index + 3];
          if (alpha > 0) {
            const red = pixels[index];
            const green = pixels[index + 1];
            const blue = pixels[index + 2];
            const color = `rgb(${red}, ${green}, ${blue})`;
            this.particles.push(new Particle(this, x, y, color));
          }
        }
      }
    }
    render() {
      this.particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });
    }
    resize(width: number, height: number) {
      this.canvasWidth = width;
      this.canvasHeight = height;
      this.textX = this.canvasWidth / 2;
      this.textY = this.canvasHeight / 2;
      this.maxTextWidth = this.canvasWidth * 0.8;
    }
  }

  const effect = new Effect(ctx, canvas.width, canvas.height);
  effect.wrapText(effect.textInput.value);
  effect.render();

  function animate() {
    ctx?.clearRect(0, 0, canvas!.width, canvas!.height);
    effect.render();
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    effect.resize(canvas.width, canvas.height);
    effect.wrapText(effect.textInput.value);
  });
});
