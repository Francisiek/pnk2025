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

async function init(): Promise<void> {
    if (isInitialized) return;
    isInitialized = true;
    console.log(import.meta.env);
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
    original_div = document.getElementById("original_div") as HTMLDivElement;
    snap_div = document.getElementById("snap_div") as HTMLDivElement;
    original_video = document.createElement("video") as HTMLVideoElement;

    // initialize camera
    mediaSource = await navigator.mediaDevices.getUserMedia({ video: true });
    camera_width = mediaSource.getVideoTracks()[0].getSettings().width as Number;
    camera_height = mediaSource.getVideoTracks()[0].getSettings().height as Number;

    // initialize original capture
    original_div.appendChild(original_video);
    original_video.srcObject = mediaSource;
    original_video.autoplay = true;

    // initialize stream
    snap_div.appendChild(session.output.live);
    snap_div.style.setProperty("width", (camera_width/2).toString()+"px");

    // apply to session
    snapSource = createMediaStreamSource(mediaSource);
    session.setSource(snapSource);
    session.applyLens(lenses[0]);
    session.play("live");

    // finish
    document.getElementById("initialize")!.innerHTML = "";
    popup_button.textContent = "Open popup";

    // set storage for live
    window.localStorage.setItem("side", "left");
    window.localStorage.setItem("lens", lenses[0].id);
    window.localStorage.setItem("initialized", "true");

    // events
    selection!.addEventListener("change", (event) => {
        applyLens(event);
    });
    document.getElementById("side")!.addEventListener("change", (event) => {
        changeSide(event);
    });

    document.getElementById("popup")!.addEventListener("click", (e) => {
        if (popup_window === undefined) {
            popup_window = window.open("http://localhost:3000/live.html", "popup",
                "popup=true fullscreen=yes width=" + camera_width.toString() + " height=" + camera_height.toString()) as WindowProxy;
            popup_button.textContent = "Close popup";
        }
        else {
            popup_window.close();
            popup_window = undefined;
            popup_button.textContent = "Open popup";
        }
    });

}

async function applyLens(e): Promise<void> {
    if (session != null) {
        await session.applyLens(lenses.find(
            (element: Lens, index: number, obj) => element.id == e.target.value) as Lens
        )
    }
    window.localStorage.setItem("lens", e.target.value);
}

async function changeSide(e): Promise<void> {
    if (e.target.value == "left") {
        var snap_div_copy = root_div.removeChild(snap_div);
        root_div.appendChild(snap_div_copy);
        original_div.style.removeProperty("width");
        original_div.style.removeProperty("right");
        snap_div_copy.style.setProperty("width", (camera_width/2).toString()+"px");
        snap_div_copy.style.setProperty("right", "50%");
        window.localStorage.setItem("side", "left");
    } else {
        var original_div_copy = root_div.removeChild(original_div);
        root_div.appendChild(original_div_copy);
        snap_div.style.removeProperty("width");
        snap_div.style.removeProperty("right");
        original_div_copy.style.setProperty("width", (camera_width/2).toString()+"px");
        original_div_copy.style.setProperty("right", "50%");
        window.localStorage.setItem("side", "right");
    }
}

init();

