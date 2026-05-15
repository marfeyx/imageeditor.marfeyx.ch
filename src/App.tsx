import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import * as fabric from "fabric";
import * as UTIF from "utif";
import { AccountProfile } from "./accountProfile";

type AuthMode = "login" | "register";
type ToolMode = "select" | "draw" | "erase" | "crop";
type ExportFormat = "png" | "jpeg" | "webp" | "svg";
type ShapeKind = "rect" | "circle" | "line" | "arrow" | "star" | "speech";

type StickerResult = {
  id: string;
  title: string;
  previewUrl: string;
  fullUrl: string;
};

const contactEmail = "contact.marfeyx@gmail.com";
const maxAuthAttempts = 5;
const authLockoutMs = 60 * 1000;
const maxAuthSubmissions = 5;
const authRateLimitWindowMs = 60 * 1000;
const acceptedTypes =
  "image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif,image/tiff,.tif,.tiff";
const openMojiBaseUrl = "https://cdn.jsdelivr.net/npm/openmoji@16.0.0/color/svg";
const openMojiCatalog = [
  { id: "1F389", title: "Party popper", keywords: "celebration party confetti success birthday" },
  { id: "2728", title: "Sparkles", keywords: "sparkle magic shine celebration" },
  { id: "1F525", title: "Fire", keywords: "hot fire flame lit" },
  { id: "2B50", title: "Star", keywords: "star favorite rating shine" },
  { id: "2764", title: "Heart", keywords: "heart love like red" },
  { id: "1F600", title: "Grinning face", keywords: "smile happy face" },
  { id: "1F602", title: "Face with tears of joy", keywords: "laugh funny joy face" },
  { id: "1F60E", title: "Smiling face with sunglasses", keywords: "cool sunglasses face" },
  { id: "1F44D", title: "Thumbs up", keywords: "like yes approve hand" },
  { id: "1F44F", title: "Clapping hands", keywords: "clap applause hands" },
  { id: "1F4F7", title: "Camera", keywords: "photo camera image" },
  { id: "270F", title: "Pencil", keywords: "draw pencil edit write" },
  { id: "2705", title: "Check mark button", keywords: "check done success yes" },
  { id: "274C", title: "Cross mark", keywords: "x no error delete" },
  { id: "26A0", title: "Warning", keywords: "warning alert caution" },
  { id: "26A1", title: "Lightning", keywords: "lightning energy fast" },
  { id: "1F680", title: "Rocket", keywords: "rocket launch fast" },
  { id: "1F451", title: "Crown", keywords: "crown king queen premium" },
  { id: "1F3C6", title: "Trophy", keywords: "trophy winner award" },
  { id: "26BD", title: "Soccer ball", keywords: "soccer football sport ball" },
  { id: "1F355", title: "Pizza", keywords: "pizza food slice" },
  { id: "1F381", title: "Wrapped gift", keywords: "gift present birthday" },
  { id: "1F388", title: "Balloon", keywords: "balloon party birthday" },
  { id: "1F431", title: "Cat face", keywords: "cat pet animal face" },
  { id: "1F436", title: "Dog face", keywords: "dog pet animal face" },
  { id: "1F33B", title: "Sunflower", keywords: "flower nature plant" },
  { id: "1F333", title: "Deciduous tree", keywords: "tree nature plant" },
  { id: "1F3B5", title: "Musical note", keywords: "music note sound" },
  { id: "1F697", title: "Car", keywords: "car auto vehicle" },
  { id: "2708", title: "Airplane", keywords: "airplane travel flight" },
  { id: "1F4B0", title: "Money bag", keywords: "money cash finance" },
  { id: "1F3AE", title: "Video game", keywords: "game controller play gaming" },
  { id: "1F4BB", title: "Laptop", keywords: "computer laptop work code" },
  { id: "1F4A1", title: "Light bulb", keywords: "idea light bulb smart" },
  { id: "1F4A5", title: "Collision", keywords: "boom explosion impact comic" },
  { id: "1F4AF", title: "Hundred points", keywords: "100 perfect score" },
  { id: "1F4AC", title: "Speech balloon", keywords: "speech chat message bubble" },
  { id: "1F50D", title: "Magnifying glass", keywords: "search zoom inspect" },
  { id: "1F511", title: "Key", keywords: "key login password account" },
  { id: "1F512", title: "Locked", keywords: "lock secure private privacy" },
  { id: "1F513", title: "Unlocked", keywords: "unlock open access" },
  { id: "1F6A9", title: "Triangular flag", keywords: "flag marker report" },
  { id: "1F6E0", title: "Hammer and wrench", keywords: "tools repair settings edit" },
  { id: "1F5BC", title: "Framed picture", keywords: "image picture photo art" },
  { id: "1F58C", title: "Paintbrush", keywords: "paint brush art draw" },
  { id: "1F58D", title: "Crayon", keywords: "crayon draw color art" },
  { id: "1F3A8", title: "Artist palette", keywords: "palette paint color art" },
  { id: "1F308", title: "Rainbow", keywords: "rainbow color bright" },
  { id: "2600", title: "Sun", keywords: "sun sunny weather light" },
  { id: "1F319", title: "Crescent moon", keywords: "moon night dark" },
  { id: "2601", title: "Cloud", keywords: "cloud weather sky" },
  { id: "2744", title: "Snowflake", keywords: "snow ice winter cold" },
  { id: "1F30A", title: "Water wave", keywords: "water ocean wave" },
  { id: "1F339", title: "Rose", keywords: "rose flower love" },
  { id: "1F48E", title: "Gem stone", keywords: "diamond gem jewel premium" },
  { id: "1F48C", title: "Love letter", keywords: "letter mail love heart" },
  { id: "1F514", title: "Bell", keywords: "bell notification alert" },
  { id: "1F3AF", title: "Direct hit", keywords: "target goal bullseye" },
  { id: "1F6D2", title: "Shopping cart", keywords: "shop cart buy store" },
  { id: "1F37F", title: "Popcorn", keywords: "popcorn movie snack" },
  { id: "1F37A", title: "Beer mug", keywords: "beer drink cheers" },
  { id: "2615", title: "Hot beverage", keywords: "coffee tea drink" },
  { id: "1F37D", title: "Fork and knife with plate", keywords: "food dinner plate" },
  { id: "1F30D", title: "Globe", keywords: "world earth globe travel" },
  { id: "1F3E0", title: "House", keywords: "home house building" },
  { id: "1F4CD", title: "Round pushpin", keywords: "pin location marker" },
  { id: "23F0", title: "Alarm clock", keywords: "time clock alarm" },
  { id: "1F4C5", title: "Calendar", keywords: "calendar date schedule" },
  { id: "1F4E6", title: "Package", keywords: "box package delivery" },
];

(fabric.FabricObject as any).customProperties = ["name", "editorRole"];

const initialAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  pixelate: 0,
  grayscale: false,
  sepia: false,
};

export default function App() {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const baseImageRef = useRef<fabric.FabricImage | null>(null);
  const cropRectRef = useRef<fabric.Rect | null>(null);
  const historyRef = useRef<string[]>([]);
  const redoRef = useRef<string[]>([]);
  const isRestoringRef = useRef(false);
  const isErasingRef = useRef(false);
  const toolModeRef = useRef<ToolMode>("select");
  const pendingShapeRef = useRef<ShapeKind | null>(null);
  const authUserRef = useRef<User | null>(null);
  const authSubmissionTimes = useRef<number[]>([]);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [accountActionError, setAccountActionError] = useState("");
  const [authFailures, setAuthFailures] = useState(0);
  const [authLockedUntil, setAuthLockedUntil] = useState<number | null>(null);
  const [authRateLimitedUntil, setAuthRateLimitedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [hasCropSelection, setHasCropSelection] = useState(false);
  const [pendingShape, setPendingShape] = useState<ShapeKind | null>(null);
  const [brushColor, setBrushColor] = useState("#0f7b5f");
  const [brushSize, setBrushSize] = useState(14);
  const [fillColor, setFillColor] = useState("#ffffff");
  const [strokeColor, setStrokeColor] = useState("#102a24");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(46);
  const [fontFamily, setFontFamily] = useState("Inter");
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(800);
  const [status, setStatus] = useState("Sign in, then open an image to begin.");
  const [error, setError] = useState("");
  const [activeObjectLabel, setActiveObjectLabel] = useState("No selection");
  const [zoom, setZoom] = useState(0.72);
  const [adjustments, setAdjustments] = useState(initialAdjustments);

  const [stickerQuery, setStickerQuery] = useState("celebration");
  const [stickers, setStickers] = useState<StickerResult[]>(() => getOpenMojiStickers("celebration"));
  const [isSearchingStickers, setIsSearchingStickers] = useState(false);
  const [stickerError, setStickerError] = useState("");

  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [exportQuality, setExportQuality] = useState(0.95);
  const [exportScale, setExportScale] = useState(1);

  const isAuthLocked = Boolean(authLockedUntil && authLockedUntil > now);
  const isAuthRateLimited = Boolean(authRateLimitedUntil && authRateLimitedUntil > now);
  const isAuthBlocked = isAuthLocked || isAuthRateLimited;
  const lockoutSeconds = authLockedUntil ? Math.max(0, Math.ceil((authLockedUntil - now) / 1000)) : 0;
  const rateLimitSeconds = authRateLimitedUntil ? Math.max(0, Math.ceil((authRateLimitedUntil - now) / 1000)) : 0;
  const authBlockSeconds = Math.max(lockoutSeconds, rateLimitSeconds);
  const authBlockMessage = isAuthLocked
    ? `Too many failed attempts. Try again in ${lockoutSeconds} seconds.`
    : isAuthRateLimited
      ? `Too many submissions. Try again in ${rateLimitSeconds} seconds.`
      : "";

  const canUseEditor = Boolean(authUser);
  const hasImage = Boolean(baseImageRef.current);

  const canvasStyle = useMemo(
    () => ({
      width: `${canvasWidth}px`,
      height: `${canvasHeight}px`,
      transform: `scale(${zoom})`,
    }),
    [canvasHeight, canvasWidth, zoom],
  );

  useEffect(() => {
    if (!canvasElementRef.current) return;

    const canvas = new fabric.Canvas(canvasElementRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "",
      preserveObjectStacking: true,
      selection: true,
    });

    canvasRef.current = canvas;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    configureBrush(canvas, brushColor, brushSize, toolMode);

    const save = () => saveHistory();
    const updateSelection = () => updateActiveObjectLabel();
    canvas.on("object:added", save);
    canvas.on("object:modified", save);
    canvas.on("object:removed", save);
    canvas.on("path:created", (event: any) => {
      const path = event.path as fabric.Path | undefined;
      if (!path) return;

      if (toolModeRef.current === "erase") {
        isErasingRef.current = true;
        erasePaintUnderPath(canvas, path);
        canvas.remove(path);
        isErasingRef.current = false;
        canvas.renderAll();
        saveHistory(true);
        return;
      }

      path.set({
        name: "Paint stroke",
        editorRole: "paint",
        selectable: true,
        evented: true,
      } as any);
      canvas.renderAll();
      saveHistory(true);
    });
    canvas.on("selection:created", updateSelection);
    canvas.on("selection:updated", updateSelection);
    canvas.on("selection:cleared", updateSelection);
    canvas.on("mouse:down", (event) => {
      if (!baseImageRef.current) return;
      const pointer = (canvas as any).getScenePoint(event.e) as { x: number; y: number };
      if (pointer.x < 0 || pointer.y < 0 || pointer.x > canvas.getWidth() || pointer.y > canvas.getHeight()) return;

      if (pendingShapeRef.current) {
        const shapeToPlace = pendingShapeRef.current;
        placeShape(shapeToPlace, pointer.x, pointer.y);
        pendingShapeRef.current = null;
        setPendingShape(null);
        setStatus(`${labelForShape(shapeToPlace)} placed.`);
        return;
      }

      if (toolModeRef.current !== "crop" || cropRectRef.current) return;
      createCropRect(pointer.x, pointer.y);
    });
    saveHistory();

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    authUserRef.current = authUser;
    if (!authUser && fileInputRef.current) fileInputRef.current.value = "";
  }, [authUser]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
      setAuthUser(data.user);
      setIsAuthReady(true);
      if (!data.user) setIsAuthModalOpen(true);
    });

    const {
      data: { subscription },
      setAuthUser(session?.user ?? null);
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    toolModeRef.current = toolMode;
    configureBrush(canvas, brushColor, brushSize, toolMode);
    canvas.isDrawingMode = canUseEditor && (toolMode === "draw" || toolMode === "erase");
    canvas.selection = toolMode !== "crop";
    canvas.getObjects().forEach((object) => {
      object.selectable = toolMode !== "crop";
      object.evented = toolMode !== "crop";
    });
    canvas.renderAll();
  }, [brushColor, brushSize, canUseEditor, toolMode]);

  useEffect(() => {
    function handleCropKeys(event: KeyboardEvent) {
      if (toolModeRef.current !== "crop") return;
      if (event.key === "Enter" && cropRectRef.current) {
        event.preventDefault();
        void applyCrop();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setTool("select");
      }
    }

    window.addEventListener("keydown", handleCropKeys);
    return () => window.removeEventListener("keydown", handleCropKeys);
  }, []);

  useEffect(() => {
    applyImageFilters();
  }, [adjustments]);

  function requireAuth(): boolean {
    if (authUser) return true;
    setAuthError("");
    setIsAuthModalOpen(true);
    return false;
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isAuthBlocked) {
      setAuthError(authBlockMessage);
      return;
    }

    const email = normalizeEmail(authEmail);
    const displayName = authDisplayName.trim();
    const validationError = validateCredentials(email, authPassword, authMode === "register" ? displayName : "");
    if (validationError) {
      setAuthError(validationError);
      return;
    }

    const rateLimitError = registerAuthSubmission();
    if (rateLimitError) {
      setAuthError(rateLimitError);
      return;
    }

    setIsAuthenticating(true);
    setAuthError("");
    try {
      const result =
        authMode === "login"
              email,
              password: authPassword,
              options: { data: { display_name: displayName } },
            });

      if (result.error) {
        if (shouldCountAuthFailure(result.error, authMode)) registerAuthFailure();
        setAuthError(getAuthErrorMessage(result.error, authMode));
        return;
      }

      setAuthFailures(0);
      setAuthLockedUntil(null);
      setAuthPassword("");
      setIsAuthModalOpen(false);
      if (authMode === "register" && !result.data.session) {
        setAuthError("Check your email to confirm your account before signing in.");
        setAuthMode("login");
        setIsAuthModalOpen(true);
      }
    } catch {
    } finally {
      setIsAuthenticating(false);
    }
  }

    authUserRef.current = null;
    setAuthUser(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus("Signed out. Sign in again to keep editing.");
  }

  async function handleChangeAccount() {
    authUserRef.current = null;
    setAuthUser(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAuthEmail("");
    setAuthPassword("");
    setAuthDisplayName("");
    setAuthMode("login");
    setAuthError("");
    setAccountActionError("");
    setIsAuthModalOpen(true);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!authUserRef.current) {
      setError("Sign in before opening an image file.");
      setIsAuthModalOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError("");
    setStatus(`Opening ${file.name}...`);

    try {
      const dataUrl = await fileToDisplayUrl(file);
      const image = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
      const width = Math.max(1, Math.round(image.width || 1200));
      const height = Math.max(1, Math.round(image.height || 800));
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.clear();
      canvas.backgroundColor = "";
      canvas.setDimensions({ width, height });
      setCanvasWidth(width);
      setCanvasHeight(height);
      image.set({
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
        selectable: false,
        evented: false,
        objectCaching: false,
        name: "Base image",
      });
      baseImageRef.current = image;
      canvas.add(image);
      canvas.sendObjectToBack(image);
      setAdjustments(initialAdjustments);
      canvas.renderAll();
      historyRef.current = [];
      redoRef.current = [];
      saveHistory();
      setStatus(`${file.name} loaded at ${width} x ${height}px.`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "This image could not be opened.");
      setStatus("Open a different image file.");
    }
  }

  function setTool(nextTool: ToolMode) {
    if (!requireAuth()) return;
    pendingShapeRef.current = null;
    setPendingShape(null);
    setToolMode(nextTool);
    if (nextTool === "crop") {
      setStatus("Click the image to place a crop box, then drag its edge handles.");
      removeCropRect(false);
      return;
    }
    removeCropRect(false);
  }

  function addText() {
    if (!requireAuth()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = new fabric.Textbox("Double click to edit", {
      left: canvasWidth * 0.12,
      top: canvasHeight * 0.15,
      width: Math.min(520, canvasWidth * 0.6),
      fontSize,
      fontFamily,
      fill: strokeColor,
      backgroundColor: "rgba(255,255,255,0)",
      name: "Text",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }

  function armShape(kind: ShapeKind) {
    if (!requireAuth()) return;
    if (!baseImageRef.current) {
      setError("Open an image before adding shapes.");
      return;
    }
    pendingShapeRef.current = kind;
    setPendingShape(kind);
    setToolMode("select");
    removeCropRect(false);
    setStatus(`Click the image where the ${labelForShape(kind).toLowerCase()} should appear.`);
  }

  function placeShape(kind: ShapeKind, x: number, y: number) {
    if (!requireAuth()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const common = {
      left: x,
      top: y,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      originX: "center" as const,
      originY: "center" as const,
    };
    let shape: fabric.Object;
    if (kind === "rect") {
      shape = new fabric.Rect({ ...common, width: 220, height: 140, rx: 10, ry: 10 });
    } else if (kind === "circle") {
      shape = new fabric.Circle({ ...common, radius: 90 });
    } else if (kind === "line") {
      shape = new fabric.Line([-130, 0, 130, 0], { ...common, fill: "" });
    } else if (kind === "arrow") {
      const line = new fabric.Line([0, 0, 220, 0], { stroke: strokeColor, strokeWidth, selectable: false });
      const head = new fabric.Triangle({
        left: 220,
        top: 0,
        originX: "center",
        originY: "center",
        angle: 90,
        width: 28,
        height: 34,
        fill: strokeColor,
        selectable: false,
      });
      shape = new fabric.Group([line, head], { ...common, fill: "" });
    } else if (kind === "speech") {
      shape = new fabric.Path("M 0 0 L 260 0 Q 286 0 286 26 L 286 126 Q 286 152 260 152 L 94 152 L 44 196 L 56 152 L 26 152 Q 0 152 0 126 L 0 26 Q 0 0 26 0 Z", {
        ...common,
        scaleX: 0.9,
        scaleY: 0.9,
      });
    } else {
      shape = new fabric.Polygon(makeStarPoints(5, 95, 42), { ...common });
    }
    shape.set("name", labelForShape(kind));
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  }

  function updateActiveObject(property: string, value: string | number) {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object) return;
    object.set(property as keyof fabric.Object, value as never);
    canvas.requestRenderAll();
    saveHistory();
  }

  function deleteSelection() {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || object === baseImageRef.current) return;
    canvas.remove(object);
    canvas.discardActiveObject();
    canvas.renderAll();
  }

  function duplicateSelection() {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || object === baseImageRef.current) return;
    object.clone().then((clone: fabric.Object) => {
      clone.set({ left: (object.left || 0) + 24, top: (object.top || 0) + 24 });
      canvas.add(clone);
      canvas.setActiveObject(clone);
      canvas.renderAll();
    });
  }

  function arrangeSelection(action: "front" | "back" | "forward" | "backward") {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || object === baseImageRef.current) return;
    if (action === "front") canvas.bringObjectToFront(object);
    if (action === "back") {
      canvas.sendObjectToBack(object);
      if (baseImageRef.current) canvas.sendObjectToBack(baseImageRef.current);
    }
    if (action === "forward") canvas.bringObjectForward(object);
    if (action === "backward") {
      canvas.sendObjectBackwards(object);
      if (baseImageRef.current) canvas.sendObjectToBack(baseImageRef.current);
    }
    canvas.renderAll();
    saveHistory();
  }

  function flipCanvas(axis: "x" | "y") {
    if (!requireAuth()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach((object) => {
      if (axis === "x") {
        object.set({ left: canvasWidth - (object.left || 0) - object.getScaledWidth(), flipX: !object.flipX });
      } else {
        object.set({ top: canvasHeight - (object.top || 0) - object.getScaledHeight(), flipY: !object.flipY });
      }
      object.setCoords();
    });
    canvas.renderAll();
    saveHistory();
  }

  function rotateSelection(degrees: number) {
    const canvas = canvasRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || object === baseImageRef.current) return;
    object.rotate(((object.angle || 0) + degrees) % 360);
    object.setCoords();
    canvas.renderAll();
    saveHistory();
  }

  function resizeCanvas(nextWidth: number, nextHeight: number, scaleContent: boolean) {
    if (!requireAuth()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    nextWidth = clamp(Math.round(nextWidth), 1, 8000);
    nextHeight = clamp(Math.round(nextHeight), 1, 8000);
    const scaleX = nextWidth / canvasWidth;
    const scaleY = nextHeight / canvasHeight;
    if (scaleContent) {
      canvas.getObjects().forEach((object) => {
        object.set({
          left: (object.left || 0) * scaleX,
          top: (object.top || 0) * scaleY,
          scaleX: (object.scaleX || 1) * scaleX,
          scaleY: (object.scaleY || 1) * scaleY,
        });
        object.setCoords();
      });
    }
    canvas.setDimensions({ width: nextWidth, height: nextHeight });
    setCanvasWidth(nextWidth);
    setCanvasHeight(nextHeight);
    canvas.renderAll();
    saveHistory();
  }

  function expandCanvas(padX: number, padY: number) {
    if (!requireAuth()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach((object) => {
      object.set({ left: (object.left || 0) + padX, top: (object.top || 0) + padY });
      object.setCoords();
    });
    const nextWidth = canvasWidth + padX * 2;
    const nextHeight = canvasHeight + padY * 2;
    canvas.setDimensions({ width: nextWidth, height: nextHeight });
    setCanvasWidth(nextWidth);
    setCanvasHeight(nextHeight);
    canvas.renderAll();
    saveHistory();
  }

  function createCropRect(originX = canvasWidth / 2, originY = canvasHeight / 2) {
    const canvas = canvasRef.current;
    if (!canvas || !canUseEditor) return;
    removeCropRect(false);
    const width = Math.min(canvasWidth * 0.72, Math.max(180, canvasWidth - 40));
    const height = Math.min(canvasHeight * 0.72, Math.max(140, canvasHeight - 40));
    const rect = new fabric.Rect({
      left: clamp(originX - width / 2, 0, Math.max(0, canvasWidth - width)),
      top: clamp(originY - height / 2, 0, Math.max(0, canvasHeight - height)),
      width,
      height,
      fill: "rgba(10, 143, 104, 0.08)",
      stroke: "#0a8f68",
      strokeDashArray: [12, 8],
      strokeWidth: 4,
      cornerColor: "#0a8f68",
      cornerStrokeColor: "#ffffff",
      cornerStyle: "circle",
      cornerSize: 18,
      transparentCorners: false,
      borderColor: "#0a8f68",
      borderScaleFactor: 2,
      name: "Crop area",
    });
    cropRectRef.current = rect;
    setHasCropSelection(true);
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }

  async function applyCrop() {
    const canvas = canvasRef.current;
    const crop = cropRectRef.current;
    if (!canvas || !crop) return;
    const left = clamp(Math.round(crop.left || 0), 0, canvasWidth - 1);
    const top = clamp(Math.round(crop.top || 0), 0, canvasHeight - 1);
    const width = clamp(Math.round(crop.getScaledWidth()), 1, canvasWidth - left);
    const height = clamp(Math.round(crop.getScaledHeight()), 1, canvasHeight - top);
    canvas.remove(crop);
    cropRectRef.current = null;
    setHasCropSelection(false);
    canvas.discardActiveObject();
    const sourceUrl = canvas.toDataURL({ format: "png", left, top, width, height, multiplier: 1 });
    const image = await fabric.FabricImage.fromURL(sourceUrl, { crossOrigin: "anonymous" });
    canvas.clear();
    canvas.backgroundColor = "";
    canvas.setDimensions({ width, height });
    setCanvasWidth(width);
    setCanvasHeight(height);
    image.set({ left: 0, top: 0, originX: "left", originY: "top", selectable: false, evented: false, name: "Base image" });
    baseImageRef.current = image;
    canvas.add(image);
    canvas.renderAll();
    setToolMode("select");
    saveHistory();
  }

  function removeCropRect(render = true) {
    const canvas = canvasRef.current;
    if (!canvas || !cropRectRef.current) return;
    canvas.remove(cropRectRef.current);
    cropRectRef.current = null;
    setHasCropSelection(false);
    if (render) canvas.renderAll();
  }

  function searchStickers() {
    setStickerError("");
    const query = stickerQuery.trim();
    if (!query) {
      setStickers(getOpenMojiStickers(""));
      return;
    }
    setIsSearchingStickers(true);
    const results = getOpenMojiStickers(query);
    setStickers(results);
    if (!results.length) setStickerError(`No OpenMoji stickers found for "${query}".`);
    setIsSearchingStickers(false);
  }

  async function addSticker(sticker: StickerResult) {
    if (!requireAuth()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const image = await fabric.FabricImage.fromURL(sticker.fullUrl, { crossOrigin: "anonymous" });
      const maxSize = Math.min(canvasWidth, canvasHeight) * 0.28;
      image.scaleToWidth(Math.min(maxSize, image.width || maxSize));
      image.set({
        left: canvasWidth * 0.36,
        top: canvasHeight * 0.32,
        name: sticker.title,
      });
      canvas.add(image);
      canvas.setActiveObject(image);
      canvas.renderAll();
    } catch {
      setStickerError("This OpenMoji sticker could not be added. Try another result.");
    }
  }

  function exportImage() {
    if (!requireAuth()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    removeCropRect(false);
    const filename = `marfeyx-services-image-${Date.now()}.${exportFormat === "jpeg" ? "jpg" : exportFormat}`;
    let dataUrl: string;
    if (exportFormat === "svg") {
      const svg = canvas.toSVG();
      dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    } else {
      dataUrl = canvas.toDataURL({
        format: exportFormat,
        quality: exportQuality,
        multiplier: exportScale,
      });
    }
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
    setStatus(`Downloaded ${filename}.`);
  }

  function saveHistory(force = false) {
    const canvas = canvasRef.current;
    if (!canvas || isRestoringRef.current || isErasingRef.current) return;
    if (!force && (toolModeRef.current === "draw" || toolModeRef.current === "erase")) return;
    const json = JSON.stringify(canvas.toJSON());
    if (historyRef.current[historyRef.current.length - 1] !== json) {
      historyRef.current.push(json);
      if (historyRef.current.length > 40) historyRef.current.shift();
      redoRef.current = [];
    }
  }

  async function restoreFrom(json: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isRestoringRef.current = true;
    await canvas.loadFromJSON(json);
    baseImageRef.current =
      (canvas.getObjects().find((object) => object.get("name") === "Base image") as fabric.FabricImage | undefined) ||
      null;
    canvas.renderAll();
    isRestoringRef.current = false;
  }

  async function undo() {
    if (historyRef.current.length <= 1) return;
    const current = historyRef.current.pop();
    if (current) redoRef.current.push(current);
    const previous = historyRef.current[historyRef.current.length - 1];
    if (previous) await restoreFrom(previous);
  }

  async function redo() {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(next);
    await restoreFrom(next);
  }

  function updateActiveObjectLabel() {
    const object = canvasRef.current?.getActiveObject();
    if (!object) setActiveObjectLabel("No selection");
    else setActiveObjectLabel(String(object.get("name") || object.type || "Object"));
  }

  function registerAuthSubmission(): string {
    const timestamp = Date.now();
    const windowStart = timestamp - authRateLimitWindowMs;
    authSubmissionTimes.current = authSubmissionTimes.current.filter((attemptedAt) => attemptedAt > windowStart);
    if (authSubmissionTimes.current.length >= maxAuthSubmissions) {
      const retryAt = authSubmissionTimes.current[0] + authRateLimitWindowMs;
      setAuthRateLimitedUntil(retryAt);
      return `Too many attempts. Try again in ${Math.ceil((retryAt - timestamp) / 1000)} seconds.`;
    }
    authSubmissionTimes.current.push(timestamp);
    return "";
  }

  function registerAuthFailure() {
    const nextFailures = authFailures + 1;
    setAuthFailures(nextFailures);
    if (nextFailures >= maxAuthAttempts) {
      setAuthLockedUntil(Date.now() + authLockoutMs);
      setAuthFailures(0);
    }
  }

  function applyImageFilters() {
    const image = baseImageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) return;
    const filtersList: any[] = [];
    const filters = (fabric as any).filters;
    if (adjustments.brightness) filtersList.push(new filters.Brightness({ brightness: adjustments.brightness / 100 }));
    if (adjustments.contrast) filtersList.push(new filters.Contrast({ contrast: adjustments.contrast / 100 }));
    if (adjustments.saturation) filtersList.push(new filters.Saturation({ saturation: adjustments.saturation / 100 }));
    if (adjustments.blur) filtersList.push(new filters.Blur({ blur: adjustments.blur / 100 }));
    if (adjustments.pixelate) filtersList.push(new filters.Pixelate({ blocksize: adjustments.pixelate }));
    if (adjustments.grayscale) filtersList.push(new filters.Grayscale());
    if (adjustments.sepia) filtersList.push(new filters.Sepia());
    image.filters = filtersList;
    image.applyFilters();
    canvas.renderAll();
  }

  return (
    <>
      <div className="mobile-disabled">
        <div className="mobile-disabled-card">
          <p className="eyebrow">Desktop editor</p>
          <h1>Open Web Image Editor on a wider screen.</h1>
          <p>The editing canvas and side panels need desktop space to keep tools usable.</p>
        </div>
      </div>

      <main className="app-shell">
        <aside className="control-panel left-panel">
          <div>
            <p className="eyebrow">Private browser editor</p>
            <h1>Web Image Editor</h1>
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          {authUser ? (
            <>
              <button className="file-drop" type="button" onClick={() => fileInputRef.current?.click()} disabled={!isAuthReady}>
                <span className="file-icon">+</span>
                <span>Open image file</span>
                <small>PNG, JPEG, WebP, GIF, BMP, SVG</small>
              </button>
              <input
                ref={fileInputRef}
                className="hidden-file-input"
                type="file"
                accept={acceptedTypes}
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </>
          ) : (
            <button className="file-drop" type="button" onClick={() => setIsAuthModalOpen(true)} disabled={!isAuthReady}>
              <span className="file-icon">+</span>
              <span>Sign in to open images</span>
              <small>Image upload is locked until login</small>
            </button>
          )}

          <section className="tool-section">
            <h2>Tools</h2>
            <div className="segmented">
              {(["select", "draw", "erase", "crop"] as ToolMode[]).map((tool) => (
                <button key={tool} type="button" className={toolMode === tool ? "active" : ""} onClick={() => setTool(tool)}>
                  {tool}
                </button>
              ))}
            </div>
          </section>

          <section className="tool-section">
            <h2>Paint</h2>
            <label className="field">
              Color
              <input type="color" value={brushColor} onChange={(event) => setBrushColor(event.target.value)} />
            </label>
            <label className="field">
              Brush size <span>{brushSize}px</span>
              <input type="range" min="2" max="90" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} />
            </label>
          </section>

          <section className="tool-section">
            <h2>Add</h2>
            <button type="button" onClick={addText} disabled={!canUseEditor}>
              Text
            </button>
            <div className="shape-grid">
              {(["rect", "circle", "line", "arrow", "star", "speech"] as ShapeKind[]).map((shape) => (
                <button
                  key={shape}
                  type="button"
                  className={pendingShape === shape ? "active" : ""}
                  onClick={() => armShape(shape)}
                  disabled={!canUseEditor}
                >
                  {labelForShape(shape)}
                </button>
              ))}
            </div>
            <label className="field">
              Fill
              <input type="color" value={fillColor} onChange={(event) => setFillColor(event.target.value)} />
            </label>
            <label className="field">
              Stroke
              <input type="color" value={strokeColor} onChange={(event) => setStrokeColor(event.target.value)} />
            </label>
            <label className="field">
              Stroke width <span>{strokeWidth}px</span>
              <input type="range" min="0" max="28" value={strokeWidth} onChange={(event) => setStrokeWidth(Number(event.target.value))} />
            </label>
          </section>

          <section className="tool-section">
            <h2>Text Style</h2>
            <label className="field">
              Font
              <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}>
                <option>Inter</option>
                <option>Arial</option>
                <option>Georgia</option>
                <option>Impact</option>
                <option>Courier New</option>
              </select>
            </label>
            <label className="field">
              Font size <span>{fontSize}px</span>
              <input type="range" min="12" max="180" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
            </label>
            <button type="button" onClick={() => updateActiveObject("fontSize", fontSize)}>
              Apply to selection
            </button>
          </section>
        </aside>

        <section className="editor-stage" aria-label="Image canvas">
          <div className="stage-toolbar">
            <AccountProfile
              compact
              className="header-account"
              user={authUser}
              isAuthReady={isAuthReady}
              onSignOut={handleSignOut}
              onChangeAccount={handleChangeAccount}
              onLogin={() => setIsAuthModalOpen(true)}
              deleteHref={`mailto:${contactEmail}?subject=Delete%20account%20request&body=${encodeURIComponent(
                `Please delete my Web Image Editor account.

Account: ${authUser?.email ?? (authUser ? getDisplayUsername(authUser) : "")}

`,
              )}`}
            />
            <div className="toolbar-actions">
              {toolMode === "crop" ? (
                <div className="crop-actions" aria-label="Crop actions">
                  <button type="button" onClick={applyCrop} disabled={!hasCropSelection}>
                    Apply crop
                  </button>
                  <button type="button" onClick={() => setTool("select")}>
                    Cancel
                  </button>
                </div>
              ) : null}
              <button type="button" onClick={undo}>
                Undo
              </button>
              <button type="button" onClick={redo}>
                Redo
              </button>
              <label>
                Zoom
                <input type="range" min="0.2" max="1.5" step="0.02" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              </label>
            </div>
          </div>
          <div className="canvas-scroll">
            <div className="canvas-frame" style={canvasStyle}>
              <canvas ref={canvasElementRef} />
            </div>
          </div>
        </section>

        <aside className="control-panel right-panel">
          <section className="tool-section">
            <h2>Resolution</h2>
            <div className="size-grid">
              <label className="field">
                Width
                <input type="number" min="1" max="8000" value={canvasWidth} onChange={(event) => setCanvasWidth(Number(event.target.value))} />
              </label>
              <label className="field">
                Height
                <input type="number" min="1" max="8000" value={canvasHeight} onChange={(event) => setCanvasHeight(Number(event.target.value))} />
              </label>
            </div>
            <div className="button-row">
              <button type="button" onClick={() => resizeCanvas(canvasWidth, canvasHeight, true)}>
                Resize image
              </button>
              <button type="button" onClick={() => resizeCanvas(canvasWidth, canvasHeight, false)}>
                Resize canvas
              </button>
            </div>
            <button type="button" onClick={() => expandCanvas(120, 120)}>
              Expand 120px each side
            </button>
          </section>

          <section className="tool-section">
            <h2>Selection</h2>
            <div className="button-row">
              <button type="button" onClick={duplicateSelection}>
                Duplicate
              </button>
              <button type="button" onClick={deleteSelection}>
                Delete
              </button>
            </div>
            <div className="button-row">
              <button type="button" onClick={() => rotateSelection(-15)}>
                Rotate -15
              </button>
              <button type="button" onClick={() => rotateSelection(15)}>
                Rotate +15
              </button>
            </div>
            <div className="button-row">
              <button type="button" onClick={() => arrangeSelection("forward")}>
                Forward
              </button>
              <button type="button" onClick={() => arrangeSelection("backward")}>
                Backward
              </button>
            </div>
            <div className="button-row">
              <button type="button" onClick={() => flipCanvas("x")}>
                Flip X
              </button>
              <button type="button" onClick={() => flipCanvas("y")}>
                Flip Y
              </button>
            </div>
            <label className="field">
              Opacity
              <input type="range" min="0" max="1" step="0.05" defaultValue="1" onChange={(event) => updateActiveObject("opacity", Number(event.target.value))} />
            </label>
          </section>

          <section className="tool-section">
            <h2>Image Adjustments</h2>
            <AdjustmentSlider label="Brightness" value={adjustments.brightness} min={-100} max={100} onChange={(value) => setAdjustments({ ...adjustments, brightness: value })} />
            <AdjustmentSlider label="Contrast" value={adjustments.contrast} min={-100} max={100} onChange={(value) => setAdjustments({ ...adjustments, contrast: value })} />
            <AdjustmentSlider label="Saturation" value={adjustments.saturation} min={-100} max={100} onChange={(value) => setAdjustments({ ...adjustments, saturation: value })} />
            <AdjustmentSlider label="Blur" value={adjustments.blur} min={0} max={100} onChange={(value) => setAdjustments({ ...adjustments, blur: value })} />
            <AdjustmentSlider label="Pixelate" value={adjustments.pixelate} min={0} max={40} onChange={(value) => setAdjustments({ ...adjustments, pixelate: value })} />
            <label className="check-field">
              <input type="checkbox" checked={adjustments.grayscale} onChange={(event) => setAdjustments({ ...adjustments, grayscale: event.target.checked })} />
              Grayscale
            </label>
            <label className="check-field">
              <input type="checkbox" checked={adjustments.sepia} onChange={(event) => setAdjustments({ ...adjustments, sepia: event.target.checked })} />
              Sepia
            </label>
          </section>

          <section className="tool-section">
            <h2>OpenMoji Stickers</h2>
            <div className="search-row">
              <input
                value={stickerQuery}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setStickerQuery(nextQuery);
                  setStickerError("");
                  setStickers(getOpenMojiStickers(nextQuery));
                }}
                onKeyDown={(event) => (event.key === "Enter" ? searchStickers() : null)}
              />
              <button type="button" onClick={searchStickers} disabled={isSearchingStickers}>
                Search
              </button>
            </div>
            {stickerError ? <p className="inline-error">{stickerError}</p> : null}
            <div className="sticker-grid">
              {stickers.map((sticker) => (
                <button key={sticker.id} type="button" onClick={() => addSticker(sticker)} title={sticker.title}>
                  <img src={sticker.previewUrl} alt={sticker.title} />
                </button>
              ))}
            </div>
            {!stickers.length && !stickerError ? <p className="inline-error">No OpenMoji stickers found.</p> : null}
            <a className="powered-link" href="https://openmoji.org" target="_blank" rel="noreferrer">
              OpenMoji CC BY-SA 4.0
            </a>
          </section>

          <section className="tool-section">
            <h2>Download</h2>
            <label className="field">
              Format
              <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)}>
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
                <option value="svg">SVG</option>
              </select>
            </label>
            <label className="field">
              Quality <span>{Math.round(exportQuality * 100)}%</span>
              <input type="range" min="0.35" max="1" step="0.01" value={exportQuality} onChange={(event) => setExportQuality(Number(event.target.value))} />
            </label>
            <label className="field">
              Scale <span>{exportScale}x</span>
              <input type="range" min="0.25" max="4" step="0.25" value={exportScale} onChange={(event) => setExportScale(Number(event.target.value))} />
            </label>
            <button className="primary-action" type="button" onClick={exportImage} disabled={!canUseEditor || !hasImage}>
              Download image
            </button>
          </section>

          <footer className="footer-links">
            <div className="privacy-note">
            </div>
            <a href="privacy.html">Privacy Policy</a>
            <a href={`mailto:${contactEmail}?subject=Web%20Image%20Editor%20Issue`}>Report issues</a>
            {accountActionError ? <p className="inline-error">{accountActionError}</p> : null}
          </footer>
        </aside>
      </main>

      {isAuthModalOpen ? (
        <AuthModal
          mode={authMode}
          email={authEmail}
          password={authPassword}
          displayName={authDisplayName}
          error={authError}
          isSubmitting={isAuthenticating}
          isLocked={isAuthBlocked}
          lockoutSeconds={authBlockSeconds}
          lockedMessage={authBlockMessage}
          onModeChange={(mode) => {
            setAuthMode(mode);
            setAuthError("");
          }}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onDisplayNameChange={setAuthDisplayName}
          onClose={() => {
            if (!isAuthenticating) setIsAuthModalOpen(false);
          }}
          onSubmit={handleAuthSubmit}
        />
      ) : null}
    </>
  );
}

function AuthModal({
  mode,
  email,
  password,
  displayName,
  error,
  isSubmitting,
  isLocked,
  lockoutSeconds,
  lockedMessage,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onDisplayNameChange,
  onClose,
  onSubmit,
}: {
  mode: AuthMode;
  email: string;
  password: string;
  displayName: string;
  error: string;
  isSubmitting: boolean;
  isLocked: boolean;
  lockoutSeconds: number;
  lockedMessage: string;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const title = mode === "login" ? "Login to edit" : "Create account";
  return (
    <div className="auth-backdrop" role="presentation">
      <form className="auth-modal" onSubmit={onSubmit} aria-label={title}>
        <div className="auth-modal-header">
          <div>
            <p className="eyebrow">Account required</p>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close authentication dialog">
            x
          </button>
        </div>
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => onModeChange("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => onModeChange("register")}>
            Register
          </button>
        </div>
        {mode === "register" ? (
          <label className="field">
            Display name
            <input value={displayName} onChange={(event) => onDisplayNameChange(event.target.value)} autoComplete="name" />
          </label>
        ) : null}
        <label className="field">
          Email
          <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} autoComplete="email" />
        </label>
        <label className="field">
          Password
          <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </label>
        {error ? <p className="error-message">{error}</p> : null}
        {isLocked ? <p className="auth-hint">{lockedMessage || `Try again in ${lockoutSeconds} seconds.`}</p> : null}
        <button className="auth-submit" type="submit" disabled={isSubmitting || isLocked}>
          {isSubmitting ? "Working..." : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </div>
  );
}

function AdjustmentSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      {label} <span>{value}</span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

async function fileToDisplayUrl(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();
  if (file.type === "image/tiff" || lowerName.endsWith(".tif") || lowerName.endsWith(".tiff")) {
    const buffer = await file.arrayBuffer();
    const ifds = UTIF.decode(buffer);
    if (!ifds.length) throw new Error("No readable TIFF image was found.");
    UTIF.decodeImage(buffer, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);
    const imageData = new ImageData(new Uint8ClampedArray(rgba), ifds[0].width, ifds[0].height);
    const canvas = document.createElement("canvas");
    canvas.width = ifds[0].width;
    canvas.height = ifds[0].height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The browser could not decode this TIFF.");
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  }
  if (!file.type.startsWith("image/") && !lowerName.endsWith(".svg")) {
    throw new Error("Choose a supported image file.");
  }
  return URL.createObjectURL(file);
}

function getOpenMojiStickers(query: string): StickerResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!terms.length) return openMojiCatalog.slice(0, 18).map(toStickerResult);

  const matches = openMojiCatalog.filter((sticker) => {
    const haystack = `${sticker.title} ${sticker.keywords} ${sticker.id}`.toLowerCase();
    return terms.every((term) => haystack.includes(term) || normalizeStickerTerm(term).some((alias) => haystack.includes(alias)));
  });
  return matches.slice(0, 18).map(toStickerResult);
}

function toStickerResult(sticker: (typeof openMojiCatalog)[number]): StickerResult {
  const url = `${openMojiBaseUrl}/${sticker.id}.svg`;
  return {
    id: sticker.id,
    title: sticker.title,
    previewUrl: url,
    fullUrl: url,
  };
}

function normalizeStickerTerm(term: string): string[] {
  const aliases: Record<string, string[]> = {
    happy: ["smile", "joy", "celebration"],
    sad: ["cry", "face"],
    funny: ["laugh", "joy"],
    cool: ["sunglasses"],
    ok: ["check", "thumbs"],
    okay: ["check", "thumbs"],
    yes: ["check", "thumbs"],
    no: ["cross", "delete"],
    delete: ["cross"],
    success: ["check", "trophy", "celebration"],
    error: ["cross", "warning"],
    alert: ["warning", "bell"],
    photo: ["camera", "image", "picture"],
    picture: ["image", "photo"],
    drawing: ["draw", "paint"],
    brush: ["paint"],
    party: ["celebration", "balloon", "gift"],
    birthday: ["celebration", "gift", "balloon"],
    love: ["heart", "rose"],
    money: ["cash", "finance"],
    location: ["pin", "marker"],
    gaming: ["game"],
    computer: ["laptop"],
  };
  return aliases[term] || [];
}

function configureBrush(canvas: fabric.Canvas, color: string, size: number, tool: ToolMode) {
  if (!canvas.freeDrawingBrush) canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.width = size;
  canvas.freeDrawingBrush.color = tool === "erase" ? "rgba(10, 143, 104, 0.38)" : color;
}

function erasePaintUnderPath(canvas: fabric.Canvas, eraserPath: fabric.Path) {
  const eraserBounds = eraserPath.getBoundingRect();
  const eraserPadding = Math.max(8, (eraserPath.strokeWidth || 1) / 2);
  const eraserArea = {
    left: eraserBounds.left - eraserPadding,
    top: eraserBounds.top - eraserPadding,
    width: eraserBounds.width + eraserPadding * 2,
    height: eraserBounds.height + eraserPadding * 2,
  };

  const objectsToRemove = canvas
    .getObjects()
    .filter((object) => object !== eraserPath && isPaintStroke(object) && rectanglesOverlap(eraserArea, object.getBoundingRect()));

  objectsToRemove.forEach((object) => canvas.remove(object));
}

function isPaintStroke(object: fabric.Object): boolean {
  return object.get("editorRole" as keyof fabric.Object) === "paint" || object.get("name" as keyof fabric.Object) === "Paint stroke";
}

function rectanglesOverlap(
  first: { left: number; top: number; width: number; height: number },
  second: { left: number; top: number; width: number; height: number },
): boolean {
  return (
    first.left < second.left + second.width &&
    first.left + first.width > second.left &&
    first.top < second.top + second.height &&
    first.top + first.height > second.top
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateCredentials(email: string, password: string, displayName: string): string {
  if (!email || !email.includes("@")) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (displayName !== undefined && displayName.length > 0 && displayName.length < 2) return "Display name is too short.";
  return "";
}

function getDisplayUsername(user: User): string {
  const displayName = user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim()) return displayName.trim();
  return user.email || "account";
}

function getAuthErrorMessage(error: AuthError, mode: AuthMode): string {
  const code = getAuthErrorCode(error);
  const message = error.message.toLowerCase();
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) return "Confirm your email address before signing in.";
  if (code === "user_already_exists" || message.includes("already registered")) return "An account already exists for this email. Login instead.";
  if (code === "signup_disabled" || message.includes("signups not allowed")) return "New account registration is currently disabled.";
  if (code === "invalid_credentials" || message.includes("invalid login")) return "Email or password is incorrect.";
  if (code === "weak_password" || message.includes("weak password")) return "Choose a stronger password.";
  if (mode === "register") return "Could not create this account. Check the details and try again.";
  return "Could not login. Check the details and try again.";
}

function shouldCountAuthFailure(error: AuthError, mode: AuthMode): boolean {
  const code = getAuthErrorCode(error);
  return mode === "login" && (code === "invalid_credentials" || error.message.toLowerCase().includes("invalid"));
}

function getAuthErrorCode(error: AuthError): string {
  return typeof error.code === "string" ? error.code : "";
}

function labelForShape(shape: ShapeKind): string {
  return {
    rect: "Rectangle",
    circle: "Circle",
    line: "Line",
    arrow: "Arrow",
    star: "Star",
    speech: "Callout",
  }[shape];
}

function makeStarPoints(points: number, outerRadius: number, innerRadius: number) {
  const coordinates = [];
  const step = Math.PI / points;
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    coordinates.push({
      x: outerRadius + Math.cos(index * step - Math.PI / 2) * radius,
      y: outerRadius + Math.sin(index * step - Math.PI / 2) * radius,
    });
  }
  return coordinates;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
