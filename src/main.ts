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
var selection: HTMLSelectElement;
var root_div: HTMLDivElement;
var original_div: HTMLDivElement;
var snap_div: HTMLDivElement;
var original_video: HTMLVideoElement;

var popup_window: WindowProxy;
var popup_button: HTMLButtonElement;

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

    window.localStorage.setItem("side", "left");
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

    window.localStorage.setItem("side", "right");
}

function set_full() {
    try {
        root_div.removeChild(snap_div);
    } catch (e) {}

    root_div.appendChild(snap_div);

    snap_div.style.removeProperty("right");
    snap_div.style.setProperty("width", (camera_width).toString()+"px");

    window.localStorage.setItem("side", "full");
}

async function init(): Promise<void> {
    if (isInitialized)
        return;
    isInitialized = true;

    // initialize cameraKit and get lenses
    cameraKit = await bootstrapCameraKit({apiToken: stagingApiToken, logLevel: "debug", logger: "console"});
    session = await cameraKit.createSession();
    var { lenses } = await cameraKit.lensRepository.loadLensGroups([lensGroupRepository]);
    setLenses(lenses);
    await cameraKit.lensRepository.cacheLensContent(lenses);

    // initialize selection and button
    selection = document.getElementById("selection") as HTMLSelectElement;
    const options = selection.options;
    options.remove(0);
    lenses.map(lens =>
        options.add(new Option(lens.name, lens.id, false, false))
    );
    popup_button = document.getElementById("popup") as HTMLButtonElement;

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
    // camera_width = mediaSource.getVideoTracks()[0].getSettings().width as Number;
    // camera_height = mediaSource.getVideoTracks()[0].getSettings().height as Number;
    camera_width = 1920;
    camera_height = 1080;

    set_left();

    // initialize divs to full
    root_div.appendChild(original_div);
    root_div.appendChild(snap_div);

    original_div.appendChild(original_video);
    original_video.srcObject = mediaSource;
    original_video.autoplay = true;

    // initialize stream
    snap_div.appendChild(session.output.live);

    // apply to session
    snapSource = createMediaStreamSource(mediaSource);
    session.setSource(snapSource);
    session.applyLens(lenses[0]);
    session.play("live");

    // set storage for live
    window.localStorage.setItem("side", "left");
    window.localStorage.setItem("lens", lenses[0].id);
    window.localStorage.setItem("initialized", "true");

    // events
    selection!.addEventListener("change", (event) => {
        applyLens(event.target.value);
    });

    document.getElementById("side")!.addEventListener("change", (event) => {
        changeSide(event.target.value);
    });

    document.getElementById("popup")!.addEventListener("click", (e) => {
        if (popup_window === undefined || popup_window.closed == true) {
            popup_window = window.open("http://localhost:3000/live.html", "popup",
                "popup=true width=" + camera_width.toString() + " height=" + camera_height.toString()) as WindowProxy;
            popup_button.textContent = "Close popup";

            popup_window.addEventListener("beforeunload", (e) => {
                e.preventDefault();
                e.returnValue = true;
                popup_button.textContent = "Open popup";
            });
        }
        else {
            popup_window.close();
            popup_button.textContent = "Open popup";
        }
    });

    window.addEventListener("beforeunload", (e) => {
        e.preventDefault();
        e.returnValue = true;
    })

    // finish
    document.getElementById("initialize")!.innerHTML = "";
    popup_button.textContent = "Open popup";
}

async function applyLens(id): Promise<void> {
    if (session != null) {
        await session.applyLens(lenses.find(
            (element: Lens, index: number, obj) => element.id == id) as Lens
        )
    }
    window.localStorage.setItem("lens", id);
}

async function changeSide(side): Promise<void> {
    if (side == "left") {
        set_left();
    } else if (side == "right") {
        set_right();
    } else {
        set_full();
    }
}

init();