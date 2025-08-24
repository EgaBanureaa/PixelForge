export interface LayerOptions {
  name: string;
  width: number;
  height: number;
  isBackground?: boolean;
}

export class Layer {
  public readonly id: string;
  public name: string;
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public visible: boolean;
  public opacity: number;
  public blendMode: string;
  public locked: boolean;
  public isBackground: boolean;
  public x: number;
  public y: number;

  constructor(options: LayerOptions) {
    this.id = this.generateId();
    this.name = options.name;
    this.visible = true;
    this.opacity = 100;
    this.blendMode = "normal";
    this.locked = false;
    this.isBackground = options.isBackground || false;
    this.x = 0;
    this.y = 0;

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = options.width;
    this.canvas.height = options.height;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create canvas context");
    }
    this.context = ctx;
  }

  private generateId(): string {
    return (
      "layer_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  public getContext(): CanvasRenderingContext2D {
    return this.context;
  }

  public setVisibility(visible: boolean): void {
    this.visible = visible;
  }

  public setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(100, opacity));
  }

  public setBlendMode(mode: string): void {
    this.blendMode = mode;
  }

  public setLocked(locked: boolean): void {
    this.locked = locked;
  }

  public move(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public resize(width: number, height: number): void {
    const imageData = this.context.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.putImageData(imageData, 0, 0);
  }

  public clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public duplicate(): Layer {
    const duplicated = new Layer({
      name: this.name + " copy",
      width: this.canvas.width,
      height: this.canvas.height,
    });

    // Copy properties
    duplicated.visible = this.visible;
    duplicated.opacity = this.opacity;
    duplicated.blendMode = this.blendMode;
    duplicated.locked = this.locked;
    duplicated.x = this.x;
    duplicated.y = this.y;

    // Copy canvas content
    duplicated.context.drawImage(this.canvas, 0, 0);

    return duplicated;
  }

  public mergeWith(otherLayer: Layer): void {
    this.context.globalAlpha = otherLayer.opacity / 100;
    this.context.globalCompositeOperation =
      otherLayer.blendMode as GlobalCompositeOperation;
    this.context.drawImage(otherLayer.canvas, otherLayer.x, otherLayer.y);

    // Reset composite operation
    this.context.globalAlpha = 1;
    this.context.globalCompositeOperation = "source-over";
  }

  public getImageData(): ImageData {
    return this.context.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
  }

  public putImageData(imageData: ImageData): void {
    this.context.putImageData(imageData, 0, 0);
  }

  public getThumbnail(size: number = 32): string {
    const thumbnailCanvas = document.createElement("canvas");
    thumbnailCanvas.width = size;
    thumbnailCanvas.height = size;
    const thumbnailCtx = thumbnailCanvas.getContext("2d");

    if (thumbnailCtx) {
      thumbnailCtx.drawImage(
        this.canvas,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
        0,
        0,
        size,
        size,
      );
    }

    return thumbnailCanvas.toDataURL();
  }

  public applyFilter(
    filterFunction: (imageData: ImageData) => ImageData,
  ): void {
    const imageData = this.getImageData();
    const filteredData = filterFunction(imageData);
    this.putImageData(filteredData);
  }

  public transform(matrix: DOMMatrix): void {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      tempCtx.drawImage(this.canvas, 0, 0);
      this.clear();
      this.context.setTransform(matrix);
      this.context.drawImage(tempCanvas, 0, 0);
      this.context.resetTransform();
    }
  }

  public crop(x: number, y: number, width: number, height: number): void {
    const imageData = this.context.getImageData(x, y, width, height);
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.putImageData(imageData, 0, 0);
  }
}
