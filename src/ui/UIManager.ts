import { EventBus } from "../core/EventBus";
import { gsap } from "gsap";

export class UIManager {
  private eventBus: EventBus;
  private activeModals: Set<string> = new Set();
  private tabs: Map<string, HTMLElement> = new Map();
  private activeTabId: string | null = null;
  private settingActiveTab = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public initialize(): void {
    this.setupMenus();
    this.setupModals();
    this.setupTabs();
    this.setupPanels();
    this.setupKeyboardShortcuts();
    this.setupResponsiveDesign();
  }

  private setupMenus(): void {
    // File menu
    const fileMenu = document.getElementById("file-menu");
    const fileDropdown = document.getElementById("file-dropdown");

    if (fileMenu && fileDropdown) {
      this.setupDropdownMenu(fileMenu, fileDropdown);
    }

    // Edit menu
    const editMenu = document.getElementById("edit-menu");
    const editDropdown = document.getElementById("edit-dropdown");

    if (editMenu && editDropdown) {
      this.setupDropdownMenu(editMenu, editDropdown);
    }

    // View menu
    const viewMenu = document.getElementById("view-menu");
    const viewDropdown = document.getElementById("view-dropdown");

    if (viewMenu && viewDropdown) {
      this.setupDropdownMenu(viewMenu, viewDropdown);
    }

    // Filter menu
    const filterMenu = document.getElementById("filter-menu");
    const filterDropdown = document.getElementById("filter-dropdown");

    if (filterMenu && filterDropdown) {
      this.setupDropdownMenu(filterMenu, filterDropdown);
    }

    // Layer menu
    const layerMenu = document.getElementById("layer-menu");
    const layerDropdown = document.getElementById("layer-dropdown");

    if (layerMenu && layerDropdown) {
      this.setupDropdownMenu(layerMenu, layerDropdown);
    }

    // Help menu
    const helpMenu = document.getElementById("help-menu");
    const helpDropdown = document.getElementById("help-dropdown");

    if (helpMenu && helpDropdown) {
      this.setupDropdownMenu(helpMenu, helpDropdown);
    }

    // Setup menu actions
    this.setupMenuActions();
  }

  private setupDropdownMenu(trigger: HTMLElement, dropdown: HTMLElement): void {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Close other dropdowns
      document.querySelectorAll(".dropdown").forEach((dd) => {
        if (dd !== dropdown) {
          dd.classList.add("hidden");
        }
      });

      // Toggle current dropdown
      dropdown.classList.toggle("hidden");

      if (!dropdown.classList.contains("hidden")) {
        gsap.fromTo(
          dropdown,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.2 },
        );
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !trigger.contains(e.target as Node) &&
        !dropdown.contains(e.target as Node)
      ) {
        dropdown.classList.add("hidden");
      }
    });
  }

  private setupMenuActions(): void {
    // File actions
    document.getElementById("menu-new")?.addEventListener("click", () => {
      this.openModal("new-document-modal");
    });

    document.getElementById("menu-open")?.addEventListener("click", () => {
      this.eventBus.emit("file:open");
    });

    document.getElementById("menu-save")?.addEventListener("click", () => {
      this.eventBus.emit("file:save");
    });

    document.getElementById("menu-save-as")?.addEventListener("click", () => {
      this.eventBus.emit("file:save-as");
    });

    document.getElementById("menu-export")?.addEventListener("click", () => {
      this.openModal("export-modal");
    });

    // Edit actions
    document.getElementById("menu-undo")?.addEventListener("click", () => {
      this.eventBus.emit("history:undo");
    });

    document.getElementById("menu-redo")?.addEventListener("click", () => {
      this.eventBus.emit("history:redo");
    });

    document.getElementById("menu-cut")?.addEventListener("click", () => {
      this.eventBus.emit("edit:cut");
    });

    document.getElementById("menu-copy")?.addEventListener("click", () => {
      this.eventBus.emit("edit:copy");
    });

    document.getElementById("menu-paste")?.addEventListener("click", () => {
      this.eventBus.emit("edit:paste");
    });

    // View actions
    document.getElementById("menu-zoom-in")?.addEventListener("click", () => {
      this.eventBus.emit("view:zoom-in");
    });

    document.getElementById("menu-zoom-out")?.addEventListener("click", () => {
      this.eventBus.emit("view:zoom-out");
    });

    document
      .getElementById("menu-fit-screen")
      ?.addEventListener("click", () => {
        this.eventBus.emit("view:fit-screen");
      });

    document
      .getElementById("menu-actual-size")
      ?.addEventListener("click", () => {
        this.eventBus.emit("view:actual-size");
      });

    // Filter actions will be handled by FilterManager

    // Layer actions
    document.getElementById("menu-add-layer")?.addEventListener("click", () => {
      this.eventBus.emit("layer:add");
    });

    document
      .getElementById("menu-duplicate-layer")
      ?.addEventListener("click", () => {
        this.eventBus.emit("layer:duplicate");
      });

    document
      .getElementById("menu-delete-layer")
      ?.addEventListener("click", () => {
        this.eventBus.emit("layer:delete");
      });

    document
      .getElementById("menu-merge-down")
      ?.addEventListener("click", () => {
        this.eventBus.emit("layer:merge-down");
      });

    document
      .getElementById("menu-flatten-image")
      ?.addEventListener("click", () => {
        this.eventBus.emit("layer:flatten-image");
      });

    // Help actions
    document.getElementById("menu-about")?.addEventListener("click", () => {
      this.openModal("about-modal");
    });
  }

  private setupModals(): void {
    // Close modal buttons
    document.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = (e.target as HTMLElement).closest(".modal");
        if (modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // Close modal when clicking backdrop
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // New Document Modal
    this.setupNewDocumentModal();

    // Export Modal
    this.setupExportModal();

    // Resize Canvas Modal
    this.setupResizeCanvasModal();

    // About Modal
    this.setupAboutModal();
  }

  private setupNewDocumentModal(): void {
    const modal = document.getElementById("new-document-modal");
    const createBtn = document.getElementById("create-document");

    if (!modal || !createBtn) return;

    // Preset selection
    const presetSelect = document.getElementById(
      "document-preset",
    ) as HTMLSelectElement;
    const widthInput = document.getElementById(
      "document-width",
    ) as HTMLInputElement;
    const heightInput = document.getElementById(
      "document-height",
    ) as HTMLInputElement;

    if (presetSelect && widthInput && heightInput) {
      presetSelect.addEventListener("change", () => {
        const preset = presetSelect.value;
        switch (preset) {
          case "hd":
            widthInput.value = "1920";
            heightInput.value = "1080";
            break;
          case "4k":
            widthInput.value = "3840";
            heightInput.value = "2160";
            break;
          case "a4":
            widthInput.value = "2480";
            heightInput.value = "3508";
            break;
          case "instagram":
            widthInput.value = "1080";
            heightInput.value = "1080";
            break;
          case "facebook":
            widthInput.value = "1200";
            heightInput.value = "630";
            break;
        }
      });
    }

    createBtn.addEventListener("click", () => {
      const name =
        (document.getElementById("document-name") as HTMLInputElement).value ||
        "Untitled";
      const width = parseInt(widthInput.value) || 1920;
      const height = parseInt(heightInput.value) || 1080;
      const backgroundColor = (
        document.getElementById("document-bg-color") as HTMLInputElement
      ).value;

      this.eventBus.emit("document:create", {
        name,
        width,
        height,
        backgroundColor,
      });

      this.closeModal("new-document-modal");
    });
  }

  private setupExportModal(): void {
    const modal = document.getElementById("export-modal");
    const exportBtn = document.getElementById("export-document");

    if (!modal || !exportBtn) return;

    exportBtn.addEventListener("click", () => {
      const format = (
        document.getElementById("export-format") as HTMLSelectElement
      ).value;
      const quality = parseInt(
        (document.getElementById("export-quality") as HTMLInputElement).value,
      );

      this.eventBus.emit("document:export", { format, quality });
      this.closeModal("export-modal");
    });
  }

  private setupResizeCanvasModal(): void {
    const modal = document.getElementById("resize-canvas-modal");
    const resizeBtn = document.getElementById("resize-canvas-confirm");

    if (!modal || !resizeBtn) return;

    resizeBtn.addEventListener("click", () => {
      const width = parseInt(
        (document.getElementById("new-canvas-width") as HTMLInputElement).value,
      );
      const height = parseInt(
        (document.getElementById("new-canvas-height") as HTMLInputElement)
          .value,
      );

      this.eventBus.emit("document:resize", { width, height });
      this.closeModal("resize-canvas-modal");
    });
  }

  private setupAboutModal(): void {
    // About modal is mostly static, just needs close functionality which is already handled
  }

  private setupTabs(): void {
    const tabsContainer = document.getElementById("tabs-container");
    if (!tabsContainer) return;

    // Listen for new documents
    this.eventBus.on("document:created", (document: any) => {
      this.addTab(document.id, document.name);
    });

    this.eventBus.on("document:opened", (document: any) => {
      this.addTab(document.id, document.name);
    });

    this.eventBus.on("document:closed", (documentId: string) => {
      this.removeTab(documentId);
    });

    this.eventBus.on(
      "document:renamed",
      (data: { id: string; name: string }) => {
        this.updateTabName(data.id, data.name);
      },
    );
  }

  private setupPanels(): void {
    // Tools panel toggle
    const toolsToggle = document.getElementById("toggle-tools");
    const toolsPanel = document.getElementById("tools-panel");

    if (toolsToggle && toolsPanel) {
      toolsToggle.addEventListener("click", () => {
        toolsPanel.classList.toggle("hidden");
        this.animatePanel(toolsPanel);
      });
    }

    // Layers panel toggle
    const layersToggle = document.getElementById("toggle-layers");
    const layersPanel = document.getElementById("layers-panel");

    if (layersToggle && layersPanel) {
      layersToggle.addEventListener("click", () => {
        layersPanel.classList.toggle("hidden");
        this.animatePanel(layersPanel);
      });
    }

    // Color panel toggle
    const colorToggle = document.getElementById("toggle-color");
    const colorPanel = document.getElementById("color-panel");

    if (colorToggle && colorPanel) {
      colorToggle.addEventListener("click", () => {
        colorPanel.classList.toggle("hidden");
        this.animatePanel(colorPanel);
      });
    }
  }

  private animatePanel(panel: HTMLElement): void {
    if (!panel.classList.contains("hidden")) {
      gsap.fromTo(
        panel,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3 },
      );
    }
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener("keydown", (e) => {
      // Modal shortcuts
      if (e.key === "Escape") {
        this.closeAllModals();
      }

      // UI shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "n":
            e.preventDefault();
            this.openModal("new-document-modal");
            break;
          case "o":
            e.preventDefault();
            this.eventBus.emit("file:open");
            break;
          case "s":
            e.preventDefault();
            if (e.shiftKey) {
              this.eventBus.emit("file:save-as");
            } else {
              this.eventBus.emit("file:save");
            }
            break;
          case "w":
            e.preventDefault();
            this.eventBus.emit("document:close");
            break;
        }
      }

      // Tab shortcuts
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        this.switchToNextTab();
      }
    });
  }

  private setupResponsiveDesign(): void {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const handleResponsive = (e: MediaQueryListEvent | MediaQueryList) => {
      const isMobile = e.matches;

      if (isMobile) {
        // Hide panels on mobile
        document.getElementById("tools-panel")?.classList.add("hidden");
        document.getElementById("layers-panel")?.classList.add("hidden");
        document.getElementById("color-panel")?.classList.add("hidden");

        // Add mobile class
        document.body.classList.add("mobile-view");
      } else {
        // Show panels on desktop
        document.getElementById("tools-panel")?.classList.remove("hidden");
        document.getElementById("layers-panel")?.classList.remove("hidden");
        document.getElementById("color-panel")?.classList.remove("hidden");

        // Remove mobile class
        document.body.classList.remove("mobile-view");
      }
    };

    mediaQuery.addEventListener("change", handleResponsive);
    handleResponsive(mediaQuery);
  }

  public openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove("hidden");
    this.activeModals.add(modalId);

    // Animate modal
    gsap.fromTo(
      modal,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3 },
    );

    // Focus trap
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }

  public closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    gsap.to(modal, {
      opacity: 0,
      scale: 0.8,
      duration: 0.2,
      onComplete: () => {
        modal.classList.add("hidden");
        this.activeModals.delete(modalId);
      },
    });
  }

  public closeAllModals(): void {
    this.activeModals.forEach((modalId) => {
      this.closeModal(modalId);
    });
  }

  public addTab(documentId: string, documentName: string): void {
    const tabsContainer = document.getElementById("tabs-container");
    if (!tabsContainer) return;

    const tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.documentId = documentId;

    const tabName = document.createElement("span");
    tabName.textContent = documentName;

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.className = "tab-close";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.eventBus.emit("document:close", documentId);
    });

    tab.appendChild(tabName);
    tab.appendChild(closeBtn);

    tab.addEventListener("click", () => {
      this.setActiveTab(documentId);
    });

    tabsContainer.appendChild(tab);
    this.tabs.set(documentId, tab);
    this.setActiveTab(documentId);

    // Animate tab
    gsap.fromTo(
      tab,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.3 },
    );
  }

  public removeTab(documentId: string): void {
    const tab = this.tabs.get(documentId);
    if (!tab) return;

    gsap.to(tab, {
      opacity: 0,
      x: -20,
      duration: 0.2,
      onComplete: () => {
        tab.remove();
        this.tabs.delete(documentId);

        if (this.activeTabId === documentId) {
          // Switch to another tab
          const remainingTabs = Array.from(this.tabs.keys());
          if (remainingTabs.length > 0) {
            this.setActiveTab(remainingTabs[0]);
          } else {
            this.activeTabId = null;
          }
        }
      },
    });
  }

  public setActiveTab(documentId: string): void {
    // Prevent infinite loop
    if (this.settingActiveTab) return;
    this.settingActiveTab = true;

    try {
      // Update tab appearance
      this.tabs.forEach((tab, id) => {
        if (id === documentId) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });

      this.activeTabId = documentId;
      // Don't emit event to prevent circular dependency
      // this.eventBus.emit('document:set-active', documentId);
    } finally {
      this.settingActiveTab = false;
    }
  }

  public updateTabName(documentId: string, newName: string): void {
    const tab = this.tabs.get(documentId);
    if (!tab) return;

    const nameSpan = tab.querySelector("span");
    if (nameSpan) {
      nameSpan.textContent = newName;
    }
  }

  private switchToNextTab(): void {
    const tabIds = Array.from(this.tabs.keys());
    if (tabIds.length <= 1) return;

    const currentIndex = tabIds.indexOf(this.activeTabId || "");
    const nextIndex = (currentIndex + 1) % tabIds.length;
    this.setActiveTab(tabIds[nextIndex]);
  }

  public showNotification(
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
  ): void {
    // Ensure a notification container exists with very high z-index so toasts appear above UI
    let container = document.getElementById("notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "notification-container";
      // Container sits at top-right above all UI layers. Use documentElement to avoid body stacking contexts
      container.style.position = "fixed";
      container.style.top = "16px";
      container.style.right = "16px";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "8px";
      container.style.zIndex = "99999";
      container.style.pointerEvents = "none";
      // Prevent transform or filter from creating a new stacking context
      container.style.transform = "none";
      container.style.willChange = "opacity";
      (document.documentElement || document.body).appendChild(container);
    }

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    // Individual notification should allow pointer events for actions (if any)
    notification.style.pointerEvents = "auto";
    notification.style.background = "rgba(31,41,55,0.95)"; // Tailwind gray-800
    notification.style.color = "#fff";
    notification.style.padding = "10px 14px";
    notification.style.borderRadius = "8px";
    notification.style.boxShadow = "0 6px 18px rgba(0,0,0,0.4)";
    notification.style.maxWidth = "320px";
    notification.style.fontSize = "14px";
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-10px)";

    // Color accents per type
    switch (type) {
      case "success":
        notification.style.borderLeft = "4px solid #10B981";
        break;
      case "warning":
        notification.style.borderLeft = "4px solid #F59E0B";
        break;
      case "error":
        notification.style.borderLeft = "4px solid #EF4444";
        break;
      default:
        notification.style.borderLeft = "4px solid #3B82F6";
    }

    container.appendChild(notification);

    // Animate in
    gsap.to(notification, {
      opacity: 1,
      y: 0,
      duration: 0.28,
      ease: "power2.out",
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
      gsap.to(notification, {
        opacity: 0,
        y: -10,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => notification.remove(),
      });
    }, 3000);
  }
}
