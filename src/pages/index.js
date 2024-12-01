import { useState, useEffect } from 'react';
import * as THREE from 'three';

export default function Home() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1); // Set background to black
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';
    document.body.appendChild(renderer.domElement);

    // Add stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1000;
    const posArray = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.01,
      color: 0xffffff,
    });

    const starsMesh = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starsMesh);

    // Add shooting stars
    const shootingStars = [];
    const createShootingStar = () => {
      const geometry = new THREE.SphereGeometry(0.02, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const star = new THREE.Mesh(geometry, material);
      star.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
      scene.add(star);
      shootingStars.push({ star, speed: Math.random() * 0.1 + 0.05 });
    };

    setInterval(createShootingStar, 2000);

    camera.position.z = 5;

    const animate = function () {
      requestAnimationFrame(animate);

      starsMesh.rotation.y += 0.0005;

      shootingStars.forEach((shootingStar, index) => {
        shootingStar.star.position.x -= shootingStar.speed;
        shootingStar.star.position.y -= shootingStar.speed;
        if (shootingStar.star.position.x < -10 || shootingStar.star.position.y < -10) {
          scene.remove(shootingStar.star);
          shootingStars.splice(index, 1);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Clean up on component unmount
    return () => {
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Downloading... Please wait.');

    try {
      console.log('Sending request to backend:', { url, format });
      const response = await fetch('http://localhost:5000/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${url.split('v=')[1]}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setStatus('Download completed successfully!');
      } else {
        const data = await response.json();
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('Error during request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', position: 'relative', zIndex: 1 }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff', textShadow: '2px 2px 4px #000', padding: '10px 0' }}>YouTube Downloader</h1>
      
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '10px',  
          background: 'linear-gradient(to right, #000428, #004e92)',
          overflow: 'hidden',
          zIndex: 2
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to right, transparent, #fff, transparent)',
            animation: 'move 2s linear infinite'
          }}></div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ 
        background: 'linear-gradient(145deg, #f0f0f3, #cacaca)',
        padding: '30px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.3s ease',
        ':hover': {
          transform: 'scale(1.05)'
        }
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="url" style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: 'bold', fontSize: '14px' }}>
            YouTube URL (Video or Playlist)
          </label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
            style={{ 
              width: '100%', 
              padding: '12px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '10px',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff4949'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', color: '#333', fontWeight: 'bold', fontSize: '14px' }}>Format</label>
          <div>
            <label style={{ marginRight: '20px' }}>
              <input
                type="radio"
                name="format"
                value="mp4"
                checked={format === 'mp4'}
                onChange={(e) => setFormat(e.target.value)}
                style={{ marginRight: '5px' }}
              />
              MP4 (Video)
            </label>
            <label>
              <input
                type="radio"
                name="format"
                value="mp3"
                checked={format === 'mp3'}
                onChange={(e) => setFormat(e.target.value)}
                style={{ marginRight: '5px' }}
              />
              MP3 (Audio)
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(145deg, #ff7676, #ff4949)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 5px 10px rgba(0, 0, 0, 0.1)',
            transition: 'background 0.3s ease'
          }}
        >
          {loading ? 'Downloading...' : 'Download'}
        </button>
      </form>

      {status && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: status.includes('Error') ? '#fee2e2' : '#dcfce7',
            color: status.includes('Error') ? '#dc2626' : '#166534',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{status}</pre>
        </div>
      )}
    </div>
  );
}

const styles = `
  @keyframes move {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
