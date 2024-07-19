"use strict";

import * as THREE from "three";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#c");
const renderer = new THREE.WebGLRenderer({ canvas });

const fov = 90;
const aspect = 1;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#b1e1ff");

{
  const skyColor = 0xb1e1ff; // light blue
  const groundColor = 0xb97a20; // brownish orange
  const intensity = 1;
  const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  scene.add(light);
}

{
  const color = 0xffffff;
  const intensity = 2;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(5, 10, 2);
  scene.add(light);
  scene.add(light.target);
}

function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
  const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
  const direction = new THREE.Vector3()
    .subVectors(camera.position, boxCenter)
    .multiply(new THREE.Vector3(1, 0, 1))
    .normalize();
  camera.updateProjectionMatrix();
  camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}

let current_render_index = 0;
let things_to_render = [
  "baseplate",
  "road",
  "buildings",
  //"props",
  "billboards",
  //"deco"
];
function render_model(ModelPath) {
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();
  mtlLoader.load(`Models/${ModelPath}/${ModelPath}.mtl`, (mtl) => {
    mtl.preload();
    objLoader.setMaterials(mtl);
    objLoader.load(
      `Models/${ModelPath}/${ModelPath}.obj`,
      (root) => {
        scene.add(root);
        const box = new THREE.Box3().setFromObject(root);

        const boxSize = box.getSize(new THREE.Vector3()).length();
        const boxCenter = box.getCenter(new THREE.Vector3());
        frameArea(boxSize * 1.2, boxSize, boxCenter, camera);

        current_render_index += 1;
        if (current_render_index == things_to_render.length) {
          document.getElementById("loading-overlay").style.display = "none";
        }
      },
      function (xhr) {
        document.getElementById("loading-overlay").style.display = "flex";
        document.getElementById("loading-percent").innerText =
          `${ModelPath}: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}% loaded`;
      },
      function (err) {
        alert(`There was an error loading model ${ModelPath}`);
        console.log(err);
      },
    );
  });
}
for (let thing_to_render of things_to_render) {
  render_model(thing_to_render);
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function render() {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  controls.update();
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

const is_key_down = (() => {
  const state = {};

  window.addEventListener("keyup", (e) => (state[e.key] = false));
  window.addEventListener("keydown", (e) => (state[e.key] = true));

  return (key) => (state.hasOwnProperty(key) && state[key]) || false;
})();

let confirming = true;
window.addEventListener("keydown", (e) => {
  if (e.key == " ") {
    if (confirming) {
      if (dot) {
        answerdot = document.createElement("div");
        answerdot.classList.add("dot");
        clickOverlay.appendChild(answerdot);

        answerdot.style.top = `${answer.z * map_image.clientHeight}px`;
        answerdot.style.left = `${answer.x * map_image.clientWidth}px`;
        answerdot.style.background = "#00ff00";

        document.getElementById("scoreDisplay").style.display = "block";
        document.getElementById("scoreDisplay").innerText =
          `Score: ${Math.floor(distance_to_score(distance_to_solution))}`;
      }
    } else {
      if (answerdot) {
        clickOverlay.removeChild(answerdot);
        clickOverlay.removeChild(dot);
        answerdot = null;
        dot = null;
        randomize_position();
        document.getElementById("scoreDisplay").style.display = "none";
      }
    }

    confirming = !confirming;
  }
});

function randomize_position(roads = true, buildings = true) {
  if (!roads && !buildings) return;

  while (true) {
    const road_weight = 0.1;
    const buildings_weight = 0.1;
    const rand_num = Math.random() * (road_weight + buildings_weight);

    if (rand_num >= road_weight) {
      // Building was selected
      if (buildings) {
        const select_random = Math.floor(Math.random() * data.buildings.length);
        const selected = data.buildings[select_random];
        camera.position.set(selected.x, selected.y + 10, selected.z);
        break;
      }
    } else {
      // Road was selected
      if (roads) {
        let total_distance = data.road
          .map((segment) => segment.distance) // Extract distances
          .reduce((partialSum, distance) => partialSum + distance, 0); // Sum up all distances

        let random_in_dist = Math.random() * total_distance;

        let accumulatedDistance = 0;
        let chosenSegment = null;

        for (const segment of data.road) {
          accumulatedDistance += segment.distance;
          if (random_in_dist < accumulatedDistance) {
            chosenSegment = segment;
            break;
          }
        }

        if (chosenSegment) {
          let remainingDistance = accumulatedDistance - random_in_dist;
          let interpolationFactor =
            1 - remainingDistance / chosenSegment.distance;
          let pointX =
            chosenSegment.p1.x +
            interpolationFactor * (chosenSegment.p2.x - chosenSegment.p1.x);
          let pointZ =
            chosenSegment.p1.z +
            interpolationFactor * (chosenSegment.p2.z - chosenSegment.p1.z);

          camera.position.set(pointX, 20, pointZ);
        }
        break;
      }
    }
  }

  camera.lookAt(camera.position.x - 1, camera.position.y, camera.position.z);

  controls.target = new THREE.Vector3(
    camera.position.x - 0.1,
    camera.position.y,
    camera.position.z,
  );

  answer = {
    x: (camera.position.x + 1882.5) / baseplate_measurements.x, // Hardcoded numbers of the minimums of where the the model loads
    z: (camera.position.z + 2578) / baseplate_measurements.z,
  };
}

const baseplate_measurements = {
  x: 4944.5,
  z: 5195,
};

let answer;

randomize_position();

let answerdot = null;
let map_image = null;
let dot = null;
let distance_to_solution = 1000;
const clickOverlay = document.getElementById("clickOverlay");
document.addEventListener("DOMContentLoaded", function () {
  map_image = document.getElementById("map-image");
  map_image.addEventListener("click", function (event) {
    if (answerdot) return;
    const offsetX = event.offsetX;
    const offsetY = event.offsetY;

    // Calculate scaled coordinates
    const scaledX = offsetX / map_image.clientWidth;
    const scaledY = offsetY / map_image.clientHeight;

    if (!dot) {
      dot = document.createElement("div");
      dot.classList.add("dot");
      clickOverlay.appendChild(dot);
    }

    dot.style.top = `${offsetY}px`;
    dot.style.left = `${offsetX}px`;

    // Distance
    distance_to_solution = Math.sqrt(
      (answer.z - scaledY) ** 2 + (answer.x - scaledX) ** 2,
    );
  });
});

function distance_to_score(x) {
  return Math.min(
    (1000 / (1 - Math.exp(-5))) * Math.exp(-(x - 0.015) * 5) -
      (1000 * Math.exp(-5)) / (1 - Math.exp(-5)),
    1000,
  );
}
