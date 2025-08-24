import "./style.css";
import { PixelForge } from "./PixelForge";

// Global app instance
let app: PixelForge;

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    app = new PixelForge();
    await app.initialize();
    console.log("🎨 PixelForge is ready!");

    // Make app available globally for debugging
    (window as any).PixelForge = app;

    // Setup all UI functionality
    setupMenuSystem();
    setupToolSystem();
    setupKeyboardShortcuts();
    setupResponsiveDesign();
    setupMobileMenus();
  } catch (error) {
    console.error("Failed to initialize PixelForge:", error);
  }
});

// Setup Menu System
function setupMenuSystem() {
  // File Menu Actions
  const fileActions = {
    new: () => app.createNewDocument(),
    open: () => app.openFile(),
    save: () => app.saveProject(),
    "save-as": () => app.saveProjectAs(),
    export: () => app.exportDocument(),
    import: () => app.importFile(),
    close: () => console.log("Close document"),
    "close-all": () => app.closeAllDocuments(),
  };

  // Edit Menu Actions
  const editActions = {
    undo: () => app.performUndo(),
    redo: () => app.performRedo(),
    cut: () => console.log("Cut operation"),
    copy: () => console.log("Copy operation"),
    paste: () => console.log("Paste operation"),
    "select-all": () => console.log("Select all"),
    deselect: () => console.log("Deselect"),
    clear: () => console.log("Clear selection"),
  };

  // Image Menu Actions
  const imageActions = {
    resize: () => console.log("Resize image"),
    "canvas-size": () => console.log("Canvas size"),
    crop: () => console.log("Crop to selection"),
    "rotate-90-cw": () => console.log("Rotate 90° CW"),
    "rotate-90-ccw": () => console.log("Rotate 90° CCW"),
    "rotate-180": () => console.log("Rotate 180°"),
    "flip-horizontal": () => console.log("Flip horizontal"),
    "flip-vertical": () => console.log("Flip vertical"),
  };

  // Layer Menu Actions
  const layerActions = {
    "new-layer": () => app.addNewLayer(),
    "duplicate-layer": () => app.duplicateCurrentLayer(),
    "delete-layer": () => app.deleteCurrentLayer(),
    "layer-properties": () => console.log("Layer properties"),
    "flatten-image": () => console.log("Flatten image"),
    "merge-down": () => console.log("Merge down"),
  };

  // Filter Menu Actions
  const filterActions = {
    blur: () => app.applyBlur(),
    sharpen: () => app.applySharpen(),
    emboss: () => app.applyEmboss(),
    "edge-detect": () => app.applyEdgeDetect(),
    brightness: () => console.log("Brightness dialog"),
    contrast: () => console.log("Contrast dialog"),
    "hue-saturation": () => console.log("Hue/Saturation dialog"),
    "color-balance": () => console.log("Color balance dialog"),
  };

  // View Menu Actions
  const viewActions = {
    "zoom-in": () => app.zoomIn(),
    "zoom-out": () => app.zoomOut(),
    "zoom-to-fit": () => app.zoomToFit(),
    "actual-size": () => console.log("Actual size"),
    "toggle-grid": () => console.log("Toggle grid"),
    "toggle-rulers": () => console.log("Toggle rulers"),
  };

  // Help Menu Actions
  const helpActions = {
    about: () => console.log("About PixelForge"),
    shortcuts: () => console.log("Keyboard shortcuts"),
    docs: () => window.open("https://github.com/muhammad-fiaz/PixelForge#readme", "_blank"),
  };

  // Bind all actions
  const allActions = {
    ...fileActions,
    ...editActions,
    ...imageActions,
    ...layerActions,
    ...filterActions,
    ...viewActions,
    ...helpActions,
  };

  Object.entries(allActions).forEach(([action, handler]) => {
    const elements = document.querySelectorAll(`[data-action="${action}"]`);
    elements.forEach((element) => {
      element.addEventListener("click", handler);
    });
  });
}

// Setup Tool System
function setupToolSystem() {
  const tools = [
    "select",
    "marquee",
    "lasso",
    "brush",
    "pencil",
    "eraser",
    "clone",
    "rectangle",
    "circle",
    "line",
    "text",
    "gradient",
    "eyedropper",
    "zoom",
    "hand",
  ];

  tools.forEach((tool) => {
    const elements = document.querySelectorAll(`[data-tool="${tool}"]`);
    elements.forEach((element) => {
      element.addEventListener("click", () => {
        app.setTool(tool);
        // Update UI to show active tool
        document
          .querySelectorAll("[data-tool]")
          .forEach((el) => el.classList.remove("active"));
        element.classList.add("active");
      });
    });
  });

  // Color swatches and controls
  document
    .getElementById("swap-colors")
    ?.addEventListener("click", () => app.swapColors());
  document
    .getElementById("reset-colors")
    ?.addEventListener("click", () => app.resetColors());

  // Brush size and opacity controls
  const brushSizeSlider = document.getElementById(
    "brush-size",
  ) as HTMLInputElement;
  if (brushSizeSlider) {
    brushSizeSlider.addEventListener("input", (e) => {
      const size = parseInt((e.target as HTMLInputElement).value);
      app.setBrushSize(size);
    });
  }

  const brushOpacitySlider = document.getElementById(
    "brush-opacity",
  ) as HTMLInputElement;
  if (brushOpacitySlider) {
    brushOpacitySlider.addEventListener("input", (e) => {
      const opacity = parseInt((e.target as HTMLInputElement).value);
      app.setBrushOpacity(opacity);
    });
  }

  // Color picker
  const colorPicker = document.getElementById(
    "color-picker",
  ) as HTMLInputElement;
  if (colorPicker) {
    colorPicker.addEventListener("change", (e) => {
      const color = (e.target as HTMLInputElement).value;
      app.setColor(color);
    });
  }
}

// Setup Keyboard Shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // File shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          app.createNewDocument();
          break;
        case "o":
          e.preventDefault();
          app.openFile();
          break;
        case "s":
          e.preventDefault();
          if (e.shiftKey) {
            app.saveProjectAs();
          } else {
            app.saveProject();
          }
          break;
        case "z":
          e.preventDefault();
          if (e.shiftKey) {
            app.performRedo();
          } else {
            app.performUndo();
          }
          break;
        case "y":
          e.preventDefault();
          app.performRedo();
          break;
        case "w":
          e.preventDefault();
          console.log("Close document");
          break;
        case "e":
          e.preventDefault();
          app.exportDocument();
          break;
        case "=":
        case "+":
          e.preventDefault();
          app.zoomIn();
          break;
        case "-":
          e.preventDefault();
          app.zoomOut();
          break;
        case "0":
          e.preventDefault();
          app.zoomToFit();
          break;
      }
    }

    // Layer shortcuts
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      switch (e.key.toUpperCase()) {
        case "N":
          e.preventDefault();
          app.addNewLayer();
          break;
        case "D":
          e.preventDefault();
          app.duplicateCurrentLayer();
          break;
      }
    }

    // Tool shortcuts (no modifiers)
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case "v":
          app.setTool("select");
          break;
        case "m":
          app.setTool("marquee");
          break;
        case "l":
          app.setTool("lasso");
          break;
        case "b":
          app.setTool("brush");
          break;
        case "p":
          app.setTool("pencil");
          break;
        case "e":
          app.setTool("eraser");
          break;
        case "s":
          app.setTool("clone");
          break;
        case "u":
          app.setTool("rectangle");
          break;
        case "t":
          app.setTool("text");
          break;
        case "g":
          app.setTool("gradient");
          break;
        case "i":
          app.setTool("eyedropper");
          break;
        case "z":
          app.setTool("zoom");
          break;
        case "h":
          app.setTool("hand");
          break;
        case "x":
          app.swapColors();
          break;
        case "d":
          app.resetColors();
          break;
        case "delete":
        case "backspace":
          app.deleteCurrentLayer();
          break;
      }
    }

    // ESC key
    if (e.key === "Escape") {
      console.log("Cancel current operation");
    }
  });
}

// Setup dropdown menus and modals
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  // Handle modal close buttons
  if (
    target.classList.contains("modal-close") ||
    target.classList.contains("modal-cancel")
  ) {
    const modal = target.closest(".modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  // Handle create new document button
  if (
    target.classList.contains("create-new-btn") ||
    target.id === "create-document"
  ) {
    if (target.classList.contains("create-new-btn")) {
      // Show new document modal
      const modal = document.getElementById("new-document-modal");
      if (modal) {
        modal.classList.remove("hidden");
      }
    } else {
      // Create document with modal values
      const nameInput = document.getElementById(
        "new-doc-name",
      ) as HTMLInputElement;
      const widthInput = document.getElementById(
        "new-doc-width",
      ) as HTMLInputElement;
      const heightInput = document.getElementById(
        "new-doc-height",
      ) as HTMLInputElement;
      const backgroundSelect = document.getElementById(
        "new-doc-background",
      ) as HTMLSelectElement;

      const name = nameInput?.value || "Untitled";
      const width = parseInt(widthInput?.value || "1920");
      const height = parseInt(heightInput?.value || "1080");
      const background = backgroundSelect?.value || "white";

      // Create new document
      app.createNewDocument(name, width, height, background);

      // Close modal
      const modal = document.getElementById("new-document-modal");
      if (modal) {
        modal.classList.add("hidden");
      }
    }
  }

  // Handle open file button
  if (target.classList.contains("open-file-btn")) {
    app.openFile();
  }

  // Handle new tab button
  if (target.id === "new-tab-btn") {
    const modal = document.getElementById("new-document-modal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  // Handle zoom buttons
  if (target.id === "zoom-in") {
    app.zoomIn();
  } else if (target.id === "zoom-out") {
    app.zoomOut();
  }

  // Handle menu button clicks
  if (target.classList.contains("menu-item")) {
    const menuType = target.getAttribute("data-menu");
    const dropdown = document.getElementById(`${menuType}-menu`);

    // Hide all other dropdowns
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      if (menu !== dropdown) {
        menu.classList.add("hidden");
      }
    });

    // Toggle current dropdown
    if (dropdown) {
      dropdown.classList.toggle("hidden");

      // Position dropdown below button
      const rect = target.getBoundingClientRect();
      dropdown.style.position = "absolute";
      dropdown.style.top = `${rect.bottom}px`;
      dropdown.style.left = `${rect.left}px`;
    }
  }

  // Hide dropdowns when clicking outside
  if (
    !target.closest(".dropdown-menu") &&
    !target.classList.contains("menu-item")
  ) {
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      menu.classList.add("hidden");
    });
  }
});

// Prevent default browser drag and drop
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    app.importFile(files[0]);
  }
});

// Handle window resize
window.addEventListener("resize", () => {
  // Trigger responsive updates
  window.dispatchEvent(new Event("responsive-update"));
});

// Prevent accidental page navigation only when there are actual unsaved changes
// TODO: Implement proper unsaved changes detection
/*
window.addEventListener('beforeunload', (e) => {
  const hasUnsavedChanges = app.getAllDocuments().some(doc => !doc.saved);
  
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    return e.returnValue;
  }
});
*/

// Setup Responsive Design
function setupResponsiveDesign() {
  // Mobile panel toggle functionality
  const toggleToolsBtn = document.getElementById("toggle-tools");
  const toggleLayersBtn = document.getElementById("toggle-layers");
  const toolsPanel = document.getElementById("tools-panel");
  const layersPanel = document.getElementById("layers-panel");

  if (toggleToolsBtn && toolsPanel) {
    toggleToolsBtn.addEventListener("click", () => {
      toolsPanel.classList.toggle("-translate-x-full");
    });
  }

  if (toggleLayersBtn && layersPanel) {
    toggleLayersBtn.addEventListener("click", () => {
      layersPanel.classList.toggle("translate-x-full");
    });
  }

  // Close panels when clicking outside on mobile
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (window.innerWidth < 1024) {
      // Only on mobile/tablet
      // Close tools panel if clicking outside
      if (
        toolsPanel &&
        !toolsPanel.contains(target) &&
        !toggleToolsBtn?.contains(target)
      ) {
        toolsPanel.classList.add("-translate-x-full");
      }

      // Close layers panel if clicking outside
      if (
        layersPanel &&
        !layersPanel.contains(target) &&
        !toggleLayersBtn?.contains(target)
      ) {
        layersPanel.classList.add("translate-x-full");
      }
    }
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      // Reset panels on desktop
      toolsPanel?.classList.remove("-translate-x-full");
      layersPanel?.classList.remove("translate-x-full");
    } else {
      // Hide panels on mobile
      toolsPanel?.classList.add("-translate-x-full");
      layersPanel?.classList.add("translate-x-full");
    }
  });
}

// Setup Mobile Menu System
function setupMobileMenus() {
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileMenuClose = document.getElementById("mobile-menu-close");
  const mobileMenuBackdrop = document.getElementById("mobile-menu-backdrop");

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenu.classList.remove("hidden");
    });
  }

  if (mobileMenuClose && mobileMenu) {
    mobileMenuClose.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  }

  if (mobileMenuBackdrop && mobileMenu) {
    mobileMenuBackdrop.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  }

  // Close mobile menu when menu item is clicked
  const mobileMenuItems = mobileMenu?.querySelectorAll(".menu-item");
  mobileMenuItems?.forEach((item) => {
    item.addEventListener("click", () => {
      if (mobileMenu) {
        mobileMenu.classList.add("hidden");
      }
    });
  });
}
