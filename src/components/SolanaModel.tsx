import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const MODEL_URL = '/models/3dmodelofsolan.fbx';

export function SolanaModel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Environment map so the metallic gradient has something to reflect
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // Solana-palette lighting: purple / green / blue against a dark metallic body
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4, 6, 8);
    scene.add(keyLight);

    const purpleLight = new THREE.PointLight(0x9945ff, 60);
    purpleLight.position.set(-5, 3, 4);
    scene.add(purpleLight);

    const greenLight = new THREE.PointLight(0x14f195, 50);
    greenLight.position.set(5, -3, 4);
    scene.add(greenLight);

    const blueLight = new THREE.PointLight(0x00c2ff, 35);
    blueLight.position.set(0, 5, -6);
    scene.add(blueLight);

    const pivot = new THREE.Group();
    scene.add(pivot);

    let disposed = false;

    new FBXLoader().load(MODEL_URL, (fbx) => {
      if (disposed) return;

      // Bounding box in raw model space, used to normalize the gradient
      const rawBox = new THREE.Box3().setFromObject(fbx);
      const rawMin = rawBox.min.clone();
      const rawSpan = rawBox.getSize(new THREE.Vector3());

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.85,
        roughness: 0.22,
        clearcoat: 0.8,
        clearcoatRoughness: 0.25,
      });

      // Bake the Solana purple→blue→green gradient across the coin in object space
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uMin = { value: rawMin };
        shader.uniforms.uSpan = { value: rawSpan };
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vModelPos;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvModelPos = position;');
        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
            varying vec3 vModelPos;
            uniform vec3 uMin;
            uniform vec3 uSpan;`
          )
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            {
              vec3 n = clamp((vModelPos - uMin) / max(uSpan, vec3(1e-5)), 0.0, 1.0);
              float g = clamp((n.x + n.y) * 0.5, 0.0, 1.0);
              vec3 purple = vec3(0.600, 0.271, 1.000);  // #9945FF
              vec3 blue   = vec3(0.000, 0.761, 1.000);  // #00C2FF
              vec3 green  = vec3(0.078, 0.945, 0.584);  // #14F195
              vec3 grad = g < 0.5 ? mix(purple, blue, g * 2.0) : mix(blue, green, (g - 0.5) * 2.0);
              diffuseColor.rgb *= grad;
            }`
          );
      };

      fbx.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = material;
        }
      });

      // FBX is Z-up: stand the coin upright so its face points at the camera
      fbx.rotation.x = Math.PI / 2;
      fbx.updateMatrixWorld(true);

      // Center the model on its bounding box and normalize its size
      const box = new THREE.Box3().setFromObject(fbx);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      fbx.position.sub(center);
      fbx.scale.setScalar(6.6 / size);

      pivot.add(fbx);
    });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      pivot.rotation.y = t * 0.6;
      pivot.rotation.x = Math.sin(t * 0.5) * 0.12;
      pivot.position.y = Math.sin(t * 0.8) * 0.1;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      pmrem.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
