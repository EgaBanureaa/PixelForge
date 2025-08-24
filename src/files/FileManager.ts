import { EventBus } from "../core/EventBus";
import { Document } from "../core/Document";
import { Layer } from "../layers/Layer";

export interface FileFormat {
  extension: string;
  mimeType: string;
  name: string;
  supportsLayers: boolean;
}

export class FileManager {
  private eventBus: EventBus;
  private supportedFormats: FileFormat[] = [
    {
      extension: "png",
      mimeType: "image/png",
      name: "PNG Image",
      supportsLayers: false,
    },
    {
      extension: "jpg",
      mimeType: "image/jpeg",
      name: "JPEG Image",
      supportsLayers: false,
    },
    {
      extension: "webp",
      mimeType: "image/webp",
      name: "WebP Image",
      supportsLayers: false,
    },
    {
      extension: "bmp",
      mimeType: "image/bmp",
      name: "BMP Image",
      supportsLayers: false,
    },
    {
      extension: "gif",
      mimeType: "image/gif",
      name: "GIF Image",
      supportsLayers: false,
    },
    {
      extension: "pxf",
      mimeType: "application/json",
      name: "PixelForge Project",
      supportsLayers: true,
    },
  ];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public initialize(): void {
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  private setupEventListeners(): void {
    this.eventBus.on("file:new", () => {
      this.createNewDocument();
    });

    this.eventBus.on("file:open", () => {
      this.openFile();
    });

    this.eventBus.on("file:save", () => {
      this.saveFile();
    });

    this.eventBus.on("file:save-as", () => {
      this.saveFileAs();
    });

    this.eventBus.on(
      "file:export",
      (options: { format: string; quality: number }) => {
        this.exportFile(options.format, options.quality);
      },
    );

    this.eventBus.on("file:import-image", () => {
      this.importImage();
    });

    this.eventBus.on(
      "file:get-formats",
      (callback: (formats: FileFormat[]) => void) => {
        callback(this.supportedFormats);
      },
    );
  }

  private setupDragAndDrop(): void {
    const canvasContainer = document.getElementById("canvas-container");
    if (!canvasContainer) return;

    canvasContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasContainer.classList.add("drag-over");
    });

    canvasContainer.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasContainer.classList.remove("drag-over");
    });

    canvasContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasContainer.classList.remove("drag-over");

      const files = Array.from(e.dataTransfer?.files || []);
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          this.loadImageFile(file);
        } else if (file.name.endsWith(".pxf")) {
          this.loadProjectFile(file);
        }
      });
    });
  }

  private createNewDocument(): void {
    // This will be handled by the new document modal
    this.eventBus.emit("ui:open-modal", "new-document-modal");
  }

  private openFile(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = this.getSupportedFileTypes();
    input.multiple = false;

    input.addEventListener("change", (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.type.startsWith("image/")) {
        this.loadImageFile(file);
      } else if (file.name.endsWith(".pxf")) {
        this.loadProjectFile(file);
      }
    });

    input.click();
  }

  private saveFile(): void {
    this.eventBus.emit("document:get-active", (activeDocument: Document) => {
      if (!activeDocument) {
        this.eventBus.emit(
          "ui:show-notification",
          "No document to save",
          "warning",
        );
        return;
      }

      if (activeDocument.filePath) {
        // Save to existing file
        this.saveProjectFile(activeDocument, activeDocument.filePath);
      } else {
        // Save as new file
        this.saveFileAs();
      }
    });
  }

  private saveFileAs(): void {
    this.eventBus.emit("document:get-active", (activeDocument: Document) => {
      if (!activeDocument) {
        this.eventBus.emit(
          "ui:show-notification",
          "No document to save",
          "warning",
        );
        return;
      }

      const fileName = `${activeDocument.name}.pxf`;
      this.saveProjectFile(activeDocument, fileName);
    });
  }

  private exportFile(format: string, quality: number = 90): void {
    this.eventBus.emit("document:get-active", (activeDocument: Document) => {
      if (!activeDocument) {
        this.eventBus.emit(
          "ui:show-notification",
          "No document to export",
          "warning",
        );
        return;
      }

      const formatInfo = this.supportedFormats.find(
        (f) => f.extension === format,
      );

      if (!formatInfo) {
        this.eventBus.emit(
          "ui:show-notification",
          "Unsupported format",
          "error",
        );
        return;
      }

      // For formats that don't support quality, use the basic export
      let dataUrl: string;
      if (format === "jpg" || format === "jpeg" || format === "webp") {
        // Create a temporary canvas to apply quality
        const tempCanvas = this.createTempCanvas(activeDocument);
        if (format === "jpg" || format === "jpeg") {
          dataUrl = tempCanvas.toDataURL("image/jpeg", quality / 100);
        } else {
          dataUrl = tempCanvas.toDataURL("image/webp", quality / 100);
        }
      } else {
        dataUrl = activeDocument.exportToDataURL(formatInfo.mimeType);
      }

      this.downloadFile(dataUrl, `${activeDocument.name}.${format}`);
      this.eventBus.emit(
        "ui:show-notification",
        `Exported as ${format.toUpperCase()}`,
        "success",
      );
    });
  }

  private createTempCanvas(document: Document): HTMLCanvasElement {
    const canvas = window.document.createElement("canvas");
    canvas.width = document.width;
    canvas.height = document.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    // Draw all visible layers
    document.layers.forEach((layer) => {
      if (layer.visible) {
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation =
          layer.blendMode as GlobalCompositeOperation;
        ctx.drawImage(layer.canvas, layer.x, layer.y);
      }
    });

    return canvas;
  }

  private importImage(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.addEventListener("change", (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      files.forEach((file) => this.loadImageFile(file, true));
    });

    input.click();
  }

  private loadImageFile(file: File, asNewLayer: boolean = false): void {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (asNewLayer) {
          this.addImageAsLayer(img, file.name);
        } else {
          this.createDocumentFromImage(img, file.name);
        }
      };
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  }

  private createDocumentFromImage(
    img: HTMLImageElement,
    fileName: string,
  ): void {
    const name = fileName.replace(/\.[^/.]+$/, ""); // Remove extension

    this.eventBus.emit("document:create", {
      name,
      width: img.width,
      height: img.height,
      backgroundColor: "transparent",
    });

    // Wait for document creation and add image
    setTimeout(() => {
      this.addImageAsLayer(img, "Background");
    }, 100);
  }

  private addImageAsLayer(img: HTMLImageElement, layerName: string): void {
    this.eventBus.emit("document:get-active", (activeDocument: Document) => {
      if (!activeDocument) return;

      // Create new layer
      this.eventBus.emit("layer:add-with-image", {
        name: layerName,
        image: img,
      });

      this.eventBus.emit(
        "ui:show-notification",
        `Added ${layerName} layer`,
        "success",
      );
    });
  }

  private loadProjectFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string);
        this.loadProject(projectData, file.name);
      } catch (error) {
        this.eventBus.emit(
          "ui:show-notification",
          "Failed to load project file",
          "error",
        );
        console.error("Failed to parse project file:", error);
      }
    };

    reader.readAsText(file);
  }

  private loadProject(projectData: any, fileName: string): void {
    try {
      // Validate project data
      if (!this.validateProjectData(projectData)) {
        throw new Error("Invalid project file format");
      }

      // Create document
      const document = new Document({
        name: projectData.name || fileName.replace(".pxf", ""),
        width: projectData.width,
        height: projectData.height,
        background: projectData.background || "white",
        resolution: projectData.resolution || 72,
      });

      // Set file path
      document.filePath = fileName;

      // Load layers
      const loadPromises = projectData.layers.map((layerData: any) => {
        return this.loadLayerFromData(layerData);
      });

      Promise.all(loadPromises).then((layers) => {
        document.layers = layers;
        document.activeLayerIndex = projectData.activeLayerIndex || 0;

        this.eventBus.emit("document:loaded", document);
        this.eventBus.emit(
          "ui:show-notification",
          `Loaded ${fileName}`,
          "success",
        );
      });
    } catch (error) {
      this.eventBus.emit(
        "ui:show-notification",
        "Failed to load project",
        "error",
      );
      console.error("Failed to load project:", error);
    }
  }

  private validateProjectData(data: any): boolean {
    return (
      data &&
      typeof data.name === "string" &&
      typeof data.width === "number" &&
      typeof data.height === "number" &&
      Array.isArray(data.layers) &&
      data.version
    );
  }

  private loadLayerFromData(layerData: any): Promise<Layer> {
    return new Promise((resolve) => {
      // Create layer
      const layer = new Layer({
        name: layerData.name,
        width: layerData.width,
        height: layerData.height,
        isBackground: layerData.isBackground,
      });

      // Set properties
      layer.visible = layerData.visible;
      layer.opacity = layerData.opacity;
      layer.blendMode = layerData.blendMode;
      layer.locked = layerData.locked;
      layer.x = layerData.x;
      layer.y = layerData.y;

      // Load image data
      if (layerData.imageData) {
        const img = new Image();
        img.onload = () => {
          layer.context.drawImage(img, 0, 0);
          resolve(layer);
        };
        img.src = layerData.imageData;
      } else {
        resolve(layer);
      }
    });
  }

  private saveProjectFile(document: Document, fileName: string): void {
    const projectData = {
      version: "1.0",
      name: document.name,
      width: document.width,
      height: document.height,
      activeLayerIndex: document.activeLayerIndex,
      layers: document.layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        width: layer.canvas.width,
        height: layer.canvas.height,
        visible: layer.visible,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        locked: layer.locked,
        isBackground: layer.isBackground,
        x: layer.x,
        y: layer.y,
        imageData: layer.canvas.toDataURL("image/png"),
      })),
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    this.downloadBlob(dataBlob, fileName);
    document.filePath = fileName;

    this.eventBus.emit("ui:show-notification", `Saved ${fileName}`, "success");
    this.eventBus.emit("document:saved", document);
  }

  private downloadFile(dataUrl: string, fileName: string): void {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  private getSupportedFileTypes(): string {
    return (
      this.supportedFormats.map((format) => `.${format.extension}`).join(",") +
      ",image/*"
    );
  }

  // Auto-save functionality
  public enableAutoSave(intervalMinutes: number = 5): void {
    setInterval(
      () => {
        this.eventBus.emit(
          "document:get-active",
          (activeDocument: Document) => {
            if (activeDocument && activeDocument.filePath) {
              this.autoSave(activeDocument);
            }
          },
        );
      },
      intervalMinutes * 60 * 1000,
    );
  }

  private autoSave(document: Document): void {
    const autoSaveFileName = `${document.name}_autosave.pxf`;
    this.saveProjectFile(document, autoSaveFileName);
    this.eventBus.emit("ui:show-notification", "Auto-saved", "info");
  }

  // Recent files management
  private recentFiles: string[] = [];
  private maxRecentFiles: number = 10;

  public addToRecentFiles(filePath: string): void {
    // Remove if already exists
    this.recentFiles = this.recentFiles.filter((path) => path !== filePath);

    // Add to beginning
    this.recentFiles.unshift(filePath);

    // Limit to max
    this.recentFiles = this.recentFiles.slice(0, this.maxRecentFiles);

    // Save to localStorage
    localStorage.setItem(
      "pixelforge_recent_files",
      JSON.stringify(this.recentFiles),
    );

    this.eventBus.emit("file:recent-files-updated", this.recentFiles);
  }

  public getRecentFiles(): string[] {
    if (this.recentFiles.length === 0) {
      const stored = localStorage.getItem("pixelforge_recent_files");
      if (stored) {
        this.recentFiles = JSON.parse(stored);
      }
    }
    return this.recentFiles;
  }

  public clearRecentFiles(): void {
    this.recentFiles = [];
    localStorage.removeItem("pixelforge_recent_files");
    this.eventBus.emit("file:recent-files-updated", this.recentFiles);
  }

  // File format validation
  public isValidImageFile(file: File): boolean {
    return file.type.startsWith("image/");
  }

  public isValidProjectFile(file: File): boolean {
    return file.name.endsWith(".pxf");
  }

  // Batch operations
  public exportAllLayers(format: string = "png"): void {
    this.eventBus.emit("document:get-active", (activeDocument: Document) => {
      if (!activeDocument) return;

      activeDocument.layers.forEach((layer, index) => {
        const dataUrl = layer.canvas.toDataURL(`image/${format}`);
        this.downloadFile(
          dataUrl,
          `${activeDocument.name}_layer_${index + 1}_${layer.name}.${format}`,
        );
      });

      this.eventBus.emit(
        "ui:show-notification",
        `Exported ${activeDocument.layers.length} layers`,
        "success",
      );
    });
  }

  // Image optimization
  public optimizeForWeb(maxWidth: number = 1920, quality: number = 85): void {
    this.eventBus.emit("document:get-active", (activeDocument: Document) => {
      if (!activeDocument) return;

      const canvas = this.createTempCanvas(activeDocument);

      // Calculate new dimensions
      let { width, height } = canvas;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create optimized canvas
      const optimizedCanvas = window.document.createElement("canvas");
      optimizedCanvas.width = width;
      optimizedCanvas.height = height;
      const ctx = optimizedCanvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(canvas, 0, 0, width, height);
        const dataUrl = optimizedCanvas.toDataURL("image/jpeg", quality / 100);
        this.downloadFile(dataUrl, `${activeDocument.name}_optimized.jpg`);

        this.eventBus.emit(
          "ui:show-notification",
          "Exported optimized version",
          "success",
        );
      }
    });
  }
}
