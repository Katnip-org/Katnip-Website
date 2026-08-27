/// <reference types="@turbowarp/types" />

// Hand-written types for @turbowarp/scaffolding 0.4.0. The package ships a types.d.ts, but it
// covers ~10 members and its /// reference to @turbowarp/types is a path that only resolves for a
// non-hoisted install. tsconfig.app.json maps the import here instead.
// Transcribed from node_modules/@turbowarp/scaffolding/src/*.js — check it if 0.4.0 ever moves.

declare module "@turbowarp/scaffolding" {
  type VM = import("scratch-vm");
  type Renderer = import("scratch-render");
  type Storage = import("scratch-storage");
  type AudioEngine = import("scratch-audio");


  type ScalarValue = number | string | boolean;

  interface CloudProvider {
    /** Set by CloudManager.addProvider. */
    manager?: CloudManager;
    /** Called once the loaded project is known to use cloud variables. */
    enable(): void;
    handleUpdateVariable(name: string, value: ScalarValue): void;
  }

  class CloudManager {
    constructor(parent: Scaffolding);
    parent: Scaffolding;
    providers: CloudProvider[];
    overrides: Map<string, CloudProvider | null>;
    hasCloudData(): boolean;
    projectReady(): void;
    getUsername(): string | undefined;
    addProvider(provider: CloudProvider): void;
    /** provider must already be added; null routes the variable to nothing. */
    addProviderOverride(name: string, provider: CloudProvider | null): void;
    updateVariable(name: string, value: ScalarValue): void;
    setVariable(provider: CloudProvider, name: string, value: ScalarValue): void;
    // no-ops, present because the VM's cloud provider interface requires them
    requestCloseConnection(): void;
    createVariable(name: string, value: ScalarValue): void;
    renameVariable(oldName: string, newName: string): void;
    deleteVariable(name: string): void;
  }

  class WebSocketProvider implements CloudProvider {
    /** cloudHost entries must start with ws: or wss:; tried in order until one connects. */
    constructor(cloudHost: string[] | string, projectId: string);
    manager?: CloudManager;
    cloudHosts: string[];
    projectId: string;
    ws: WebSocket | null;
    enable(): void;
    setProjectId(id: string): void;
    openConnection(): void;
    closeAndReconnect(): void;
    canWriteToServer(): boolean;
    writeToServer(message: unknown): void;
    bufferedWriteToServer(message: unknown): void;
    sendBufferedMessages(): void;
    handleUpdateVariable(name: string, value: ScalarValue): void;
  }

  class LocalStorageProvider implements CloudProvider {
    constructor(key?: string);
    manager?: CloudManager;
    key: string;
    variables: Record<string, ScalarValue>;
    enable(): void;
    readFromLocalStorage(): void;
    storeToLocalStorage(): void;
    handleUpdateVariable(name: string, value: ScalarValue): void;
  }

  class ControlBar {
    root: HTMLDivElement;
    start: HTMLDivElement;
    end: HTMLDivElement;
    hasItem: boolean;
    addToStart(el: HTMLElement): void;
    addToEnd(el: HTMLElement): void;
    computeHeight(): number;
  }

  class VideoProvider {
    enableVideo(): Promise<unknown>;
    disableVideo(): void;
    getFrame(options: {
      dimensions?: [number, number];
      mirror?: boolean;
      format?: "image-data" | "canvas";
      cacheTimeout?: number;
    }): ImageData | HTMLCanvasElement | null;
  }

  /** Message ids live in src/messages.json: var-x, var-y, list-empty, list-length, ... */
  type Messages = Record<string, string>;

  /**
   * Emits "PROJECT_RUN_START" and "PROJECT_RUN_STOP" as plain Events.
   * Anything richer comes off `vm` (an EventEmitter, not an EventTarget).
   */
  class Scaffolding extends EventTarget {
    // --- settings; all must be set before setup() ---
    width: number;
    height: number;
    resizeMode: "preserve-ratio" | "dynamic-resize" | "stretch";
    editableLists: boolean;
    shouldConnectPeripherals: boolean;
    /** Needs a VM with convertToPackagedRuntime (TurboWarp only). */
    usePackagedRuntime: boolean;
    messages: Messages;

    // --- created by setup(); undefined before it ---
    vm: VM;
    renderer: Renderer;
    storage: Storage;
    /** Absent when AudioContext is unavailable. */
    audioEngine?: AudioEngine;
    cloudManager: CloudManager;
    videoProvider: VideoProvider;
    bitmapAdapter: unknown;
    layersRect: DOMRect;

    /** Builds the VM, renderer, storage, audio and input listeners. Call once. */
    setup(): void;
    appendTo(element: HTMLElement): void;
    /** Re-fits the stage. Window resizes are handled already; container resizes are not. */
    relayout(): void;

    loadProject(data: ArrayBuffer | Uint8Array | string | object): Promise<void>;
    /** start() and greenFlag() are the same thing: vm.start() then vm.greenFlag(). */
    start(): void;
    greenFlag(): void;
    stopAll(): void;

    setUsername(username: string): void;
    /** color as #abcdef. */
    setAccentColor(color: string): void;
    addControlButton(options: { element: HTMLElement; where: "top-left" | "top-right" }): void;
    getMessage(id: string): string;
    /** Shows the ask-and-wait prompt; resolves with what the user typed. */
    ask(text: string): Promise<string>;

    addCloudProvider(provider: CloudProvider): void;
    addCloudProviderOverride(name: string, provider: CloudProvider | null): void;
    setExtensionSecurityManager(manager: Record<string, unknown>): void;

    // Stage-scoped only; throw if the global variable/list does not exist.
    getVariable(name: string): ScalarValue;
    setVariable(name: string, value: ScalarValue): void;
    getList(name: string): ScalarValue[];
    setList(name: string, value: ScalarValue[]): void;
  }

  const Packages: {
    VM: typeof import("scratch-vm");
    Renderer: typeof import("scratch-render");
    AudioEngine: typeof import("scratch-audio");
    Storage: typeof import("scratch-storage");
    SVGRenderer: any;
    JSZip: any;
  };

  const CloudVariables: {
    CloudManager: typeof CloudManager;
    WebSocketProvider: typeof WebSocketProvider;
    LocalStorageProvider: typeof LocalStorageProvider;
  };

  export { Scaffolding, CloudVariables, Packages, ControlBar, VideoProvider };
  export type { CloudProvider, ScalarValue, Messages };

  /** Not a real export; it is the CJS bundle's namespace as seen through Vite's interop. */
  const _default: { Scaffolding: typeof Scaffolding; CloudVariables: typeof CloudVariables; Packages: typeof Packages };
  export default _default;
}
