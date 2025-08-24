import { EventBus } from "../core/EventBus";
import { Layer } from "../layers/Layer";

export interface FilterOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sharpen?: number;
  noise?: number;
  vintage?: boolean;
  sepia?: boolean;
  grayscale?: boolean;
  invert?: boolean;
  [key: string]: any;
}

export class FilterManager {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public initialize(): void {
    this.setupFilterMenus();
    this.setupEventListeners();
  }

  private setupFilterMenus(): void {
    // Basic filters
    document
      .getElementById("filter-brightness")
      ?.addEventListener("click", () => {
        this.openFilterDialog("brightness");
      });

    document
      .getElementById("filter-contrast")
      ?.addEventListener("click", () => {
        this.openFilterDialog("contrast");
      });

    document
      .getElementById("filter-saturation")
      ?.addEventListener("click", () => {
        this.openFilterDialog("saturation");
      });

    document.getElementById("filter-hue")?.addEventListener("click", () => {
      this.openFilterDialog("hue");
    });

    // Blur filters
    document.getElementById("filter-blur")?.addEventListener("click", () => {
      this.openFilterDialog("blur");
    });

    document
      .getElementById("filter-gaussian-blur")
      ?.addEventListener("click", () => {
        this.applyGaussianBlur();
      });

    document
      .getElementById("filter-motion-blur")
      ?.addEventListener("click", () => {
        this.openFilterDialog("motion-blur");
      });

    // Sharpen filters
    document.getElementById("filter-sharpen")?.addEventListener("click", () => {
      this.applySharpen();
    });

    document
      .getElementById("filter-unsharp-mask")
      ?.addEventListener("click", () => {
        this.openFilterDialog("unsharp-mask");
      });

    // Noise filters
    document.getElementById("filter-noise")?.addEventListener("click", () => {
      this.openFilterDialog("noise");
    });

    document
      .getElementById("filter-dust-scratches")
      ?.addEventListener("click", () => {
        this.applyDustAndScratches();
      });

    // Artistic filters
    document
      .getElementById("filter-oil-painting")
      ?.addEventListener("click", () => {
        this.applyOilPainting();
      });

    document
      .getElementById("filter-watercolor")
      ?.addEventListener("click", () => {
        this.applyWatercolor();
      });

    document.getElementById("filter-sketch")?.addEventListener("click", () => {
      this.applySketch();
    });

    // Color filters
    document.getElementById("filter-sepia")?.addEventListener("click", () => {
      this.applySepia();
    });

    document
      .getElementById("filter-grayscale")
      ?.addEventListener("click", () => {
        this.applyGrayscale();
      });

    document.getElementById("filter-invert")?.addEventListener("click", () => {
      this.applyInvert();
    });

    document.getElementById("filter-vintage")?.addEventListener("click", () => {
      this.applyVintage();
    });

    // Distortion filters
    document.getElementById("filter-emboss")?.addEventListener("click", () => {
      this.applyEmboss();
    });

    document
      .getElementById("filter-edge-detect")
      ?.addEventListener("click", () => {
        this.applyEdgeDetect();
      });
  }

  private setupEventListeners(): void {
    this.eventBus.on(
      "filter:apply",
      (data: { type: string; options: FilterOptions }) => {
        this.applyFilter(data.type, data.options);
      },
    );
  }

  private openFilterDialog(filterType: string): void {
    // Create a dynamic filter dialog
    const dialog = document.createElement("div");
    dialog.className = "modal";
    dialog.id = "filter-dialog";

    dialog.innerHTML = `
      <div class="modal-content bg-gray-800 text-white p-6 rounded-lg max-w-md mx-auto mt-20">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">${this.getFilterTitle(filterType)}</h3>
          <button class="close-filter text-gray-400 hover:text-white">&times;</button>
        </div>
        <div class="filter-controls">
          ${this.getFilterControls(filterType)}
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="cancel-filter px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">Cancel</button>
          <button class="apply-filter px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Apply</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Setup dialog controls
    const closeBtn = dialog.querySelector(".close-filter");
    const cancelBtn = dialog.querySelector(".cancel-filter");
    const applyBtn = dialog.querySelector(".apply-filter");

    closeBtn?.addEventListener("click", () => this.closeFilterDialog(dialog));
    cancelBtn?.addEventListener("click", () => this.closeFilterDialog(dialog));
    applyBtn?.addEventListener("click", () => {
      const options = this.getFilterOptionsFromDialog(dialog, filterType);
      this.applyFilter(filterType, options);
      this.closeFilterDialog(dialog);
    });

    // Setup live preview
    const inputs = dialog.querySelectorAll('input[type="range"]');
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        const options = this.getFilterOptionsFromDialog(dialog, filterType);
        this.previewFilter(filterType, options);
      });
    });

    dialog.classList.remove("hidden");
  }

  private closeFilterDialog(dialog: HTMLElement): void {
    dialog.remove();
    // Reset preview
    this.eventBus.emit("filter:reset-preview");
  }

  private getFilterTitle(filterType: string): string {
    const titles: { [key: string]: string } = {
      brightness: "Brightness/Contrast",
      contrast: "Brightness/Contrast",
      saturation: "Hue/Saturation",
      hue: "Hue/Saturation",
      blur: "Gaussian Blur",
      "motion-blur": "Motion Blur",
      "unsharp-mask": "Unsharp Mask",
      noise: "Add Noise",
    };
    return titles[filterType] || "Filter";
  }

  private getFilterControls(filterType: string): string {
    switch (filterType) {
      case "brightness":
        return `
          <div class="mb-4">
            <label class="block text-sm mb-2">Brightness</label>
            <input type="range" min="-100" max="100" value="0" class="w-full" data-property="brightness">
            <span class="text-xs text-gray-400">-100 to 100</span>
          </div>
          <div class="mb-4">
            <label class="block text-sm mb-2">Contrast</label>
            <input type="range" min="-100" max="100" value="0" class="w-full" data-property="contrast">
            <span class="text-xs text-gray-400">-100 to 100</span>
          </div>
        `;
      case "saturation":
        return `
          <div class="mb-4">
            <label class="block text-sm mb-2">Hue</label>
            <input type="range" min="-180" max="180" value="0" class="w-full" data-property="hue">
            <span class="text-xs text-gray-400">-180 to 180</span>
          </div>
          <div class="mb-4">
            <label class="block text-sm mb-2">Saturation</label>
            <input type="range" min="-100" max="100" value="0" class="w-full" data-property="saturation">
            <span class="text-xs text-gray-400">-100 to 100</span>
          </div>
        `;
      case "blur":
        return `
          <div class="mb-4">
            <label class="block text-sm mb-2">Radius</label>
            <input type="range" min="0" max="20" value="5" class="w-full" data-property="blur">
            <span class="text-xs text-gray-400">0 to 20 pixels</span>
          </div>
        `;
      case "motion-blur":
        return `
          <div class="mb-4">
            <label class="block text-sm mb-2">Distance</label>
            <input type="range" min="0" max="50" value="10" class="w-full" data-property="distance">
            <span class="text-xs text-gray-400">0 to 50 pixels</span>
          </div>
          <div class="mb-4">
            <label class="block text-sm mb-2">Angle</label>
            <input type="range" min="0" max="360" value="0" class="w-full" data-property="angle">
            <span class="text-xs text-gray-400">0 to 360 degrees</span>
          </div>
        `;
      case "noise":
        return `
          <div class="mb-4">
            <label class="block text-sm mb-2">Amount</label>
            <input type="range" min="0" max="100" value="25" class="w-full" data-property="amount">
            <span class="text-xs text-gray-400">0 to 100%</span>
          </div>
          <div class="mb-4">
            <label class="block text-sm mb-2">
              <input type="checkbox" data-property="uniform"> Uniform
            </label>
          </div>
        `;
      default:
        return "<p>No options available for this filter.</p>";
    }
  }

  private getFilterOptionsFromDialog(
    dialog: HTMLElement,
    _filterType: string,
  ): FilterOptions {
    const options: FilterOptions = {};

    const inputs = dialog.querySelectorAll("input[data-property]");
    inputs.forEach((input) => {
      const property = (input as HTMLElement).dataset.property;
      if (!property) return;

      const inputElement = input as HTMLInputElement;
      if (inputElement.type === "range") {
        options[property] = parseFloat(inputElement.value);
      } else if (inputElement.type === "checkbox") {
        options[property] = inputElement.checked;
      }
    });

    return options;
  }

  private previewFilter(filterType: string, options: FilterOptions): void {
    this.eventBus.emit("filter:preview", { type: filterType, options });
  }

  public applyFilter(filterType: string, options: FilterOptions = {}): void {
    this.eventBus.emit("layer:get-active", (layer: Layer) => {
      if (!layer) return;

      const canvas = layer.canvas;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const filteredData = this.processImageData(
        imageData,
        filterType,
        options,
      );

      ctx.putImageData(filteredData, 0, 0);

      this.eventBus.emit("layer:updated", layer.id);
      this.eventBus.emit("history:add-state", "Apply Filter");
    });
  }

  private processImageData(
    imageData: ImageData,
    filterType: string,
    options: FilterOptions,
  ): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    switch (filterType) {
      case "brightness":
        this.applyBrightnessContrast(
          data,
          options.brightness || 0,
          options.contrast || 0,
        );
        break;
      case "saturation":
        this.applyHueSaturation(
          data,
          options.hue || 0,
          options.saturation || 0,
        );
        break;
      case "blur":
        return this.applyBlur(imageData, options.blur || 5);
      case "sharpen":
        return this.applySharpenFilter(imageData);
      case "noise":
        this.applyNoiseFilter(
          data,
          options.amount || 25,
          options.uniform || false,
        );
        break;
      case "sepia":
        this.applySepia(data);
        break;
      case "grayscale":
        this.applyGrayscale(data);
        break;
      case "invert":
        this.applyInvert(data);
        break;
      case "emboss":
        return this.applyEmbossFilter(imageData);
      case "edge-detect":
        return this.applyEdgeDetectFilter(imageData);
    }

    return new ImageData(data, width, height);
  }

  private applyBrightnessContrast(
    data: Uint8ClampedArray,
    brightness: number,
    contrast: number,
  ): void {
    const brightnessFactor = brightness / 100;
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      let r = data[i] + brightnessFactor * 255;
      let g = data[i + 1] + brightnessFactor * 255;
      let b = data[i + 2] + brightnessFactor * 255;

      // Apply contrast
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }

  private applyHueSaturation(
    data: Uint8ClampedArray,
    hue: number,
    saturation: number,
  ): void {
    const hueShift = (hue / 180) * Math.PI;
    const satFactor = 1 + saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      // Convert to HSL
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      let h = 0;
      const l = (max + min) / 2;
      let s = 0;

      if (diff !== 0) {
        s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

        switch (max) {
          case r:
            h = (g - b) / diff + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / diff + 2;
            break;
          case b:
            h = (r - g) / diff + 4;
            break;
        }
        h /= 6;
      }

      // Apply adjustments
      h = (h + hueShift / (2 * Math.PI)) % 1;
      s = Math.max(0, Math.min(1, s * satFactor));

      // Convert back to RGB
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
      const m = l - c / 2;

      let rNew = 0,
        gNew = 0,
        bNew = 0;
      const hSector = Math.floor(h * 6);

      switch (hSector) {
        case 0:
          rNew = c;
          gNew = x;
          bNew = 0;
          break;
        case 1:
          rNew = x;
          gNew = c;
          bNew = 0;
          break;
        case 2:
          rNew = 0;
          gNew = c;
          bNew = x;
          break;
        case 3:
          rNew = 0;
          gNew = x;
          bNew = c;
          break;
        case 4:
          rNew = x;
          gNew = 0;
          bNew = c;
          break;
        case 5:
          rNew = c;
          gNew = 0;
          bNew = x;
          break;
      }

      data[i] = Math.round((rNew + m) * 255);
      data[i + 1] = Math.round((gNew + m) * 255);
      data[i + 2] = Math.round((bNew + m) * 255);
    }
  }

  private applyBlur(imageData: ImageData, radius: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data.length);

    const gaussianKernel = this.generateGaussianKernel(radius);
    const kernelSize = gaussianKernel.length;
    const half = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          a = 0;
        let totalWeight = 0;

        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const idx = (py * width + px) * 4;
            const weight =
              gaussianKernel[ky + half] * gaussianKernel[kx + half];

            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
            a += data[idx + 3] * weight;
            totalWeight += weight;
          }
        }

        const outputIdx = (y * width + x) * 4;
        output[outputIdx] = r / totalWeight;
        output[outputIdx + 1] = g / totalWeight;
        output[outputIdx + 2] = b / totalWeight;
        output[outputIdx + 3] = a / totalWeight;
      }
    }

    return new ImageData(output, width, height);
  }

  private generateGaussianKernel(radius: number): number[] {
    const size = Math.ceil(radius) * 2 + 1;
    const kernel = new Array(size);
    const sigma = radius / 3;
    const twoSigmaSquare = 2 * sigma * sigma;
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let i = 0; i < size; i++) {
      const x = i - center;
      kernel[i] = Math.exp(-(x * x) / twoSigmaSquare);
      sum += kernel[i];
    }

    // Normalize
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  }

  private applySharpenFilter(imageData: ImageData): ImageData {
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    return this.applyConvolution(imageData, kernel, 3);
  }

  private applyEmbossFilter(imageData: ImageData): ImageData {
    const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
    return this.applyConvolution(imageData, kernel, 3);
  }

  private applyEdgeDetectFilter(imageData: ImageData): ImageData {
    const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
    return this.applyConvolution(imageData, kernel, 3);
  }

  private applyConvolution(
    imageData: ImageData,
    kernel: number[],
    kernelSize: number,
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data.length);
    const half = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx - half));
            const py = Math.max(0, Math.min(height - 1, y + ky - half));
            const idx = (py * width + px) * 4;
            const weight = kernel[ky * kernelSize + kx];

            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
          }
        }

        const outputIdx = (y * width + x) * 4;
        output[outputIdx] = Math.max(0, Math.min(255, r));
        output[outputIdx + 1] = Math.max(0, Math.min(255, g));
        output[outputIdx + 2] = Math.max(0, Math.min(255, b));
        output[outputIdx + 3] = data[outputIdx + 3]; // Keep original alpha
      }
    }

    return new ImageData(output, width, height);
  }

  private applyNoiseFilter(
    data: Uint8ClampedArray,
    amount: number,
    uniform: boolean,
  ): void {
    const intensity = (amount / 100) * 255;

    for (let i = 0; i < data.length; i += 4) {
      const noise = uniform
        ? (Math.random() - 0.5) * intensity * 2
        : (Math.random() * 2 - 1) * intensity;

      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
  }

  private applySepia(data?: Uint8ClampedArray): void {
    // If no data provided, get from active layer
    if (!data) {
      this.eventBus.emit("layer:get-active", (layer: Layer) => {
        if (layer) {
          const canvas = layer.canvas;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            this.applySepia(imageData.data);
            ctx.putImageData(imageData, 0, 0);
            this.eventBus.emit("layer:updated", layer.id);
            this.eventBus.emit("history:add-state", "Apply Sepia");
          }
        }
      });
      return;
    }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
  }

  private applyGrayscale(data?: Uint8ClampedArray): void {
    if (!data) {
      this.eventBus.emit("layer:get-active", (layer: Layer) => {
        if (layer) {
          const canvas = layer.canvas;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            this.applyGrayscale(imageData.data);
            ctx.putImageData(imageData, 0, 0);
            this.eventBus.emit("layer:updated", layer.id);
            this.eventBus.emit("history:add-state", "Apply Grayscale");
          }
        }
      });
      return;
    }

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }

  private applyInvert(data?: Uint8ClampedArray): void {
    if (!data) {
      this.eventBus.emit("layer:get-active", (layer: Layer) => {
        if (layer) {
          const canvas = layer.canvas;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            this.applyInvert(imageData.data);
            ctx.putImageData(imageData, 0, 0);
            this.eventBus.emit("layer:updated", layer.id);
            this.eventBus.emit("history:add-state", "Apply Invert");
          }
        }
      });
      return;
    }

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }

  private applyVintage(): void {
    this.eventBus.emit("layer:get-active", (layer: Layer) => {
      if (layer) {
        const canvas = layer.canvas;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Apply vintage effect (combination of sepia + vignette + grain)
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Sepia tone
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);

            // Add some grain
            const grain = (Math.random() - 0.5) * 20;
            data[i] = Math.max(0, Math.min(255, data[i] + grain));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
          }

          ctx.putImageData(imageData, 0, 0);
          this.eventBus.emit("layer:updated", layer.id);
          this.eventBus.emit("history:add-state", "Apply Vintage");
        }
      }
    });
  }

  private applyGaussianBlur(): void {
    this.openFilterDialog("blur");
  }

  private applySharpen(): void {
    this.applyFilter("sharpen");
  }

  private applyDustAndScratches(): void {
    // Simple noise reduction filter
    this.eventBus.emit("layer:get-active", (layer: Layer) => {
      if (layer) {
        const canvas = layer.canvas;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const filteredData = this.applyMedianFilter(imageData, 3);
          ctx.putImageData(filteredData, 0, 0);
          this.eventBus.emit("layer:updated", layer.id);
          this.eventBus.emit("history:add-state", "Apply Dust & Scratches");
        }
      }
    });
  }

  private applyMedianFilter(
    imageData: ImageData,
    kernelSize: number,
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data.length);
    const half = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const rValues = [],
          gValues = [],
          bValues = [];

        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const idx = (py * width + px) * 4;

            rValues.push(data[idx]);
            gValues.push(data[idx + 1]);
            bValues.push(data[idx + 2]);
          }
        }

        rValues.sort((a, b) => a - b);
        gValues.sort((a, b) => a - b);
        bValues.sort((a, b) => a - b);

        const median = Math.floor(rValues.length / 2);
        const outputIdx = (y * width + x) * 4;

        output[outputIdx] = rValues[median];
        output[outputIdx + 1] = gValues[median];
        output[outputIdx + 2] = bValues[median];
        output[outputIdx + 3] = data[outputIdx + 3];
      }
    }

    return new ImageData(output, width, height);
  }

  private applyOilPainting(): void {
    // Artistic oil painting effect
    this.eventBus.emit("layer:get-active", (layer: Layer) => {
      if (layer) {
        const canvas = layer.canvas;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const filteredData = this.applyOilPaintingFilter(imageData, 7, 55);
          ctx.putImageData(filteredData, 0, 0);
          this.eventBus.emit("layer:updated", layer.id);
          this.eventBus.emit("history:add-state", "Apply Oil Painting");
        }
      }
    });
  }

  private applyOilPaintingFilter(
    imageData: ImageData,
    radius: number,
    intensityLevels: number,
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const intensityCount = new Array(intensityLevels).fill(0);
        const avgR = new Array(intensityLevels).fill(0);
        const avgG = new Array(intensityLevels).fill(0);
        const avgB = new Array(intensityLevels).fill(0);

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const idx = (py * width + px) * 4;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const intensity = Math.floor(
              (((r + g + b) / 3) * (intensityLevels - 1)) / 255,
            );

            intensityCount[intensity]++;
            avgR[intensity] += r;
            avgG[intensity] += g;
            avgB[intensity] += b;
          }
        }

        let maxIndex = 0;
        for (let i = 1; i < intensityLevels; i++) {
          if (intensityCount[i] > intensityCount[maxIndex]) {
            maxIndex = i;
          }
        }

        const outputIdx = (y * width + x) * 4;
        output[outputIdx] = avgR[maxIndex] / intensityCount[maxIndex];
        output[outputIdx + 1] = avgG[maxIndex] / intensityCount[maxIndex];
        output[outputIdx + 2] = avgB[maxIndex] / intensityCount[maxIndex];
        output[outputIdx + 3] = data[outputIdx + 3];
      }
    }

    return new ImageData(output, width, height);
  }

  private applyWatercolor(): void {
    // Simple watercolor effect using blur and edge detection
    this.eventBus.emit("layer:get-active", (layer: Layer) => {
      if (layer) {
        const canvas = layer.canvas;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const blurredData = this.applyBlur(imageData, 3);
          ctx.putImageData(blurredData, 0, 0);
          this.eventBus.emit("layer:updated", layer.id);
          this.eventBus.emit("history:add-state", "Apply Watercolor");
        }
      }
    });
  }

  private applySketch(): void {
    // Pencil sketch effect
    this.eventBus.emit("layer:get-active", (layer: Layer) => {
      if (layer) {
        const canvas = layer.canvas;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Convert to grayscale first
          this.applyGrayscale(imageData.data);

          // Apply edge detection
          const edgeData = this.applyEdgeDetectFilter(imageData);

          // Invert colors for sketch effect
          this.applyInvert(edgeData.data);

          ctx.putImageData(edgeData, 0, 0);
          this.eventBus.emit("layer:updated", layer.id);
          this.eventBus.emit("history:add-state", "Apply Sketch");
        }
      }
    });
  }

  private applyEmboss(): void {
    this.applyFilter("emboss");
  }

  private applyEdgeDetect(): void {
    this.applyFilter("edge-detect");
  }
}
