// @ts-nocheck
import {
    bootstrapCameraKit,
    CameraKit,
    CameraKitSession,
    CameraKitSource,
    createMediaStreamSource,
    Lens,
} from "@snap/camera-kit";

const stagingApiToken = import.meta.env.VITE_STAGING_API_KEY;
const lensGroupRepository = import.meta.env.VITE_LENS_GROUP;

// cameraKit
var isInitialized: boolean = false;
var cameraKit: CameraKit;
var session: CameraKitSession;
var lenses: Lens[] = [];

// camera
var mediaSource: MediaStream;
var camera_width: Number = 0;
var camera_height: Number = 0;
var snapSource: CameraKitSource;

// HTML elements
var root_div: HTMLDivElement;
var original_div: HTMLDivElement;
var snap_div: HTMLDivElement;
var original_video: HTMLVideoElement;


function setLenses(l: Lens[]) {
    lenses = l;
}

function set_left() {
    try {
        root_div.removeChild(snap_div);
    } catch (e) {}

    root_div.appendChild(original_div);
    root_div.appendChild(snap_div);

    snap_div.style.setProperty("right", "50%");
    snap_div.style.setProperty("width", (camera_width/2).toString()+"px");

    original_div.style.removeProperty("width");
    original_div.style.removeProperty("right");
}

function set_right() {
    try {
        root_div.removeChild(snap_div);
        root_div.removeChild(original_div);
    } catch (e) {}

    root_div.appendChild(snap_div);
    root_div.appendChild(original_div);

    original_div.style.setProperty("right", "50%");
    original_div.style.setProperty("width", (camera_width/2).toString()+"px");
    original_video.srcObject = mediaSource;
    original_video.autoplay = true;

    snap_div.style.removeProperty("right");
    snap_div.style.removeProperty("width");
}

function set_full() {
    try {
        root_div.removeChild(snap_div);
    } catch (e) {}

    root_div.appendChild(snap_div);

    snap_div.style.removeProperty("right");
    snap_div.style.setProperty("width", camera_width.toString()+"px");
}

async function applyLens(id: string): Promise<void> {
    if (session != null) {
        await session.applyLens(lenses.find(
            (element: Lens, index: number, obj) => element.id == id) as Lens
        )
    }
}

async function init(): Promise<void> {
    if (isInitialized) return;
    isInitialized = true;

    // initialize cameraKit and get lenses
    cameraKit = await bootstrapCameraKit({apiToken: stagingApiToken, logLevel: "debug", logger: "console"});
    session = await cameraKit.createSession();
    var { lenses } = await cameraKit.lensRepository.loadLensGroups([lensGroupRepository]);
    setLenses(lenses);
    await cameraKit.lensRepository.cacheLensContent(lenses);

    // initalize canvases for left side
    root_div = document.getElementById("root") as HTMLDivElement;
    original_div = document.createElement("div") as HTMLDivElement;
    original_div.setAttribute("id", "original_div");
    snap_div = document.createElement("div") as HTMLDivElement;
    snap_div.setAttribute("id", "snap_div");
    original_video = document.createElement("video") as HTMLVideoElement;

    original_div.style.setProperty("position", "absolute");
    original_div.style.setProperty("overflow", "hidden");

    snap_div.style.setProperty("position", "absolute");
    snap_div.style.setProperty("overflow", "hidden");

    // initialize camera
    mediaSource = await navigator.mediaDevices.getUserMedia({ video: true });
    camera_width = 1920;
    camera_height = 1080;

    await mediaSource.getVideoTracks()[0].applyConstraints({width: camera_width, height: camera_height, resizeMode: "crop-and-scale"});
    camera_width = mediaSource.getVideoTracks()[0].getSettings().width as Number;
    camera_height = mediaSource.getVideoTracks()[0].getSettings().height as Number;

    if (window.localStorage.getItem("side") == "left")
        set_left();
    else if (window.localStorage.getItem("side") == "right")
        set_right();
    else if (window.localStorage.getItem("side") == "full")
        set_full();

    // initialize original capture
    original_div.appendChild(original_video);
    original_video.srcObject = mediaSource;
    original_video.autoplay = true;

    // initialize stream
    snap_div.appendChild(session.output.live);

    // apply to session
    snapSource = createMediaStreamSource(mediaSource);
    session.setSource(snapSource);
    await applyLens(window.localStorage.getItem("lens"));
    session.play("live");

    // events
    window.addEventListener("storage", (e) => {
        if (e.key == "side") {
            changeSide(e.newValue);
        } else if (e.key == "lens") {
            applyLens(e.newValue);
        }
    });

    window.alert("Kliknij raz w stronę!");

    window.addEventListener("beforeunload", (e) => {
        e.preventDefault();
    });

    // finish
    document.getElementById("initialize")!.innerHTML = "";
}

async function changeSide(side: string): Promise<void> {
    if (side == "left") {
        set_left();
    } else if (side == "right") {
        set_right();
    } else {
        set_full();
    }
}

while (window.localStorage.getItem("initialized") != "true")
    ;

init();
