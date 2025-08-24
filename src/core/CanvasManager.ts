import { EventBus } from "./EventBus";
import { Document } from "./Document";
import { gsap } from "gsap";

export class CanvasManager {
  private eventBus: EventBus;
  private canvases: Map<string, HTMLCanvasElement>;
  private contexts: Map<string, CanvasRenderingContext2D>;
  private activeCanvasId: string | null;
  private canvasContainer: HTMLElement;
  private activeTool: string;
  private isDrawing: boolean;
  private lastPoint: { x: number; y: number } | null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.canvases = new Map();
    this.contexts = new Map();
    this.activeCanvasId = null;
    this.activeTool = "select";
    this.isDrawing = false;
    this.lastPoint = null;

    const container = document.getElementById("canvas-container");
    if (!container) {
      throw new Error("Canvas container not found");
    }
    this.canvasContainer = container;
  }

  public createCanvas(doc: Document): void {
    // Clear existing content
    this.canvasContainer.innerHTML = "";

    // Create canvas workspace
    const workspace = window.document.createElement("div");
    workspace.className = "canvas-workspace";
    workspace.id = `workspace-${doc.id}`;

    const canvasWrapper = window.document.createElement("div");
    canvasWrapper.className = "canvas-wrapper";
    canvasWrapper.style.width = `${doc.width}px`;
    canvasWrapper.style.height = `${doc.height}px`;

    const canvas = window.document.createElement("canvas");
    canvas.id = `canvas-${doc.id}`;
    canvas.width = doc.width;
    canvas.height = doc.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    canvasWrapper.appendChild(canvas);
    workspace.appendChild(canvasWrapper);
    this.canvasContainer.appendChild(workspace);

    // Store canvas and context references
    this.canvases.set(doc.id, canvas);
    this.contexts.set(doc.id, ctx);
    this.activeCanvasId = doc.id;

    // Set up canvas event listeners
    this.setupCanvasEvents(canvas, ctx, doc);

    // Animate canvas appearance
    gsap.fromTo(
      canvasWrapper,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" },
    );

    // Update canvas info
    this.updateCanvasInfo(doc);
  }

  private setupCanvasEvents(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    doc: Document,
  ): void {
    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPointer = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    canvas.addEventListener("mousedown", (e) => {
      const pointer = getPointer(e);
      drawing = true;
      lastX = pointer.x;
      lastY = pointer.y;

      this.isDrawing = true;
      this.lastPoint = pointer;

      switch (this.activeTool) {
        case "brush":
          this.startBrushStroke(ctx, pointer);
          break;
        case "pencil":
          this.startPencilStroke(ctx, pointer);
          break;
        case "eraser":
          this.startEraserStroke(ctx, pointer);
          break;
      }

      this.eventBus.emit("canvas:mouse-down", {
        pointer,
        document: doc,
        tool: this.activeTool,
      });
    });

    canvas.addEventListener("mousemove", (e) => {
      if (!drawing) return;

      const pointer = getPointer(e);

      switch (this.activeTool) {
        case "brush":
          this.continueBrushStroke(ctx, lastX, lastY, pointer.x, pointer.y);
          break;
        case "pencil":
          this.continuePencilStroke(ctx, lastX, lastY, pointer.x, pointer.y);
          break;
        case "eraser":
          this.continueEraserStroke(ctx, lastX, lastY, pointer.x, pointer.y);
          break;
      }

      lastX = pointer.x;
      lastY = pointer.y;
      this.lastPoint = pointer;

      this.eventBus.emit("canvas:mouse-move", {
        pointer,
        document: doc,
        tool: this.activeTool,
      });
    });

    canvas.addEventListener("mouseup", () => {
      drawing = false;
      this.isDrawing = false;
      this.lastPoint = null;

      this.eventBus.emit("canvas:mouse-up", {
        document: doc,
        tool: this.activeTool,
      });
      this.eventBus.emit("document:modified", doc);
    });

    canvas.addEventListener("mouseleave", () => {
      drawing = false;
      this.isDrawing = false;
    });

    // Handle eyedropper tool
    canvas.addEventListener("click", (e) => {
      if (this.activeTool === "eyedropper") {
        const pointer = getPointer(e);
        const imageData = ctx.getImageData(pointer.x, pointer.y, 1, 1);
        const [r, g, b] = imageData.data;
        const color = `rgb(${r}, ${g}, ${b})`;
        this.eventBus.emit("color:picked", color);
      }
    });
  }

  private startBrushStroke(
    ctx: CanvasRenderingContext2D,
    pointer: { x: number; y: number },
  ): void {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = this.getBrushSize();
    ctx.strokeStyle = this.getBrushColor();
    ctx.globalAlpha = this.getBrushOpacity();
    ctx.globalCompositeOperation = "source-over";

    ctx.beginPath();
    ctx.moveTo(pointer.x, pointer.y);
  }

  private continueBrushStroke(
    ctx: CanvasRenderingContext2D,
    lastX: number,
    lastY: number,
    x: number,
    y: number,
  ): void {
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  private startPencilStroke(
    ctx: CanvasRenderingContext2D,
    pointer: { x: number; y: number },
  ): void {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.getBrushColor();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    ctx.beginPath();
    ctx.moveTo(pointer.x, pointer.y);
  }

  private continuePencilStroke(
    ctx: CanvasRenderingContext2D,
    lastX: number,
    lastY: number,
    x: number,
    y: number,
  ): void {
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  private startEraserStroke(
    ctx: CanvasRenderingContext2D,
    pointer: { x: number; y: number },
  ): void {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = this.getBrushSize();
    ctx.globalCompositeOperation = "destination-out";

    ctx.beginPath();
    ctx.moveTo(pointer.x, pointer.y);
  }

  private continueEraserStroke(
    ctx: CanvasRenderingContext2D,
    lastX: number,
    lastY: number,
    x: number,
    y: number,
  ): void {
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  public setActiveTool(tool: string): void {
    this.activeTool = tool;
    const canvas = this.getActiveCanvas();

    if (canvas) {
      switch (tool) {
        case "hand":
          canvas.style.cursor = "grab";
          break;
        case "zoom":
          canvas.style.cursor = "zoom-in";
          break;
        case "eyedropper":
          canvas.style.cursor = "crosshair";
          break;
        default:
          canvas.style.cursor = "crosshair";
          break;
      }
    }

    this.eventBus.emit("tool:activated", tool);
  }

  public getActiveCanvas(): HTMLCanvasElement | null {
    return this.activeCanvasId
      ? this.canvases.get(this.activeCanvasId) || null
      : null;
  }

  public getActiveContext(): CanvasRenderingContext2D | null {
    return this.activeCanvasId
      ? this.contexts.get(this.activeCanvasId) || null
      : null;
  }

  public switchToCanvas(documentId: string): void {
    // Hide all workspaces
    const workspaces =
      this.canvasContainer.querySelectorAll(".canvas-workspace");
    workspaces.forEach((workspace) => {
      (workspace as HTMLElement).style.display = "none";
    });

    // Show target workspace
    const targetWorkspace = window.document.getElementById(
      `workspace-${documentId}`,
    );
    if (targetWorkspace) {
      targetWorkspace.style.display = "flex";
      this.activeCanvasId = documentId;
    }
  }

  public removeCanvas(documentId: string): void {
    this.canvases.delete(documentId);
    this.contexts.delete(documentId);

    const workspace = window.document.getElementById(`workspace-${documentId}`);
    if (workspace) {
      workspace.remove();
    }

    if (this.activeCanvasId === documentId) {
      this.activeCanvasId = null;
    }
  }

  public showWelcomeScreen(): void {
    this.canvasContainer.innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-gray-500">
          <svg class="w-24 h-24 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
          <p class="text-lg mb-2">Welcome to PixelForge</p>
          <p class="text-sm">Create a new document or open an existing file to get started</p>
          <div class="mt-4 space-x-2">
            <button class="create-new-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">Create New</button>
            <button class="open-file-btn px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white">Open File</button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for welcome screen buttons
    const createNewBtn = this.canvasContainer.querySelector(
      ".create-new-btn",
    ) as HTMLButtonElement;
    const openFileBtn = this.canvasContainer.querySelector(
      ".open-file-btn",
    ) as HTMLButtonElement;

    if (createNewBtn) {
      createNewBtn.addEventListener("click", () => {
        this.eventBus.emit("ui:show-new-document-modal");
      });
    }

    if (openFileBtn) {
      openFileBtn.addEventListener("click", () => {
        this.eventBus.emit("file:open");
      });
    }
  }

  private updateCanvasInfo(doc: Document): void {
    const canvasInfo = window.document.getElementById("canvas-info");
    if (canvasInfo) {
      canvasInfo.textContent = `${doc.width} × ${doc.height}px`;
    }
  }

  private getBrushSize(): number {
    const brushSizeSlider = window.document.getElementById(
      "brush-size",
    ) as HTMLInputElement;
    return brushSizeSlider ? parseInt(brushSizeSlider.value) : 10;
  }

  private getBrushColor(): string {
    const foregroundColor = window.document.getElementById(
      "foreground-color",
    ) as HTMLElement;
    if (foregroundColor && foregroundColor.style.backgroundColor) {
      return foregroundColor.style.backgroundColor;
    }
    return "#000000";
  }

  private getBrushOpacity(): number {
    const brushOpacitySlider = window.document.getElementById(
      "brush-opacity",
    ) as HTMLInputElement;
    return brushOpacitySlider ? parseInt(brushOpacitySlider.value) / 100 : 1;
  }

  public zoomIn(): void {
    const canvas = this.getActiveCanvas();
    if (canvas) {
      const currentScale =
        parseFloat(
          canvas.style.transform.replace(/.*scale\(([^)]+)\).*/, "$1"),
        ) || 1;
      const newScale = Math.min(currentScale * 1.2, 5);
      canvas.style.transform = `scale(${newScale})`;
      this.updateZoomLevel(newScale);
    }
  }

  public zoomOut(): void {
    const canvas = this.getActiveCanvas();
    if (canvas) {
      const currentScale =
        parseFloat(
          canvas.style.transform.replace(/.*scale\(([^)]+)\).*/, "$1"),
        ) || 1;
      const newScale = Math.max(currentScale / 1.2, 0.1);
      canvas.style.transform = `scale(${newScale})`;
      this.updateZoomLevel(newScale);
    }
  }

  public zoomToFit(): void {
    const canvas = this.getActiveCanvas();
    if (canvas) {
      canvas.style.transform = "scale(1)";
      this.updateZoomLevel(1);
    }
  }

  private updateZoomLevel(zoom: number): void {
    const zoomLevel = window.document.getElementById("zoom-level");
    if (zoomLevel) {
      zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    }
  }

  public drawRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: boolean = true,
  ): void {
    const ctx = this.getActiveContext();
    if (ctx) {
      ctx.strokeStyle = this.getBrushColor();
      ctx.fillStyle = this.getBrushColor();
      ctx.lineWidth = this.getBrushSize();

      if (fill) {
        ctx.fillRect(x, y, width, height);
      } else {
        ctx.strokeRect(x, y, width, height);
      }
    }
  }

  public drawCircle(
    x: number,
    y: number,
    radius: number,
    fill: boolean = true,
  ): void {
    const ctx = this.getActiveContext();
    if (ctx) {
      ctx.strokeStyle = this.getBrushColor();
      ctx.fillStyle = this.getBrushColor();
      ctx.lineWidth = this.getBrushSize();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);

      if (fill) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    }
  }

  public drawLine(x1: number, y1: number, x2: number, y2: number): void {
    const ctx = this.getActiveContext();
    if (ctx) {
      ctx.strokeStyle = this.getBrushColor();
      ctx.lineWidth = this.getBrushSize();
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}
