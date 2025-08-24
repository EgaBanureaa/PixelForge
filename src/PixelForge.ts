import { EventBus } from "./core/EventBus";
import { Document } from "./core/Document";
import { CanvasManager } from "./core/CanvasManager";
import { ToolManager } from "./tools/ToolManager";
import { LayerManager } from "./layers/LayerManager";
import { UIManager } from "./ui/UIManager";
import { FilterManager } from "./filters/FilterManager";
import { HistoryManager } from "./history/HistoryManager";
import { FileManager } from "./files/FileManager";
import { Layer } from "./layers/Layer";

export class PixelForge {
  private eventBus: EventBus;
  private canvasManager: CanvasManager;
  private toolManager: ToolManager;
  private layerManager: LayerManager;
  private uiManager: UIManager;
  private filterManager: FilterManager;
  private historyManager: HistoryManager;
  private fileManager: FileManager;

  private documents: Map<string, Document> = new Map();
  private activeDocumentId: string | null = null;
  private canvasZoom = 1; // Track canvas zoom level
  private zoomMin = 0.1; // 10% minimum zoom
  private zoomMax = 10; // 1000% maximum zoom

  constructor() {
    this.eventBus = new EventBus();

    // Initialize managers
    this.canvasManager = new CanvasManager(this.eventBus);
    this.toolManager = new ToolManager(this.eventBus);
    this.layerManager = new LayerManager(this.eventBus);
    this.uiManager = new UIManager(this.eventBus);
    this.filterManager = new FilterManager(this.eventBus);
    this.historyManager = new HistoryManager(this.eventBus);
    this.fileManager = new FileManager(this.eventBus);
  }

  public async initialize(): Promise<void> {
    console.log("🎨 Initializing PixelForge...");

    try {
      // Setup event listeners first
      this.setupCoreEventListeners();

      // Initialize all managers
      await this.initializeManagers();

      // Create initial document
      this.createInitialDocument();

      console.log("✅ PixelForge initialized successfully!");

      // Show welcome notification
      this.uiManager.showNotification("Welcome to PixelForge! 🎨", "success");
    } catch (error) {
      console.error("❌ Failed to initialize PixelForge:", error);
      this.uiManager.showNotification(
        "Failed to initialize application",
        "error",
      );
    }
  }

  private setupCoreEventListeners(): void {
    // Document management
    this.eventBus.on("document:create", (options: any) => {
      this.createDocument(options);
    });

    this.eventBus.on("document:close", (documentId?: string) => {
      this.closeDocument(documentId);
    });

    this.eventBus.on("document:set-active", (documentId: string) => {
      this.setActiveDocument(documentId);
    });

    this.eventBus.on(
      "document:get-active",
      (callback: (doc: Document | null) => void) => {
        callback(this.getActiveDocument());
      },
    );

    this.eventBus.on("document:loaded", (document: Document) => {
      this.addDocument(document);
    });

    this.eventBus.on("document:saved", (document: Document) => {
      this.fileManager.addToRecentFiles(document.filePath || document.name);
    });

    this.eventBus.on("document:restore-state", (state: any) => {
      this.restoreDocumentState(state);
    });

    // Layer management integration
    this.eventBus.on("layer:get-active", (callback: (layer: any) => void) => {
      const activeDoc = this.getActiveDocument();
      if (activeDoc && activeDoc.layers[activeDoc.activeLayerIndex]) {
        callback(activeDoc.layers[activeDoc.activeLayerIndex]);
      } else {
        callback(null);
      }
    });

    this.eventBus.on("layer:add", () => {
      this.addLayer();
    });

    this.eventBus.on(
      "layer:add-with-image",
      (data: { name: string; image: HTMLImageElement }) => {
        this.addLayerWithImage(data.name, data.image);
      },
    );

    this.eventBus.on("layer:delete", () => {
      this.deleteActiveLayer();
    });

    this.eventBus.on("layer:duplicate", () => {
      this.duplicateActiveLayer();
    });

    this.eventBus.on("layer:set-active", (layerId: string) => {
      this.setActiveLayer(layerId);
    });

    this.eventBus.on("layer:toggle-visibility", (layerId: string) => {
      this.toggleLayerVisibility(layerId);
    });

    this.eventBus.on(
      "layer:rename",
      (data: { layerId: string; newName: string }) => {
        this.renameLayer(data.layerId, data.newName);
      },
    );

    this.eventBus.on("layer:opacity-changed", (opacity: number) => {
      this.setLayerOpacity(opacity);
    });

    this.eventBus.on("layer:blend-mode-changed", (blendMode: string) => {
      this.setLayerBlendMode(blendMode);
    });

    this.eventBus.on(
      "layer:reorder",
      (data: { draggedLayerId: string; targetLayerId: string }) => {
        this.reorderLayers(data.draggedLayerId, data.targetLayerId);
      },
    );

    this.eventBus.on("layers:refresh", () => {
      this.layerManager.refreshLayersList();
    });

    this.eventBus.on("canvas:restore-from-layers", () => {
      // Handle canvas restoration if needed
      const activeDoc = this.getActiveDocument();
      if (activeDoc) {
        this.canvasManager.createCanvas(activeDoc);
      }
    });

    // Auto-save functionality
    this.eventBus.on("document:auto-save", () => {
      this.autoSave();
    });

    // Error handling
    this.eventBus.on("error", (error: any) => {
      console.error("Application error:", error);
      this.uiManager.showNotification(
        error.message || "An error occurred",
        "error",
      );
    });

    // Setup zoom controls
    this.setupZoomControls();
  }

  private setupZoomControls(): void {
    // Setup zoom in button
    const zoomInBtn = document.getElementById("zoom-in");
    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", () => {
        this.zoomIn();
      });
    }

    // Setup zoom out button
    const zoomOutBtn = document.getElementById("zoom-out");
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", () => {
        this.zoomOut();
      });
    }

    // Setup zoom level click to reset
    const zoomLevel = document.getElementById("zoom-level");
    if (zoomLevel) {
      zoomLevel.addEventListener("click", () => {
        this.resetZoom();
      });
      zoomLevel.style.cursor = "pointer";
      zoomLevel.title = "Click to reset zoom to 100%";
    }

    // Initialize zoom display
    this.updateZoomDisplay();
  }

  private async initializeManagers(): Promise<void> {
    const managers = [
      { name: "Canvas Manager", manager: this.canvasManager },
      { name: "Tool Manager", manager: this.toolManager },
      { name: "Layer Manager", manager: this.layerManager },
      { name: "UI Manager", manager: this.uiManager },
      { name: "Filter Manager", manager: this.filterManager },
      { name: "History Manager", manager: this.historyManager },
      { name: "File Manager", manager: this.fileManager },
    ];

    for (const { name, manager } of managers) {
      try {
        console.log(`Initializing ${name}...`);
        if (
          "initialize" in manager &&
          typeof manager.initialize === "function"
        ) {
          manager.initialize();
        }
      } catch (error) {
        console.error(`Failed to initialize ${name}:`, error);
        throw error;
      }
    }
  }

  private createInitialDocument(): void {
    // Don't create initial document automatically
    // Let user create when they need it
    const canvasInfo = window.document.getElementById("canvas-info");
    if (canvasInfo) {
      canvasInfo.textContent = "No document open";
    }
  }

  private createDocument(options: any): void {
    const document = new Document({
      name: options.name,
      width: options.width,
      height: options.height,
      background: options.background || options.backgroundColor || "white",
      resolution: options.resolution || 72,
    });

    this.addDocument(document);
    this.historyManager.addState("Create Document");
  }

  private addDocument(document: Document): void {
    this.documents.set(document.id, document);
    this.setActiveDocument(document.id);

    // Add tab
    this.uiManager.addTab(document.id, document.name);

    // Update canvas
    this.canvasManager.createCanvas(document);

    // Refresh layers
    this.layerManager.refreshLayersList();

    this.eventBus.emit("document:added", document);
  }

  private closeDocument(documentId?: string): void {
    const targetId = documentId || this.activeDocumentId;
    if (!targetId) return;

    const document = this.documents.get(targetId);
    if (!document) return;

    // Check if document has unsaved changes
    if (!document.saved) {
      const shouldSave = confirm(
        `${document.name} has unsaved changes. Save before closing?`,
      );
      if (shouldSave) {
        this.eventBus.emit("file:save");
        return; // Don't close yet, wait for save to complete
      }
    }

    // Remove from documents
    this.documents.delete(targetId);

    // Remove tab
    this.uiManager.removeTab(targetId);

    // If this was the active document, switch to another or create new
    if (targetId === this.activeDocumentId) {
      const remainingDocuments = Array.from(this.documents.keys());
      if (remainingDocuments.length > 0) {
        this.setActiveDocument(remainingDocuments[0]);
      } else {
        this.activeDocumentId = null;
        this.createInitialDocument();
      }
    }

    this.eventBus.emit("document:closed", targetId);
  }

  private settingActiveDocument = false;

  private setActiveDocument(documentId: string): void {
    // Prevent infinite loop
    if (this.settingActiveDocument) return;
    this.settingActiveDocument = true;

    try {
      const document = this.documents.get(documentId);
      if (!document) return;

      this.activeDocumentId = documentId;

      // Update UI
      this.uiManager.setActiveTab(documentId);

      // Update canvas
      this.canvasManager.switchToCanvas(documentId);

      // Refresh layers panel
      this.layerManager.refreshLayersList();

      // Update canvas info
      this.updateCanvasInfo(document);

      // Reset zoom for new document
      this.canvasZoom = 1;
      this.updateZoomDisplay();
      this.applyCanvasZoom();

      this.eventBus.emit("document:activated", document);
    } finally {
      this.settingActiveDocument = false;
    }
  }

  private getActiveDocument(): Document | null {
    if (!this.activeDocumentId) return null;
    return this.documents.get(this.activeDocumentId) || null;
  }

  private addLayer(name?: string): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const layer = new Layer({
      name: name || `Layer ${activeDoc.layers.length + 1}`,
      width: activeDoc.width,
      height: activeDoc.height,
    });
    activeDoc.addLayer(layer);
    this.layerManager.refreshLayersList();

    this.eventBus.emit("layer:added", layer);
  }

  private addLayerWithImage(name: string, image: HTMLImageElement): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const layer = new Layer({
      name: name,
      width: activeDoc.width,
      height: activeDoc.height,
    });

    // Draw image onto layer
    const ctx = layer.context;
    ctx.drawImage(image, 0, 0);

    activeDoc.addLayer(layer);
    this.layerManager.refreshLayersList();

    this.eventBus.emit("layer:added", layer);
  }

  private deleteActiveLayer(): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc || activeDoc.layers.length <= 1) {
      this.uiManager.showNotification(
        "Cannot delete the last layer",
        "warning",
      );
      return;
    }

    const activeLayer = activeDoc.layers[activeDoc.activeLayerIndex];
    if (activeLayer.isBackground) {
      const shouldDelete = confirm(
        "Delete background layer? This cannot be undone.",
      );
      if (!shouldDelete) return;
    }

    activeDoc.removeLayer(activeLayer.id);
    this.layerManager.refreshLayersList();

    this.eventBus.emit("layer:deleted", activeLayer.id);
  }

  private duplicateActiveLayer(): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const activeLayer = activeDoc.layers[activeDoc.activeLayerIndex];
    const duplicatedLayer = activeDoc.duplicateLayer(activeLayer.id);

    this.layerManager.refreshLayersList();

    this.eventBus.emit("layer:duplicated", duplicatedLayer);
  }

  private setActiveLayer(layerId: string): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const layerIndex = activeDoc.layers.findIndex(
      (layer) => layer.id === layerId,
    );
    if (layerIndex !== -1) {
      activeDoc.activeLayerIndex = layerIndex;
      this.layerManager.refreshLayersList();
      this.eventBus.emit("layer:activated", activeDoc.layers[layerIndex]);
    }
  }

  private toggleLayerVisibility(layerId: string): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const layer = activeDoc.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.visible = !layer.visible;
      this.layerManager.refreshLayersList();
      this.eventBus.emit("layer:visibility-changed", {
        layerId,
        visible: layer.visible,
      });
    }
  }

  private renameLayer(layerId: string, newName: string): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const layer = activeDoc.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.name = newName;
      this.layerManager.refreshLayersList();
      this.eventBus.emit("layer:renamed", { layerId, newName });
    }
  }

  private setLayerOpacity(opacity: number): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const activeLayer = activeDoc.layers[activeDoc.activeLayerIndex];
    if (activeLayer) {
      activeLayer.opacity = opacity;
      this.eventBus.emit("layer:opacity-updated", {
        layerId: activeLayer.id,
        opacity,
      });
    }
  }

  private setLayerBlendMode(blendMode: string): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const activeLayer = activeDoc.layers[activeDoc.activeLayerIndex];
    if (activeLayer) {
      activeLayer.blendMode = blendMode;
      this.eventBus.emit("layer:blend-mode-updated", {
        layerId: activeLayer.id,
        blendMode,
      });
    }
  }

  private reorderLayers(draggedLayerId: string, targetLayerId: string): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const draggedIndex = activeDoc.layers.findIndex(
      (l) => l.id === draggedLayerId,
    );
    const targetIndex = activeDoc.layers.findIndex(
      (l) => l.id === targetLayerId,
    );

    if (
      draggedIndex !== -1 &&
      targetIndex !== -1 &&
      draggedIndex !== targetIndex
    ) {
      const [draggedLayer] = activeDoc.layers.splice(draggedIndex, 1);
      activeDoc.layers.splice(targetIndex, 0, draggedLayer);

      // Update active layer index if needed
      if (activeDoc.activeLayerIndex === draggedIndex) {
        activeDoc.activeLayerIndex = targetIndex;
      } else if (
        draggedIndex < activeDoc.activeLayerIndex &&
        targetIndex >= activeDoc.activeLayerIndex
      ) {
        activeDoc.activeLayerIndex--;
      } else if (
        draggedIndex > activeDoc.activeLayerIndex &&
        targetIndex <= activeDoc.activeLayerIndex
      ) {
        activeDoc.activeLayerIndex++;
      }

      this.layerManager.refreshLayersList();
      this.eventBus.emit("layer:reordered", { draggedLayerId, targetLayerId });
    }
  }

  private restoreDocumentState(state: any): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    activeDoc.layers = state.layers;
    activeDoc.activeLayerIndex = state.activeLayerIndex;
    activeDoc.width = state.width;
    activeDoc.height = state.height;

    this.canvasManager.createCanvas(activeDoc);
    this.layerManager.refreshLayersList();
  }

  private autoSave(): void {
    const activeDoc = this.getActiveDocument();
    if (activeDoc && !activeDoc.saved) {
      this.fileManager.enableAutoSave();
    }
  }

  // Public API methods
  public getVersion(): string {
    return "1.0.0";
  }

  // Simplified public methods for UI integration
  public createNewDocument(
    name?: string,
    width?: number,
    height?: number,
    background?: string,
    resolution?: number,
  ): void {
    // If no parameters provided, show the modal
    if (!name || !width || !height) {
      this.showNewDocumentModal();
      return;
    }

    console.log(
      `Creating new document: ${name}, ${width}x${height}, background: ${background}`,
    );

    const doc = new Document({
      name,
      width,
      height,
      background: background || "white",
      resolution: resolution || 72,
    });

    this.addDocument(doc);
    this.createCanvasForDocument(doc);
    this.addTabForDocument(doc);
    this.setActiveDocument(doc.id);

    // Update canvas info and zoom
    this.updateCanvasInfo(doc);
    this.updateZoomDisplay();
    this.applyCanvasZoom();
  }

  private createCanvasForDocument(doc: Document): void {
    const canvasContainer = window.document.getElementById("canvas-container");
    if (!canvasContainer) return;

    // Clear welcome screen
    canvasContainer.innerHTML = "";

    // Create canvas workspace
    const workspace = window.document.createElement("div");
    workspace.className =
      "canvas-workspace absolute inset-0 flex items-center justify-center";
    workspace.id = `workspace-${doc.id}`;

    const canvasWrapper = window.document.createElement("div");
    canvasWrapper.className = "canvas-wrapper";
    canvasWrapper.style.width = `${doc.width}px`;
    canvasWrapper.style.height = `${doc.height}px`;

    const canvas = window.document.createElement("canvas");
    canvas.width = doc.width;
    canvas.height = doc.height;
    canvas.id = `canvas-${doc.id}`;
    canvas.className = "block";

    // Fill background
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle =
        doc.background === "white"
          ? "#ffffff"
          : doc.background === "black"
            ? "#000000"
            : doc.background === "transparent"
              ? "transparent"
              : doc.background;
      if (doc.background !== "transparent") {
        ctx.fillRect(0, 0, doc.width, doc.height);
      }
    }

    canvasWrapper.appendChild(canvas);
    workspace.appendChild(canvasWrapper);
    canvasContainer.appendChild(workspace);

    // Store canvas reference
    (doc as any).canvas = canvas;
  }

  private addTabForDocument(doc: Document): void {
    const tabContainer = window.document.getElementById("tab-container");
    if (!tabContainer) return;

    const tab = window.document.createElement("button");
    tab.className =
      "tab flex items-center px-4 py-2 border-r border-gray-700 bg-gray-700 hover:bg-gray-600 text-sm";
    tab.id = `tab-${doc.id}`;
    tab.innerHTML = `
      <span class="tab-name">${doc.name}</span>
      <button class="tab-close ml-2 p-1 rounded hover:bg-gray-500" onclick="event.stopPropagation();">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    // Add click handlers
    tab.addEventListener("click", () => {
      this.setActiveDocument(doc.id);
    });

    const closeBtn = tab.querySelector(".tab-close");
    closeBtn?.addEventListener("click", (e: Event) => {
      e.stopPropagation();
      this.closeDocument(doc.id);
    });

    // Insert before new tab button
    const newTabBtn = window.document.getElementById("new-tab-btn");
    tabContainer.insertBefore(tab, newTabBtn);
  }

  private updateCanvasInfo(doc: Document): void {
    const canvasInfo = window.document.getElementById("canvas-info");
    if (canvasInfo) {
      canvasInfo.textContent = `${doc.name} - ${doc.width}x${doc.height}px`;
    }
  }

  private updateZoomDisplay(): void {
    const zoomDisplay = document.getElementById("zoom-level");
    if (zoomDisplay) {
      zoomDisplay.textContent = `${Math.round(this.canvasZoom * 100)}%`;
    }
  }

  private applyCanvasZoom(): void {
    const canvasContainer = document.getElementById("canvas-container");
    if (canvasContainer) {
      const canvas = canvasContainer.querySelector("canvas");
      if (canvas) {
        canvas.style.transform = `scale(${this.canvasZoom})`;
        canvas.style.transformOrigin = "center center";

        // Update container to handle scaled canvas
        const scaledWidth = canvas.width * this.canvasZoom;
        const scaledHeight = canvas.height * this.canvasZoom;

        // Ensure container can scroll if canvas is larger than viewport
        canvasContainer.style.overflow = "auto";
        canvasContainer.style.display = "flex";
        canvasContainer.style.alignItems = "center";
        canvasContainer.style.justifyContent = "center";
        canvasContainer.style.minHeight = `${scaledHeight + 100}px`;
        canvasContainer.style.minWidth = `${scaledWidth + 100}px`;
      }
    }
  }

  public setZoom(zoom: number): void {
    const newZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, zoom));
    if (newZoom !== this.canvasZoom) {
      this.canvasZoom = newZoom;
      this.updateZoomDisplay();
      this.applyCanvasZoom();
    }
  }

  public resetZoom(): void {
    this.setZoom(1);
  }

  public showNewDocumentModal(): void {
    const modal = document.getElementById("new-document-modal");
    if (modal) {
      modal.classList.remove("hidden");

      // Focus project name input and select text
      const nameInput = document.getElementById(
        "new-doc-name",
      ) as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }

      // Setup create button
      const createBtn = document.getElementById("create-document-btn");
      const cancelBtn = document.getElementById("cancel-document-btn");
      const widthInput = document.getElementById(
        "new-doc-width",
      ) as HTMLInputElement;
      const heightInput = document.getElementById(
        "new-doc-height",
      ) as HTMLInputElement;
      const resolutionInput = document.getElementById(
        "new-doc-resolution",
      ) as HTMLInputElement;
      const backgroundSelect = document.getElementById(
        "new-doc-background",
      ) as HTMLSelectElement;

      if (createBtn) {
        createBtn.onclick = () => {
          const name = nameInput?.value?.trim() || "New Project";
          const width = Math.max(
            1,
            Math.min(8192, parseInt(widthInput?.value || "1920")),
          );
          const height = Math.max(
            1,
            Math.min(8192, parseInt(heightInput?.value || "1080")),
          );
          const resolution = Math.max(
            72,
            Math.min(600, parseInt(resolutionInput?.value || "72")),
          );
          const background = backgroundSelect?.value || "white";

          this.createNewDocument(name, width, height, background, resolution);
          modal.classList.add("hidden");
        };
      }

      if (cancelBtn) {
        cancelBtn.onclick = () => {
          modal.classList.add("hidden");
        };
      }

      // Handle Enter key to create document
      modal.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          createBtn?.click();
        } else if (e.key === "Escape") {
          cancelBtn?.click();
        }
      });
    }
  }

  public openFile(): void {
    console.log("Opening file dialog...");
    // For now, create a default document
    this.createNewDocument("Opened Document", 800, 600, "white");
  }

  public importFile(file?: File): void {
    console.log("Importing file...", file?.name);
    // For now, create a default document
    this.createNewDocument("Imported Document", 800, 600, "white");
  }

  public saveProject(): void {
    const activeDoc = this.getActiveDocument();
    if (activeDoc) {
      console.log("Saving project...");
    }
  }

  public saveProjectAs(): void {
    const activeDoc = this.getActiveDocument();
    if (activeDoc) {
      console.log("Save project as...");
    }
  }

  public exportDocument(): void {
    const activeDoc = this.getActiveDocument();
    if (activeDoc) {
      console.log("Exporting document...");
    }
  }

  public performUndo(): void {
    this.historyManager.undo();
  }

  public performRedo(): void {
    this.historyManager.redo();
  }

  public setTool(toolName: string): void {
    this.toolManager.setActiveTool(toolName);
    this.canvasManager.setActiveTool(toolName);
  }

  public setBrushSize(size: number): void {
    console.log("Setting brush size:", size);
  }

  public setBrushOpacity(opacity: number): void {
    console.log("Setting brush opacity:", opacity);
  }

  public setColor(color: string): void {
    console.log("Setting color:", color);
  }

  public swapColors(): void {
    console.log("Swapping colors");
  }

  public resetColors(): void {
    console.log("Resetting colors");
  }

  public zoomIn(): void {
    const newZoom = Math.min(this.zoomMax, this.canvasZoom * 1.25);
    if (newZoom !== this.canvasZoom) {
      this.canvasZoom = newZoom;
      this.updateZoomDisplay();
      this.applyCanvasZoom();
    }
  }

  public zoomOut(): void {
    const newZoom = Math.max(this.zoomMin, this.canvasZoom / 1.25);
    if (newZoom !== this.canvasZoom) {
      this.canvasZoom = newZoom;
      this.updateZoomDisplay();
      this.applyCanvasZoom();
    }
  }

  public zoomToFit(): void {
    this.resetZoom();
  }

  public applyBlur(): void {
    this.filterManager.applyFilter("blur", {});
  }

  public applySharpen(): void {
    this.filterManager.applyFilter("sharpen", {});
  }

  public applyEmboss(): void {
    this.filterManager.applyFilter("emboss", {});
  }

  public applyEdgeDetect(): void {
    this.filterManager.applyFilter("edge-detect", {});
  }

  public addNewLayer(name?: string): void {
    const activeDoc = this.getActiveDocument();
    if (!activeDoc) return;

    const layer = new Layer({
      name: name || `Layer ${activeDoc.layers.length + 1}`,
      width: activeDoc.width,
      height: activeDoc.height,
    });

    activeDoc.addLayer(layer);
    this.layerManager.refreshLayersList();
    this.eventBus.emit("layer:added", layer);
  }

  public duplicateCurrentLayer(): void {
    this.duplicateActiveLayer();
  }

  public deleteCurrentLayer(): void {
    this.deleteActiveLayer();
  }

  public closeAllDocuments(): void {
    const docs = Array.from(this.documents.values());
    docs.forEach((doc) => {
      if (!doc.saved) {
        const shouldSave = confirm(
          `Save changes to ${doc.name} before closing?`,
        );
        if (shouldSave) {
          console.log("Would save:", doc.name);
        }
      }
    });

    this.documents.clear();
    this.activeDocumentId = null;
    this.canvasManager.showWelcomeScreen();
    this.layerManager.refreshLayersList();
    console.log("All documents closed");
  }

  public getActiveDocumentName(): string {
    const activeDoc = this.getActiveDocument();
    return activeDoc ? activeDoc.getDisplayName() : "No Document";
  }

  public getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  public getDocumentById(id: string): Document | null {
    return this.documents.get(id) || null;
  }

  public isDocumentActive(id: string): boolean {
    return this.activeDocumentId === id;
  }

  public getStats(): any {
    return {
      documentsOpen: this.documents.size,
      activeDocument: this.getActiveDocumentName(),
      memoryUsage: this.historyManager.getMemoryUsageFormatted(),
      historyStates: this.historyManager.getHistorySize(),
    };
  }

  // Cleanup
  public destroy(): void {
    // Clear all documents
    this.documents.clear();
    this.activeDocumentId = null;

    // Clear event bus
    this.eventBus.removeAllListeners();

    console.log("🗑️ PixelForge destroyed");
  }
}
