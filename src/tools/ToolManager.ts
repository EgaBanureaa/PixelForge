import { EventBus } from "../core/EventBus";

export interface Tool {
  name: string;
  icon: string;
  shortcut: string;
  cursor: string;
}

export class ToolManager {
  private eventBus: EventBus;
  private activeTool: string;
  private tools: Map<string, Tool>;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.activeTool = "select";
    this.tools = new Map();
    this.initializeTools();
  }

  public initialize(): void {
    this.setupToolButtons();
    this.setupToolOptions();
  }

  private initializeTools(): void {
    const toolDefinitions: Tool[] = [
      { name: "select", icon: "move", shortcut: "V", cursor: "default" },
      { name: "marquee", icon: "square", shortcut: "M", cursor: "crosshair" },
      { name: "lasso", icon: "lasso", shortcut: "L", cursor: "crosshair" },
      { name: "brush", icon: "brush", shortcut: "B", cursor: "crosshair" },
      { name: "pencil", icon: "pencil", shortcut: "P", cursor: "crosshair" },
      { name: "eraser", icon: "eraser", shortcut: "E", cursor: "crosshair" },
      { name: "clone", icon: "copy", shortcut: "S", cursor: "crosshair" },
      { name: "rectangle", icon: "square", shortcut: "U", cursor: "crosshair" },
      { name: "ellipse", icon: "circle", shortcut: "O", cursor: "crosshair" },
      { name: "line", icon: "minus", shortcut: "L", cursor: "crosshair" },
      { name: "text", icon: "type", shortcut: "T", cursor: "text" },
      {
        name: "eyedropper",
        icon: "eyedropper",
        shortcut: "I",
        cursor: "crosshair",
      },
      { name: "zoom", icon: "zoom-in", shortcut: "Z", cursor: "zoom-in" },
      { name: "hand", icon: "hand", shortcut: "H", cursor: "grab" },
    ];

    toolDefinitions.forEach((tool) => {
      this.tools.set(tool.name, tool);
    });
  }

  private setupToolButtons(): void {
    const toolButtons = document.querySelectorAll("[data-tool]");

    toolButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const toolName = (e.currentTarget as HTMLElement).getAttribute(
          "data-tool",
        );
        if (toolName) {
          this.setActiveTool(toolName);
        }
      });
    });
  }

  private setupToolOptions(): void {
    // Brush options
    this.setupBrushOptions();
    this.setupColorPicker();
    this.setupRangeSliders();
  }

  private setupBrushOptions(): void {
    const brushSize = document.getElementById("brush-size") as HTMLInputElement;
    const brushSizeValue = document.getElementById("brush-size-value");

    if (brushSize && brushSizeValue) {
      brushSize.addEventListener("input", () => {
        brushSizeValue.textContent = `${brushSize.value}px`;
        this.eventBus.emit("brush:size-changed", parseInt(brushSize.value));
      });
    }

    const brushOpacity = document.getElementById(
      "brush-opacity",
    ) as HTMLInputElement;
    const brushOpacityValue = document.getElementById("brush-opacity-value");

    if (brushOpacity && brushOpacityValue) {
      brushOpacity.addEventListener("input", () => {
        brushOpacityValue.textContent = `${brushOpacity.value}%`;
        this.eventBus.emit(
          "brush:opacity-changed",
          parseInt(brushOpacity.value),
        );
      });
    }

    const brushHardness = document.getElementById(
      "brush-hardness",
    ) as HTMLInputElement;
    const brushHardnessValue = document.getElementById("brush-hardness-value");

    if (brushHardness && brushHardnessValue) {
      brushHardness.addEventListener("input", () => {
        brushHardnessValue.textContent = `${brushHardness.value}%`;
        this.eventBus.emit(
          "brush:hardness-changed",
          parseInt(brushHardness.value),
        );
      });
    }

    const brushFlow = document.getElementById("brush-flow") as HTMLInputElement;
    const brushFlowValue = document.getElementById("brush-flow-value");

    if (brushFlow && brushFlowValue) {
      brushFlow.addEventListener("input", () => {
        brushFlowValue.textContent = `${brushFlow.value}%`;
        this.eventBus.emit("brush:flow-changed", parseInt(brushFlow.value));
      });
    }

    const brushBlendMode = document.getElementById(
      "brush-blend-mode",
    ) as HTMLSelectElement;
    if (brushBlendMode) {
      brushBlendMode.addEventListener("change", () => {
        this.eventBus.emit("brush:blend-mode-changed", brushBlendMode.value);
      });
    }
  }

  private setupColorPicker(): void {
    const colorPicker = document.getElementById(
      "color-picker",
    ) as HTMLInputElement;
    const foregroundColor = document.getElementById(
      "foreground-color",
    ) as HTMLElement;
    const backgroundColorEl = document.getElementById(
      "background-color",
    ) as HTMLElement;
    const swapColors = document.getElementById("swap-colors");
    const resetColors = document.getElementById("reset-colors");

    if (colorPicker && foregroundColor) {
      colorPicker.addEventListener("input", () => {
        const color = colorPicker.value;
        foregroundColor.style.backgroundColor = color;
        this.eventBus.emit("color:foreground-changed", color);
        this.updateHSLInputs(color);
      });

      // Initialize with black
      foregroundColor.style.backgroundColor = "#000000";
      colorPicker.value = "#000000";
    }

    if (backgroundColorEl) {
      backgroundColorEl.style.backgroundColor = "#ffffff";
    }

    if (swapColors && foregroundColor && backgroundColorEl) {
      swapColors.addEventListener("click", () => {
        const tempColor = foregroundColor.style.backgroundColor;
        foregroundColor.style.backgroundColor =
          backgroundColorEl.style.backgroundColor;
        backgroundColorEl.style.backgroundColor = tempColor;

        this.eventBus.emit("color:swapped");
      });
    }

    if (resetColors && foregroundColor && backgroundColorEl) {
      resetColors.addEventListener("click", () => {
        foregroundColor.style.backgroundColor = "#000000";
        backgroundColorEl.style.backgroundColor = "#ffffff";

        if (colorPicker) {
          colorPicker.value = "#000000";
        }

        this.eventBus.emit("color:reset");
        this.updateHSLInputs("#000000");
      });
    }

    // HSL inputs
    const hueInput = document.getElementById("hue") as HTMLInputElement;
    const saturationInput = document.getElementById(
      "saturation",
    ) as HTMLInputElement;
    const lightnessInput = document.getElementById(
      "lightness",
    ) as HTMLInputElement;

    if (hueInput && saturationInput && lightnessInput) {
      [hueInput, saturationInput, lightnessInput].forEach((input) => {
        input.addEventListener("input", () => {
          const h = parseInt(hueInput.value);
          const s = parseInt(saturationInput.value);
          const l = parseInt(lightnessInput.value);
          const color = this.hslToHex(h, s, l);

          if (colorPicker) colorPicker.value = color;
          if (foregroundColor) foregroundColor.style.backgroundColor = color;

          this.eventBus.emit("color:foreground-changed", color);
        });
      });
    }

    // Create color swatches
    this.createColorSwatches();
  }

  private setupRangeSliders(): void {
    const rangeInputs = document.querySelectorAll('input[type="range"]');

    rangeInputs.forEach((input) => {
      const slider = input as HTMLInputElement;
      slider.addEventListener("input", () => {
        const valueSpan = document.getElementById(slider.id + "-value");
        if (valueSpan) {
          const suffix =
            slider.id.includes("opacity") ||
            slider.id.includes("hardness") ||
            slider.id.includes("flow")
              ? "%"
              : "px";
          valueSpan.textContent = slider.value + suffix;
        }
      });
    });
  }

  private createColorSwatches(): void {
    const swatchesContainer = document.querySelector(".color-swatches");
    if (!swatchesContainer) return;

    const defaultColors = [
      "#000000",
      "#333333",
      "#666666",
      "#999999",
      "#cccccc",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
      "#800000",
      "#008000",
      "#000080",
      "#808000",
      "#800080",
      "#008080",
      "#ffa500",
      "#ffc0cb",
      "#a52a2a",
      "#dda0dd",
      "#98fb98",
      "#f0e68c",
      "#87ceeb",
      "#daa520",
      "#dc143c",
      "#00ced1",
      "#ff1493",
      "#32cd32",
      "#ffd700",
      "#4169e1",
    ];

    defaultColors.forEach((color) => {
      const swatch = document.createElement("div");
      swatch.className = "color-swatch-item";
      swatch.style.backgroundColor = color;
      swatch.title = color;

      swatch.addEventListener("click", () => {
        const colorPicker = document.getElementById(
          "color-picker",
        ) as HTMLInputElement;
        const foregroundColor = document.getElementById(
          "foreground-color",
        ) as HTMLElement;

        if (colorPicker) colorPicker.value = color;
        if (foregroundColor) foregroundColor.style.backgroundColor = color;

        this.eventBus.emit("color:foreground-changed", color);
        this.updateHSLInputs(color);
      });

      swatchesContainer.appendChild(swatch);
    });
  }

  private updateHSLInputs(hexColor: string): void {
    const rgb = this.hexToRgb(hexColor);
    if (rgb) {
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

      const hueInput = document.getElementById("hue") as HTMLInputElement;
      const saturationInput = document.getElementById(
        "saturation",
      ) as HTMLInputElement;
      const lightnessInput = document.getElementById(
        "lightness",
      ) as HTMLInputElement;

      if (hueInput) hueInput.value = Math.round(hsl.h).toString();
      if (saturationInput) saturationInput.value = Math.round(hsl.s).toString();
      if (lightnessInput) lightnessInput.value = Math.round(hsl.l).toString();
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private rgbToHsl(
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  public setActiveTool(toolName: string): void {
    if (!this.tools.has(toolName)) return;

    // Update active tool
    this.activeTool = toolName;

    // Update UI
    this.updateToolButtons(toolName);
    this.updateToolOptions(toolName);

    // Emit event
    this.eventBus.emit("tool:changed", toolName);
  }

  private updateToolButtons(activeTool: string): void {
    const toolButtons = document.querySelectorAll("[data-tool]");

    toolButtons.forEach((button) => {
      const toolName = (button as HTMLElement).getAttribute("data-tool");
      if (toolName === activeTool) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }

  private updateToolOptions(activeTool: string): void {
    // Hide all tool options
    const allOptions = document.querySelectorAll(".tool-options");
    allOptions.forEach((option) => {
      option.classList.remove("active");
    });

    // Show active tool options
    const activeOptions = document.getElementById(`${activeTool}-options`);
    if (activeOptions) {
      activeOptions.classList.add("active");
    }
  }

  public getActiveTool(): string {
    return this.activeTool;
  }

  public getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}
