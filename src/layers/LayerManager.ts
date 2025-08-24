import { EventBus } from "../core/EventBus";
import { Layer } from "./Layer";

export class LayerManager {
  private eventBus: EventBus;
  private layersContainer: HTMLElement;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;

    const container = document.getElementById("layers-list");
    if (!container) {
      throw new Error("Layers container not found");
    }
    this.layersContainer = container;
  }

  public initialize(): void {
    this.setupLayerControls();
    this.setupLayerSettings();
  }

  private setupLayerControls(): void {
    const addLayerBtn = document.getElementById("add-layer");
    const duplicateLayerBtn = document.getElementById("duplicate-layer");
    const deleteLayerBtn = document.getElementById("delete-layer");

    if (addLayerBtn) {
      addLayerBtn.addEventListener("click", () => {
        this.eventBus.emit("layer:add");
      });
    }

    if (duplicateLayerBtn) {
      duplicateLayerBtn.addEventListener("click", () => {
        this.eventBus.emit("layer:duplicate");
      });
    }

    if (deleteLayerBtn) {
      deleteLayerBtn.addEventListener("click", () => {
        this.eventBus.emit("layer:delete");
      });
    }
  }

  private setupLayerSettings(): void {
    const layerOpacity = document.getElementById(
      "layer-opacity",
    ) as HTMLInputElement;
    const layerOpacityValue = document.getElementById("layer-opacity-value");
    const layerBlendMode = document.getElementById(
      "layer-blend-mode",
    ) as HTMLSelectElement;

    if (layerOpacity && layerOpacityValue) {
      layerOpacity.addEventListener("input", () => {
        layerOpacityValue.textContent = `${layerOpacity.value}%`;
        this.eventBus.emit(
          "layer:opacity-changed",
          parseInt(layerOpacity.value),
        );
      });
    }

    if (layerBlendMode) {
      layerBlendMode.addEventListener("change", () => {
        this.eventBus.emit("layer:blend-mode-changed", layerBlendMode.value);
      });
    }
  }

  public refreshLayersList(): void {
    // Get active document
    this.eventBus.emit("document:get-active", (activeDocument: any) => {
      if (activeDocument && activeDocument.layers) {
        this.renderLayersList(
          activeDocument.layers,
          activeDocument.activeLayerIndex,
        );
      } else {
        this.layersContainer.innerHTML =
          '<div class="text-center text-gray-500 py-4">No layers</div>';
      }
    });
  }

  private renderLayersList(layers: Layer[], activeIndex: number): void {
    this.layersContainer.innerHTML = "";

    // Render layers in reverse order (top to bottom)
    const reversedLayers = [...layers].reverse();
    reversedLayers.forEach((layer, index) => {
      const actualIndex = layers.length - 1 - index;
      const layerElement = this.createLayerElement(
        layer,
        actualIndex === activeIndex,
      );

      layerElement.addEventListener("click", () => {
        this.setActiveLayer(layer.id);
      });

      this.layersContainer.appendChild(layerElement);
    });
  }

  private createLayerElement(layer: Layer, isActive: boolean): HTMLElement {
    const layerItem = document.createElement("div");
    layerItem.className = `layer-item ${isActive ? "active" : ""}`;
    layerItem.dataset.layerId = layer.id;

    // Create layer thumbnail
    const thumbnail = document.createElement("div");
    thumbnail.className = "layer-thumbnail";

    // Generate thumbnail from layer canvas
    const thumbnailDataUrl = layer.getThumbnail(32);
    if (thumbnailDataUrl) {
      thumbnail.style.backgroundImage = `url(${thumbnailDataUrl})`;
      thumbnail.style.backgroundSize = "cover";
      thumbnail.style.backgroundPosition = "center";
    }

    // Create visibility toggle
    const visibility = document.createElement("div");
    visibility.className = "layer-visibility";
    visibility.innerHTML = layer.visible ? "👁" : "👁‍🗨";
    visibility.title = layer.visible ? "Hide layer" : "Show layer";

    visibility.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleLayerVisibility(layer.id);
    });

    // Create layer name
    const name = document.createElement("div");
    name.className = "layer-name";
    name.textContent = layer.name;

    // Make name editable
    name.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      this.editLayerName(layer.id, name);
    });

    // Create opacity indicator
    const opacityIndicator = document.createElement("div");
    opacityIndicator.className = "layer-opacity-indicator";
    opacityIndicator.textContent =
      layer.opacity < 100 ? `${layer.opacity}%` : "";

    // Create lock indicator
    const lockIndicator = document.createElement("div");
    if (layer.locked) {
      lockIndicator.innerHTML = "🔒";
      lockIndicator.title = "Layer is locked";
    }

    layerItem.appendChild(thumbnail);
    layerItem.appendChild(visibility);
    layerItem.appendChild(name);
    layerItem.appendChild(opacityIndicator);
    if (layer.locked) {
      layerItem.appendChild(lockIndicator);
    }

    // Add drag and drop functionality
    this.addDragAndDrop(layerItem, layer);

    return layerItem;
  }

  private addDragAndDrop(element: HTMLElement, layer: Layer): void {
    element.draggable = true;

    element.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", layer.id);
      element.style.opacity = "0.5";
    });

    element.addEventListener("dragend", () => {
      element.style.opacity = "1";
    });

    element.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    element.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedLayerId = e.dataTransfer?.getData("text/plain");
      if (draggedLayerId && draggedLayerId !== layer.id) {
        this.eventBus.emit("layer:reorder", {
          draggedLayerId,
          targetLayerId: layer.id,
        });
      }
    });
  }

  private setActiveLayer(layerId: string): void {
    // Update UI
    const layerItems = this.layersContainer.querySelectorAll(".layer-item");
    layerItems.forEach((item) => {
      if ((item as HTMLElement).dataset.layerId === layerId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Emit event
    this.eventBus.emit("layer:set-active", layerId);
  }

  private toggleLayerVisibility(layerId: string): void {
    this.eventBus.emit("layer:toggle-visibility", layerId);

    // Update visibility icon
    const layerItem = this.layersContainer.querySelector(
      `[data-layer-id="${layerId}"]`,
    );
    if (layerItem) {
      const visibilityIcon = layerItem.querySelector(".layer-visibility");
      if (visibilityIcon) {
        // Toggle icon (this will be updated when we refresh the layers list)
        this.refreshLayersList();
      }
    }
  }

  private editLayerName(layerId: string, nameElement: HTMLElement): void {
    const currentName = nameElement.textContent || "";
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.className = "bg-gray-700 text-white px-2 py-1 rounded text-sm w-full";

    nameElement.replaceWith(input);
    input.focus();
    input.select();

    const saveChanges = () => {
      const newName = input.value.trim() || currentName;
      nameElement.textContent = newName;
      input.replaceWith(nameElement);

      if (newName !== currentName) {
        this.eventBus.emit("layer:rename", { layerId, newName });
      }
    };

    input.addEventListener("blur", saveChanges);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveChanges();
      } else if (e.key === "Escape") {
        nameElement.textContent = currentName;
        input.replaceWith(nameElement);
      }
    });
  }

  public addLayer(layer: Layer): void {
    this.eventBus.emit("layer:added", layer);
    this.refreshLayersList();
  }

  public removeLayer(layerId: string): void {
    this.eventBus.emit("layer:deleted", layerId);
    this.refreshLayersList();
  }

  public updateLayerOpacity(layerId: string, opacity: number): void {
    this.eventBus.emit("layer:opacity-updated", { layerId, opacity });

    // Update opacity slider if this is the active layer
    const layerOpacity = document.getElementById(
      "layer-opacity",
    ) as HTMLInputElement;
    const layerOpacityValue = document.getElementById("layer-opacity-value");

    if (layerOpacity && layerOpacityValue) {
      layerOpacity.value = opacity.toString();
      layerOpacityValue.textContent = `${opacity}%`;
    }

    this.refreshLayersList();
  }

  public updateLayerBlendMode(layerId: string, blendMode: string): void {
    this.eventBus.emit("layer:blend-mode-updated", { layerId, blendMode });

    // Update blend mode selector if this is the active layer
    const layerBlendMode = document.getElementById(
      "layer-blend-mode",
    ) as HTMLSelectElement;
    if (layerBlendMode) {
      layerBlendMode.value = blendMode;
    }
  }

  public createNewLayer(name: string = "New Layer"): Layer {
    // This will need to get document dimensions from the active document
    const layer = new Layer({
      name,
      width: 1920, // Default size, should be obtained from active document
      height: 1080,
    });

    this.addLayer(layer);
    return layer;
  }

  public duplicateLayer(layerId: string): void {
    this.eventBus.emit("layer:duplicate-requested", layerId);
  }

  public deleteLayer(layerId: string): void {
    if (confirm("Are you sure you want to delete this layer?")) {
      this.removeLayer(layerId);
    }
  }

  public mergeDown(layerId: string): void {
    this.eventBus.emit("layer:merge-down", layerId);
    this.refreshLayersList();
  }

  public flattenImage(): void {
    if (
      confirm(
        "Flatten image? This will merge all layers into one and cannot be undone.",
      )
    ) {
      this.eventBus.emit("layer:flatten-image");
      this.refreshLayersList();
    }
  }

  public toggleLayerLock(layerId: string): void {
    this.eventBus.emit("layer:toggle-lock", layerId);
    this.refreshLayersList();
  }
}
