import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// -- MIN SCENE --
const scene = new THREE.Scene();

// -- MIT KAMERA --
const camera = new THREE.PerspectiveCamera(
  75, // field of view
  window.innerWidth / window.innerHeight, // aspect-ratio
  0.1, // tæt på
  1000 // langt væk
);

camera.position.set(60.0, 10.0, -60.0);

// -- MIN RENDERER --
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// -- SMOOTH ORBIT DAMPING THANG --
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// -- AUDIO LOADER --

// audio listener
const listener = new THREE.AudioListener();
camera.add(listener);

const audioContext = listener.context;
const masterGain = audioContext.createGain();
masterGain.connect(audioContext.destination);

// objekt til at holde alle seks "lyde"
const stems = {};
const audioLoader = new THREE.AudioLoader();

// stem loader
function loadStem(name, url) {
  const sound = new THREE.Audio(listener);

  audioLoader.load(url, buffer => {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // start muted

    sound.setBuffer(buffer);
    sound.setLoop(true);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    source.connect(gainNode);
    gainNode.connect(masterGain);

    stems[name] = { sound, gainNode, source };
  });
}

// load af alle 6 lyde
loadStem("kick", "/sounds/KICK_1.mp3");
loadStem("perc", "/sounds/PERC_1.mp3");
loadStem("snare", "/sounds/SNARE_1.mp3");
loadStem("synth", "/sounds/SYNTH TOP_1.mp3");
loadStem("bass", "/sounds/BASS_1.mp3");
loadStem("effects", "/sounds/EFFECTS_1.mp3");

// -- LILLE CUTE RADIO --
const loader = new GLTFLoader();
loader.load('/models/AUDIO3.gltf',
  function (gltf) {
    const model = gltf.scene;
    model.position.y = 0;
    model.rotation.y = 0.8;
    scene.add(model);

    // oprettelse af knap
    model.traverse(child => {
      if (child.isMesh) {
        child.userData.isButton = true;
      }
    });
  });

// -- STUE --
const loader2 = new GLTFLoader();
loader2.load('/models/STUE3.gltf',
  function (gltf) {
    const model2 = gltf.scene;
    model2.position.y = -12.4;
    scene.add(model2);
  },
  undefined,
  function (error) {
    console.error('ups hva der er noget galt', error);
  }
);

// -- SPECS --
const loader3 = new GLTFLoader()
loader3.load('/models/SPECS+SPOT2.gltf',
  function (gltf) {
    const model3 = gltf.scene
    model3.position.y = 3.8
    model3.position.x = -15
    model3.position.z = -3

    model3.rotation.y = 1.6


    model3.scale.y = 3
    model3.scale.x = 3
    model3.scale.z = 3
    scene.add(model3)
  }
)

// -- ISLAND --
const loader4 = new GLTFLoader();
loader4.load('/models/ISLAND.gltf',
  function (gltf) {
    const model4 = gltf.scene;
    model4.position.y = -12
    scene.add(model4);
  },
  undefined,
  function (error) {
    console.error('ups hva der er noget galt', error);
  }
);

// -- RAYCASTER --
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let audioStarted = false;


function onClick(event) {
  if (!audioStarted) {
    audioContext.resume().then(() => {
      for (const name in stems) {
        stems[name].source.start(0);
      }
      audioStarted = true;
    });
  }

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (obj.userData.isButton) {
      const name = obj.name.toLowerCase();

      if (stems[name]) {
        stems[name].gainNode.gain.value =
          stems[name].gainNode.gain.value < 0.01 ? 1 : 0;
      }
    }
  }
}

function onMouseMove(event) {
  console.log('mouse is moving')
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  let foundButton = false
  
  if (intersects.length > 0) {
    const obj = intersects[0].object
    if (obj.userData.isButton){
      foundButton = true
      hoveredButton = obj

      obj.geometry.computeBoundingBox()
      const box = obj.geometry.boundingBox
      const size = new THREE.Vector3()
      box.getSize(size)

      highlightMesh.scale.set(size.x * 1.2, size.y * 1.2, size.z * 1.2)
      highlightMesh.position.copy(obj.getWorldPosition(new THREE.Vector3()))
      highlightMesh.rotation.copy(obj.getWorldQuaternion(new THREE.Quaternion()))
      highlightMesh.visible = true
    }
  }

  if (!foundButton && hoveredButton) {
    hoveredButton = null
    highlightMesh.visible = false
  }
}

window.addEventListener("mousemove", onMouseMove)

window.addEventListener("click", onClick);

// -- RESIZE --
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// -- ANIMATION --
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // damping...
  renderer.render(scene, camera);
}
animate();