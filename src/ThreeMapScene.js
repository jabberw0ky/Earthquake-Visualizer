import * as THREE from "three";
import * as d3 from 'd3'
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = "pk.eyJ1IjoiZ2FsbGlja2d1bm5lciIsImEiOiJjbTc5eHJ0d2QwN2poMmlxemt4cTA2OTR4In0.r1xOEdFzfXWuy4rtQIrYnA"; // Replace with your Mapbox token

class ThreeScene {
  constructor(container) {
    this.container = container; 
    this.magFilter = 0
    this.initMapBox()
  } 

  initMapBox() {
    this.mapboxMap = new mapboxgl.Map({
        container: this.container,
        style: 'mapbox://styles/mapbox/dark-v11',
        zoom: 3,
        center: [-118.543, 54.3492],
        pitch: 60,
        projection: 'mercator',
        interactive: true,
        antialias: true
    });  

    const customLayer = {
      id: 'earthquake',
      type: 'custom',
      renderingMode: '3d',
      onAdd: (map, gl) => {
          
        this.camera = new THREE.Camera();
          this.camera.near = 0.1
          this.camera.far = 100000
          this.scene = new THREE.Scene();

          this.renderer = new THREE.WebGLRenderer({
              canvas: map.getCanvas(),
              context: gl,
              antialias: true
          });

          this.renderer.autoClear = false;

          const light = new THREE.DirectionalLight(0xffffff, 1);
          light.position.set(-10, 10, 0).normalize();
          this.scene.add(light);    

          const light2 = new THREE.DirectionalLight(0xffffff, 1);
          light2.position.set(10, -10, 0).normalize();
          this.scene.add(light2);
          
          const light3 = new THREE.DirectionalLight(0xffffff, 1);
          light3.position.set(-10, 10, 0).normalize();
          //this.scene.add(light3);

          this.loadCSV();
          this.mapboxMap = map;
      },

      render: (gl, matrix) => {
        var m =  new THREE.Matrix4().fromArray(matrix);
        this.camera.projectionMatrix = m; 
        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.mapboxMap.triggerRepaint();
      }
    }

    this.mapboxMap.on("style.load", () => {
      this.mapboxMap.addLayer(customLayer, 'waterway-label');
    });
  }

  async loadCSV() {
    const csvFile = '/earthquake-data.csv';
    const data = await d3.csv(csvFile);
    this.meshCount = data.length;
    this.addEarthquakes(data);
  }

  addEarthquakes(data) {
    
    const visibilityArray = new Uint8Array(this.meshCount).fill(1);
    this.visibilityAttribute = new THREE.InstancedBufferAttribute(visibilityArray, 1);
    const sphereGeometry = new THREE.SphereGeometry(0.01, 32, 32);
    
    sphereGeometry.setAttribute("visible", this.visibilityAttribute);     
    const sphereMaterial = new THREE.MeshStandardMaterial();
    sphereMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        `#include <common>`,
        `#include <common>
        attribute float visible;`
      );
    
      shader.vertexShader = shader.vertexShader.replace(
        `#include <project_vertex>`,
        `#include <project_vertex>
        gl_Position = mix(vec4(0, 0, -1, 1), gl_Position, visible);`
      );
    };    
    
    this.earthquakeInstancedMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, this.meshCount);
    
    data.forEach((d, index) => {
      const lon = parseFloat(d.Longitude);
      const lat = parseFloat(d.Latitude);
      const depth = parseFloat(d.Depth_km) * 1000;
      const magnitude = parseFloat(d.MLy);

      var coord = mapboxgl.MercatorCoordinate.fromLngLat(
        [lon, lat],
        depth
      );
      
      const scale = 1/1000
      var mat =  new THREE.Matrix4()
        mat.identity()
            .makeTranslation(coord.x, coord.y, coord.z)
            .scale(new THREE.Vector3(scale * magnitude, scale * magnitude, scale * magnitude));

        this.earthquakeInstancedMesh.setMatrixAt(index, mat);

        //Color Code Earthquakes based on magnitude
        if(magnitude < 1.5)
            this.earthquakeInstancedMesh.setColorAt(index, new THREE.Color(20.0/255,176.0/255,77.0/255));
        else if (magnitude >= 1.5 && magnitude <= 2.2)
          this.earthquakeInstancedMesh.setColorAt(index, new THREE.Color(180.0/255,155.0/255,41.0/255));
        else
          this.earthquakeInstancedMesh.setColorAt(index, new THREE.Color(221.0/255, 22.0/255, 14.0/255));
        
    });
    this.scene.add(this.earthquakeInstancedMesh)
    this.earthquakeInstancedMesh.instanceColor.needsUpdate = true;
    this.earthquakeInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  updateEarthquakeLayerVisibility(showLayer) {
    if(showLayer)
      this.mapboxMap.setLayoutProperty('earthquake', 'visibility', 'visible');
    else
    this.mapboxMap.setLayoutProperty('earthquake', 'visibility', 'none');
  }

  updateMagnitudeFilter(newVal) {    
    this.magFilter = newVal
    this.filterEarthquakes()
  }

  filterEarthquakes() {
    var tempMat = new THREE.Matrix4()
    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    for(var i = 0; i < this.meshCount; i++)
    {
      this.earthquakeInstancedMesh.getMatrixAt(i, tempMat);
      tempMat.decompose(pos, quat, scale);
      const mag = scale.x * 1000
      if(mag < this.magFilter)
      {
        this.visibilityAttribute.setX(i, 0);
      }
      else
      {
        this.visibilityAttribute.setX(i, 1);
      }
    }
    this.visibilityAttribute.needsUpdate = true;
    this.earthquakeInstancedMesh.instanceMatrix.needsUpdate = true;    
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  dispose() {

    if (this.mapboxMap && this.mapboxMap.getLayer('earthquake')) {
        this.mapboxMap.removeLayer('earthquake');
    }

    if (this.mapboxMap) {
        this.mapboxMap.remove(); 
        this.mapboxMap = null;
    }

    if (this.earthquakeInstancedMesh) {
      this.scene.remove(this.earthquakeInstancedMesh);
        this.earthquakeInstancedMesh.geometry.dispose();
        this.earthquakeInstancedMesh.material.dispose();
    }

    if (this.renderer) {
        this.renderer.dispose();
    }
  }
}

export default ThreeScene;
