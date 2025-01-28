import {
    bootstrapCameraKit,
    CameraKit,
    CameraKitSession,
    CameraKitSource,
    createMediaStreamSource,
    Lens,
} from "@snap/camera-kit";

const stagingApiToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzM3MDI3NTM5LCJzdWIiOiIxZmRkOTk3YS1mYWQxLTQ1NWMtYTZlMC01YjBhMWFhY2Y1OTJ-U1RBR0lOR341ZjYzMTBlMC02ZjA0LTRiODktYjBlMy1iNzBlZDJhMWRlNjkifQ.GdDRI9-h-ngDmv-USkGua6N7XHkoX4l3_sZh25iqljc";
// const productionApiToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzM3MDI3NTM5LCJzdWIiOiIxZmRkOTk3YS1mYWQxLTQ1NWMtYTZlMC01YjBhMWFhY2Y1OTJ-UFJPRFVDVElPTn5mNWUyNTNiMi1kYThkLTQ2NjAtYTIzNi1iMjYyN2E2YmEwZGEifQ.7biXt8bEEztPeki_RT186Cefoniottqf7zlWBbyAUjg";
const lensGroupRepository = "175ec1af-c31f-4346-b47a-78d6c75d4424";

// cameraKit
var isInitialized: boolean = false;
var cameraKit: CameraKit;
var session: CameraKitSession;
var lenses: Lens[] = [];

// camera
var mediaSource: MediaStream;
var camera_width: Number = 0;
var snapSource: CameraKitSource;

// HTML elements
var root_div: HTMLDivElement;
var original_div: HTMLDivElement;
var snap_div: HTMLDivElement;
var original_video: HTMLVideoElement;


function setLenses(l: Lens[]) {
    lenses = l;
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
    original_div = document.getElementById("original_div") as HTMLDivElement;
    snap_div = document.getElementById("snap_div") as HTMLDivElement;
    original_video = document.createElement("video") as HTMLVideoElement;

    // initialize camera
    mediaSource = await navigator.mediaDevices.getUserMedia({ video: true });
    camera_width = mediaSource.getVideoTracks()[0].getSettings().width as Number;

    // initialize original capture
    original_div.appendChild(original_video);
    original_video.srcObject = mediaSource;
    original_video.autoplay = true;

    // initialize stream
    snap_div.appendChild(session.output.live);
    snap_div.style.setProperty("width", (Number(camera_width)/2).toString()+"px");

    // apply to session
    snapSource = createMediaStreamSource(mediaSource);
    session.setSource(snapSource);
    session.applyLens(lenses[0]);
    session.play("live");

    // finish
    document.getElementById("initialize")!.innerHTML = "";

    // events
    window.addEventListener("storage", (e) => {
        if (e.key == "side") {
            changeSide(e.newValue);
        } else if (e.key == "lens") {
            applyLens(e.newValue);
        }
    });


}

async function applyLens(id: string): Promise<void> {
    if (session != null) {
        await session.applyLens(lenses.find(
            (element: Lens, index: number, obj) => element.id == id) as Lens
        )
    }
}

async function changeSide(side: string): Promise<void> {
    if (side == "left") {
        var snap_div_copy = root_div.removeChild(snap_div);
        root_div.appendChild(snap_div_copy);
        original_div.style.removeProperty("width");
        original_div.style.removeProperty("right");
        snap_div_copy.style.setProperty("width", (camera_width/2).toString()+"px");
        snap_div_copy.style.setProperty("right", "50%");
    } else {
        var original_div_copy = root_div.removeChild(original_div);
        root_div.appendChild(original_div_copy);
        snap_div.style.removeProperty("width");
        snap_div.style.removeProperty("right");
        original_div_copy.style.setProperty("width", (camera_width/2).toString()+"px");
        original_div_copy.style.setProperty("right", "50%");
    }
}

while (window.localStorage.getItem("initialized") != "true")
    ;

init();


