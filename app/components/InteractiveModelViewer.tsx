import React, { Suspense, useRef, useState, useEffect } from 'react';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, useRapier } from '@react-three/rapier';
import { ARButton, XR, DefaultXRController, useXRHitTest, useXR } from '@react-three/xr';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { io } from 'socket.io-client';

interface InteractiveModelViewerProps {
  modelUrl: string;
}

// The 3D model component, now wrapped in a RigidBody
function Model({ url, position, rotation }: { url: string, position?: [number, number, number], rotation?: [number, number, number] }) {
  const { scene } = useGLTF(url);
  return (
    <RigidBody colliders="hull" restitution={0.5} position={position} rotation={rotation}>
      <primitive object={scene} scale={1} />
    </RigidBody>
  );
}

// A simple sphere to drop on the main model
function Sphere({ id, initialPosition, color = "hotpink", onPositionChange }: { id: string, initialPosition: [number, number, number], color?: string, onPositionChange: (id: string, position: [number, number, number]) => void }) {
  const sphereRef = useRef<any>(null); // Ref for RigidBody
  const { raycaster, camera, scene } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const rapier = useRapier();

  // Set initial position
  useEffect(() => {
    if (sphereRef.current) {
      sphereRef.current.setTranslation(new THREE.Vector3(...initialPosition), true);
    }
  }, [initialPosition]);

  const onPointerDown = (event: any) => {
    setIsDragging(true);
    (event.target as any).setPointerCapture(event.pointerId);
  };

  const onPointerUp = (event: any) => {
    setIsDragging(false);
    (event.target as any).releasePointerCapture(event.pointerId);
  };

  const onPointerMove = (event: any) => {
    if (isDragging && sphereRef.current) {
      raycaster.setFromCamera(event.ray.origin, camera);
      const intersects = raycaster.intersectObjects(scene.children);

      if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        const newPosition = new THREE.Vector3(intersectionPoint.x, intersectionPoint.y, intersectionPoint.z);

        sphereRef.current.setTranslation(newPosition, true);
        sphereRef.current.setLinvel(new THREE.Vector3(0, 0, 0), true);
        sphereRef.current.setAngvel(new THREE.Vector3(0, 0, 0), true);

        onPositionChange(id, [newPosition.x, newPosition.y, newPosition.z]);
      }
    }
  };

  return (
    <RigidBody
      ref={sphereRef}
      colliders="ball"
      position={initialPosition} // Use initialPosition for initial render
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerMove={onPointerMove}
    >
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

const InteractiveModelViewer: React.FC<InteractiveModelViewerProps> = ({ modelUrl }) => {
  const [iotData, setIotData] = useState<{ color: string } | null>(null);
  const [sphereStates, setSphereStates] = useState<{ [key: string]: [number, number, number] }>({ 
    sphere1: [0.5, 4, 0],
    sphere2: [-0.5, 5, 0.2],
    sphereIoT: [0, 6, 0],
  });

  const [modelPlaced, setModelPlaced] = useState(false);
  const [modelTransform, setModelTransform] = useState<any>(null);
  const { isPresenting } = useXR();

  useXRHitTest((hitMatrix: any) => {
    if (!modelPlaced && isPresenting) {
      const position = new THREE.Vector3().setFromMatrixPosition(hitMatrix);
      const rotation = new THREE.Euler().setFromRotationMatrix(hitMatrix);
      setModelTransform({ position: [position.x, position.y, position.z], rotation: [rotation.x, rotation.y, rotation.z] });
    }
  });

  const handleARPlacement = () => {
    if (!modelPlaced && modelTransform) {
      setModelPlaced(true);
    }
  };

  useEffect(() => {
    // Socket.IO client setup
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.on('current_spheres', (currentSpheres: { [key: string]: [number, number, number] }) => {
      setSphereStates(prev => ({ ...prev, ...currentSpheres }));
    });

    socket.on('sphere_position_update', (data: { id: string, position: [number, number, number] }) => {
      setSphereStates(prev => ({
        ...prev,
        [data.id]: data.position,
      }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    // IoT data fetching
    const fetchIotData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/iot-data');
        const data = await response.json();
        setIotData(data);
      } catch (error) {
        console.error('Error fetching IoT data:', error);
      }
    };

    fetchIotData();
    const iotInterval = setInterval(fetchIotData, 2000);

    return () => {
      socket.disconnect();
      clearInterval(iotInterval);
    };
  }, []);

  const handleSpherePositionChange = (id: string, position: [number, number, number]) => {
    setSphereStates(prev => ({
      ...prev,
      [id]: position,
    }));
    const socket = io('http://localhost:3001'); // Re-initialize socket for emitting
    socket.emit('sphere_position_update', { id, position });
    socket.disconnect(); // Disconnect after emitting
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
      <ARButton 
        style={{ 
          position: 'absolute', 
          bottom: '16px', 
          right: '16px', 
          zIndex: 10 
        }}
      />
      <XR sessionInit={{ requiredFeatures: ['hit-test'] }} onPointerDown={handleARPlacement}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          
          <Physics gravity={[0, -9.81, 0]}>
            {isPresenting && modelPlaced && modelTransform && (
              <Model url={modelUrl} position={modelTransform.position} rotation={modelTransform.rotation} />
            )}
            {!isPresenting && <Model url={modelUrl} />} {/* Render model normally outside AR */}

            {/* Spheres with collaborative dragging */}
            <Sphere id="sphere1" initialPosition={sphereStates.sphere1} onPositionChange={handleSpherePositionChange} />
            <Sphere id="sphere2" initialPosition={sphereStates.sphere2} onPositionChange={handleSpherePositionChange} />
            {iotData && <Sphere id="sphereIoT" initialPosition={sphereStates.sphereIoT} color={iotData.color} onPositionChange={handleSpherePositionChange} />}

            {/* An invisible floor */}
            <RigidBody type="fixed">
              <CuboidCollider args={[10, 0.5, 10]} position={[0, -2, 0]} />
            </RigidBody>
          </Physics>

          <OrbitControls />
          <DefaultXRController />
        </Suspense>
      </XR>
    </div>
  );
};

export default InteractiveModelViewer;