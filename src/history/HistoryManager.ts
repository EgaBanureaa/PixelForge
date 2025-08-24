import { EventBus } from "../core/EventBus";
import { Layer } from "../layers/Layer";

export interface HistoryState {
  id: string;
  name: string;
  timestamp: number;
  layers: Layer[];
  activeLayerIndex: number;
  canvasWidth: number;
  canvasHeight: number;
}

export class HistoryManager {
  private eventBus: EventBus;
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;
  private isRecording: boolean = true;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public initialize(): void {
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  private setupEventListeners(): void {
    // Listen for actions that should be recorded
    this.eventBus.on("history:add-state", (name: string) => {
      if (this.isRecording) {
        this.addState(name);
      }
    });

    this.eventBus.on("history:undo", () => {
      this.undo();
    });

    this.eventBus.on("history:redo", () => {
      this.redo();
    });

    this.eventBus.on("history:clear", () => {
      this.clearHistory();
    });

    this.eventBus.on(
      "history:get-states",
      (callback: (states: HistoryState[]) => void) => {
        callback(this.history);
      },
    );

    this.eventBus.on("history:set-max-size", (size: number) => {
      this.setMaxHistorySize(size);
    });

    // Auto-record states for common actions
    this.eventBus.on("layer:added", () => {
      this.addState("Add Layer");
    });

    this.eventBus.on("layer:deleted", () => {
      this.addState("Delete Layer");
    });

    this.eventBus.on("layer:duplicated", () => {
      this.addState("Duplicate Layer");
    });

    this.eventBus.on("layer:merged", () => {
      this.addState("Merge Layer");
    });

    this.eventBus.on("layer:opacity-updated", () => {
      this.addState("Change Layer Opacity");
    });

    this.eventBus.on("layer:blend-mode-updated", () => {
      this.addState("Change Blend Mode");
    });

    this.eventBus.on("layer:reordered", () => {
      this.addState("Reorder Layers");
    });

    this.eventBus.on("tool:stroke-completed", () => {
      this.addState("Brush Stroke");
    });

    this.eventBus.on("document:resized", () => {
      this.addState("Resize Canvas");
    });
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              this.redo();
            } else {
              this.undo();
            }
            break;
          case "y":
            e.preventDefault();
            this.redo();
            break;
        }
      }
    });
  }

  public addState(name: string): void {
    if (!this.isRecording) return;

    // Get current document state
    this.eventBus.emit("document:get-active", (activeDocument: any) => {
      if (!activeDocument) return;

      const state: HistoryState = {
        id: this.generateId(),
        name,
        timestamp: Date.now(),
        layers: this.cloneLayers(activeDocument.layers),
        activeLayerIndex: activeDocument.activeLayerIndex,
        canvasWidth: activeDocument.width,
        canvasHeight: activeDocument.height,
      };

      // Remove any states after current index (when user undid and then made new changes)
      this.history = this.history.slice(0, this.currentIndex + 1);

      // Add new state
      this.history.push(state);
      this.currentIndex = this.history.length - 1;

      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
        this.currentIndex--;
      }

      this.updateUI();
      this.eventBus.emit("history:state-added", state);
    });
  }

  public undo(): void {
    if (!this.canUndo()) return;

    this.currentIndex--;
    this.restoreState(this.history[this.currentIndex]);
    this.updateUI();
    this.eventBus.emit("history:undone", this.history[this.currentIndex]);
  }

  public redo(): void {
    if (!this.canRedo()) return;

    this.currentIndex++;
    this.restoreState(this.history[this.currentIndex]);
    this.updateUI();
    this.eventBus.emit("history:redone", this.history[this.currentIndex]);
  }

  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  private restoreState(state: HistoryState): void {
    this.isRecording = false;

    // Restore document state
    this.eventBus.emit("document:restore-state", {
      layers: this.cloneLayers(state.layers),
      activeLayerIndex: state.activeLayerIndex,
      width: state.canvasWidth,
      height: state.canvasHeight,
    });

    // Restore canvas
    this.eventBus.emit("canvas:restore-from-layers", state.layers);

    // Restore layer panel
    this.eventBus.emit("layers:refresh");

    setTimeout(() => {
      this.isRecording = true;
    }, 100);
  }

  private cloneLayers(layers: Layer[]): Layer[] {
    return layers.map((layer) => this.cloneLayer(layer));
  }

  private cloneLayer(layer: Layer): Layer {
    // Create new layer with same properties
    const clonedLayer = new Layer({
      name: layer.name,
      width: layer.canvas.width,
      height: layer.canvas.height,
      isBackground: layer.isBackground,
    });

    // Copy properties
    clonedLayer.visible = layer.visible;
    clonedLayer.opacity = layer.opacity;
    clonedLayer.blendMode = layer.blendMode;
    clonedLayer.locked = layer.locked;
    clonedLayer.x = layer.x;
    clonedLayer.y = layer.y;

    // Copy canvas content
    const clonedCtx = clonedLayer.context;
    clonedCtx.drawImage(layer.canvas, 0, 0);

    return clonedLayer;
  }

  private updateUI(): void {
    // Update undo/redo button states
    const undoBtn = document.getElementById("menu-undo");
    const redoBtn = document.getElementById("menu-redo");

    if (undoBtn) {
      if (this.canUndo()) {
        undoBtn.classList.remove("disabled");
        undoBtn.setAttribute(
          "title",
          `Undo ${this.history[this.currentIndex - 1]?.name || ""}`,
        );
      } else {
        undoBtn.classList.add("disabled");
        undoBtn.setAttribute("title", "Nothing to undo");
      }
    }

    if (redoBtn) {
      if (this.canRedo()) {
        redoBtn.classList.remove("disabled");
        redoBtn.setAttribute(
          "title",
          `Redo ${this.history[this.currentIndex + 1]?.name || ""}`,
        );
      } else {
        redoBtn.classList.add("disabled");
        redoBtn.setAttribute("title", "Nothing to redo");
      }
    }

    // Update history panel if it exists
    this.updateHistoryPanel();
  }

  private updateHistoryPanel(): void {
    const historyPanel = document.getElementById("history-panel");
    if (!historyPanel) return;

    const historyList = historyPanel.querySelector(".history-list");
    if (!historyList) return;

    historyList.innerHTML = "";

    this.history.forEach((state, index) => {
      const historyItem = document.createElement("div");
      historyItem.className = `history-item ${index === this.currentIndex ? "active" : ""}`;

      if (index > this.currentIndex) {
        historyItem.classList.add("future");
      }

      const icon = document.createElement("div");
      icon.className = "history-icon";
      icon.innerHTML = this.getHistoryIcon(state.name);

      const name = document.createElement("div");
      name.className = "history-name";
      name.textContent = state.name;

      const time = document.createElement("div");
      time.className = "history-time";
      time.textContent = this.formatTime(state.timestamp);

      historyItem.appendChild(icon);
      historyItem.appendChild(name);
      historyItem.appendChild(time);

      // Click to jump to state
      historyItem.addEventListener("click", () => {
        this.jumpToState(index);
      });

      historyList.appendChild(historyItem);
    });
  }

  private getHistoryIcon(name: string): string {
    const iconMap: { [key: string]: string } = {
      "Add Layer": "➕",
      "Delete Layer": "🗑️",
      "Duplicate Layer": "📋",
      "Merge Layer": "🔗",
      "Change Layer Opacity": "👁️",
      "Change Blend Mode": "🎨",
      "Reorder Layers": "↕️",
      "Brush Stroke": "🖌️",
      "Resize Canvas": "📐",
      "Apply Filter": "✨",
      Transform: "🔄",
      Text: "📝",
      Shape: "🔺",
      "Import Image": "📷",
      Crop: "✂️",
    };

    return iconMap[name] || "📝";
  }

  private formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) {
      // Less than 1 minute
      return "now";
    } else if (diff < 3600000) {
      // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
  }

  private jumpToState(targetIndex: number): void {
    if (targetIndex === this.currentIndex) return;

    this.currentIndex = targetIndex;
    this.restoreState(this.history[targetIndex]);
    this.updateUI();
    this.eventBus.emit("history:jumped-to-state", this.history[targetIndex]);
  }

  public clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
    this.updateUI();
    this.eventBus.emit("history:cleared");
  }

  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);

    // Trim history if needed
    while (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    this.currentIndex = Math.max(0, this.currentIndex);
    this.updateUI();
  }

  public getHistorySize(): number {
    return this.history.length;
  }

  public getCurrentStateName(): string {
    return this.history[this.currentIndex]?.name || "Initial State";
  }

  public getStateAt(index: number): HistoryState | null {
    return this.history[index] || null;
  }

  public pauseRecording(): void {
    this.isRecording = false;
  }

  public resumeRecording(): void {
    this.isRecording = true;
  }

  public isRecordingEnabled(): boolean {
    return this.isRecording;
  }

  private generateId(): string {
    return (
      "history_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  // Batch operations for performance
  public startBatch(name: string): void {
    this.pauseRecording();
    this._batchName = name;
  }

  public endBatch(): void {
    if (this._batchName) {
      this.resumeRecording();
      this.addState(this._batchName);
      this._batchName = undefined;
    }
  }

  private _batchName?: string;

  // Memory management
  public getMemoryUsage(): number {
    let totalSize = 0;

    this.history.forEach((state) => {
      state.layers.forEach((layer) => {
        // Approximate canvas memory usage
        totalSize += layer.canvas.width * layer.canvas.height * 4; // 4 bytes per pixel (RGBA)
      });
    });

    return totalSize;
  }

  public getMemoryUsageFormatted(): string {
    const bytes = this.getMemoryUsage();
    const mb = bytes / (1024 * 1024);

    if (mb < 1) {
      return `${Math.round(bytes / 1024)} KB`;
    } else {
      return `${Math.round(mb * 10) / 10} MB`;
    }
  }

  // Optimize memory by reducing history size when memory usage is high
  public optimizeMemory(): void {
    const memoryUsage = this.getMemoryUsage();
    const maxMemory = 100 * 1024 * 1024; // 100MB limit

    if (memoryUsage > maxMemory && this.history.length > 10) {
      // Remove oldest states
      const statesToRemove = Math.floor(this.history.length * 0.3);
      this.history.splice(0, statesToRemove);
      this.currentIndex -= statesToRemove;
      this.currentIndex = Math.max(0, this.currentIndex);

      this.updateUI();
      this.eventBus.emit("history:memory-optimized", {
        removedStates: statesToRemove,
        newMemoryUsage: this.getMemoryUsage(),
      });
    }
  }
}
