import { Layer } from "../layers/Layer";

export interface DocumentOptions {
  width: number;
  height: number;
  name: string;
  background: string;
  resolution: number;
}

export class Document {
  public readonly id: string;
  public name: string;
  public width: number;
  public height: number;
  public resolution: number;
  public background: string;
  public layers: Layer[];
  public activeLayerIndex: number;
  public saved: boolean;
  public filePath?: string;
  public canvas?: HTMLCanvasElement;
  public context?: CanvasRenderingContext2D;

  constructor(options: DocumentOptions) {
    this.id = this.generateId();
    this.name = options.name;
    this.width = options.width;
    this.height = options.height;
    this.resolution = options.resolution;
    this.background = options.background;
    this.layers = [];
    this.activeLayerIndex = -1;
    this.saved = false;

    // Create default background layer
    this.createBackgroundLayer();
  }

  private generateId(): string {
    return "doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  private createBackgroundLayer(): void {
    const backgroundLayer = new Layer({
      name: "Background",
      width: this.width,
      height: this.height,
      isBackground: true,
    });

    // Fill with background color
    const ctx = backgroundLayer.getContext();
    if (ctx) {
      if (this.background === "transparent") {
        // Keep transparent
      } else {
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, this.width, this.height);
      }
    }

    this.layers.push(backgroundLayer);
    this.activeLayerIndex = 0;
  }

  public addLayer(layer: Layer): void {
    this.layers.push(layer);
    this.activeLayerIndex = this.layers.length - 1;
    this.markAsModified();
  }

  public removeLayer(layerId: string): void {
    const index = this.layers.findIndex((layer) => layer.id === layerId);
    if (index > -1 && !this.layers[index].isBackground) {
      this.layers.splice(index, 1);
      if (this.activeLayerIndex >= this.layers.length) {
        this.activeLayerIndex = this.layers.length - 1;
      }
      this.markAsModified();
    }
  }

  public moveLayer(layerId: string, newIndex: number): void {
    const currentIndex = this.layers.findIndex((layer) => layer.id === layerId);
    if (currentIndex > -1 && newIndex >= 0 && newIndex < this.layers.length) {
      const layer = this.layers.splice(currentIndex, 1)[0];
      this.layers.splice(newIndex, 0, layer);
      this.activeLayerIndex = newIndex;
      this.markAsModified();
    }
  }

  public getActiveLayer(): Layer | null {
    return this.layers[this.activeLayerIndex] || null;
  }

  public setActiveLayer(layerId: string): void {
    const index = this.layers.findIndex((layer) => layer.id === layerId);
    if (index > -1) {
      this.activeLayerIndex = index;
    }
  }

  public getLayer(layerId: string): Layer | null {
    return this.layers.find((layer) => layer.id === layerId) || null;
  }

  public duplicateLayer(layerId: string): Layer | null {
    const layer = this.getLayer(layerId);
    if (layer) {
      const duplicatedLayer = layer.duplicate();
      duplicatedLayer.name = `${layer.name} copy`;
      this.addLayer(duplicatedLayer);
      return duplicatedLayer;
    }
    return null;
  }

  public mergeDown(layerId: string): void {
    const layerIndex = this.layers.findIndex((layer) => layer.id === layerId);
    if (layerIndex > 0) {
      const topLayer = this.layers[layerIndex];
      const bottomLayer = this.layers[layerIndex - 1];

      // Merge top layer into bottom layer
      bottomLayer.mergeWith(topLayer);

      // Remove top layer
      this.layers.splice(layerIndex, 1);
      this.activeLayerIndex = layerIndex - 1;
      this.markAsModified();
    }
  }

  public flattenImage(): void {
    if (this.layers.length <= 1) return;

    const flattenedLayer = new Layer({
      name: "Flattened",
      width: this.width,
      height: this.height,
    });

    const ctx = flattenedLayer.getContext();
    if (ctx) {
      // Draw all visible layers onto the flattened layer
      this.layers.forEach((layer) => {
        if (layer.visible) {
          ctx.globalAlpha = layer.opacity / 100;
          ctx.globalCompositeOperation =
            layer.blendMode as GlobalCompositeOperation;
          ctx.drawImage(layer.canvas, 0, 0);
        }
      });
    }

    // Replace all layers with the flattened layer
    this.layers = [flattenedLayer];
    this.activeLayerIndex = 0;
    this.markAsModified();
  }

  public exportToDataURL(format: string = "image/png"): string {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      // Draw all visible layers
      this.layers.forEach((layer) => {
        if (layer.visible) {
          tempCtx.globalAlpha = layer.opacity / 100;
          tempCtx.globalCompositeOperation =
            layer.blendMode as GlobalCompositeOperation;
          tempCtx.drawImage(layer.canvas, 0, 0);
        }
      });
    }

    return tempCanvas.toDataURL(format);
  }

  public markAsModified(): void {
    this.saved = false;
  }

  public markAsSaved(): void {
    this.saved = true;
  }

  public getDisplayName(): string {
    return this.saved ? this.name : `${this.name}*`;
  }

  public resize(newWidth: number, newHeight: number): void {
    this.width = newWidth;
    this.height = newHeight;

    // Resize all layers
    this.layers.forEach((layer) => {
      layer.resize(newWidth, newHeight);
    });

    this.markAsModified();
  }
}
