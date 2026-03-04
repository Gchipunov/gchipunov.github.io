// Main entry point
  
  
  // position buffer is 1.0 rescaled is causing blur
  // need to make a position buffer based on actually coordinates
  
// make spikes instant reverse to accomplish double bug feature of spikes up and damage being down.
// make achivements pop up with gl
// fix camera
// fix blur camera
  
  // make map editor
  // ajax save stats
  // oauth google login
  
  // call photon websocket api to generate a candle graph of poop aura
  
  
    window.onload = function() {
     

// ---- 0. GET DEVICE VALUES
	
	const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

// console.log(`The viewport is ${viewportWidth}px wide and ${viewportHeight}px high.`);


const screenWidth = screen.width;
const screenHeight = screen.height;

// console.log(`The user's screen resolution is ${screenWidth}x${screenHeight}.`);

const outerWidth = window.outerWidth;
const outerHeight = window.outerHeight;

// console.log(`The browser window is ${outerWidth}px wide and ${outerHeight}px high.`);

	const AspectMultiplier = viewportWidth/ viewportHeight;
	
	
	
        // --- 1. SETUP ---
        const canvas = document.getElementById('gl-canvas');
        const container = document.getElementById('canvas-container');
        const gl = canvas.getContext('webgl');

        if (!gl) {
            // Inform the user if WebGL is not supported
            container.innerHTML = '<p style="color: white; padding: 20px;">WebGL is not supported by your browser.</p>';
            throw new Error("WebGL not supported");
        }

        // --- 2. DETERMINE DEVICE AND SET RESOLUTION ---

        // A simple check to see if the user is on a mobile device
        const isMobile = /Mobi/i.test(window.navigator.userAgent);

        let canvasWidth, canvasHeight;

        if (isMobile) {
            // Set dimensions for mobile devices
       //     canvasWidth = 2000;
       //     canvasHeight = 4000;
	    canvasWidth = viewportWidth * 10;
		canvasHeight = viewportHeight * 10;
	   
        } else {
            // Set dimensions for desktop/computer
        //    canvasWidth = 4000;
       //     canvasHeight = 3000;
	      canvasWidth = viewportWidth * 10;
		canvasHeight = viewportHeight * 10;
        }

        // --- 3. APPLY DIMENSIONS AND ASPECT RATIO ---

        // Set the internal resolution of the canvas (the drawing buffer size)
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Set the aspect ratio of the container div. This is the key to making
        // the canvas scale correctly while maintaining its shape.
//if(screen.availHeight > screen.availWidth){
//  alert("Please use Landscape!");
//  console.log(`The browser window is screen.availHeight: ${screen.availHeight}px wide and screen.availWidth ${screen.availWidth}px high.`);

  
//}
//else
//{
//alert("Please use inLandscape!");
// console.log(`The browser window is screen.availHeight: ${screen.availHeight}px wide and screen.availWidth ${screen.availWidth}px high.`);
//}
        container.style.aspectRatio = canvasWidth / canvasHeight;



        console.log(`Device detected as: ${isMobile ? 'Mobile' : 'Desktop'}`);
        console.log(`Canvas resolution set to: ${canvas.width}x${canvas.height}`);

        // --- 4. CONFIGURE WEBGL VIEWPORT ---

        // Tell WebGL how to convert from clip space to pixels.
        // It's crucial to use the canvas's actual width and height here
        // to render to the entire high-resolution buffer.
     //   gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	    gl.viewport(0, 0, canvasWidth, canvasHeight);
		
		
		function DebugDisplay(textDebug)
			
		{ 
		 document.getElementById('debug-display').textContent = `${textDebug}`;
		}
		function DebugDisplay2(textDebug)
			
		{ 
		 document.getElementById('debug-display2').textContent = `${textDebug}`;
		}
		function DebugDisplay3(textDebug)
			
		{ 
		 document.getElementById('debug-display3').textContent = `${textDebug}`;
		}
		function DebugDisplay4(textDebug)
			
		{ 
		 document.getElementById('debug-display4').textContent = `${textDebug}`;
		}
		
		function DebugDisplay5(textDebug)
			
		{ 
		 document.getElementById('debug-display5').textContent = `${textDebug}`;
		}
		function DebugDisplay6(textDebug)
			
		{ 
		 document.getElementById('debug-display6').textContent = `${textDebug}`;
		}
		function DebugDisplay7(textDebug)
			
		{ 
		 document.getElementById('debug-display7').textContent = `${textDebug}`;
		}
		function DebugDisplay8(textDebug)
			
		{ 
		 document.getElementById('debug-display8').textContent = `${textDebug}`;
		}
		function DebugDisplay9(textDebug)
			
		{ 
		 document.getElementById('debug-display9').textContent = `${textDebug}`;
		}
		function DebugDisplay10(textDebug)
			
		{ 
		 document.getElementById('debug-display10').textContent = `${textDebug}`;
		}
		function DebugDisplay11(textDebug)
			
		{ 
		 document.getElementById('debug-display11').textContent = `${textDebug}`;
		}
		function DebugDisplay12(textDebug)
			
		{ 
		 document.getElementById('debug-display12').textContent = `${textDebug}`;
		}
		
		  // Function to check if the device is in landscape mode
    function checkOrientation() {
    //  const statusElement = document.getElementById('status');

      // Use window.orientation (deprecated but still supported in some browsers)
      if (window.orientation !== undefined) {
        if (window.orientation === 90 || window.orientation === -90) {
    //      statusElement.textContent = "Landscape Mode";
	console.log(`Landscape Mode The viewport is ${viewportWidth}px wide and ${viewportHeight}px high.`);
	
        } else {
     //     statusElement.textContent = "Portrait Mode";
	 console.log(`Portrait Mode Landscape Mode The viewport is ${viewportWidth}px wide and ${viewportHeight}px high.`);
        }
      } 
      // Use matchMedia for modern browsers
      else if (window.matchMedia) {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      //  statusElement.textContent = isLandscape ? "Landscape Mode" : "Portrait Mode";
	   console.log(`Portrait Mode Landscape Mode The viewport is ${isLandscape} ${viewportWidth}px wide and ${viewportHeight}px high.`);
	   
      } else {
   //     statusElement.textContent = "Unable to detect orientation.";
   console.log(`Unable to detect orientation.`);
      }
    }

    // Event listener for orientation changes
    window.addEventListener("orientationchange", checkOrientation);

    // Event listener for resize (useful for WebGL canvas resizing)
    window.addEventListener("resize", checkOrientation);

    // Initial check
    checkOrientation();
		
//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture2(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  return texture;
}
//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    // Check if the image dimensions are a power of 2.
    // This is important for WebGL1's texture requirements.
    const isPowerOf2 = (value) => {
      return (value & (value - 1)) === 0;
    };

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // It's a power of 2, so we can use mipmaps.
      // Use linear filtering for both min and mag to get a smoother, high-quality look.
    //  gl.generateMipmap(gl.TEXTURE_2D);
    //  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    //  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	
    } else {
      // It's not a power of 2, so we cannot use mipmaps.
      // Set wrapping to clamp to edge to prevent repeating.
      // Use gl.NEAREST for a sharp, non-blurry, pixelated look.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	  
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
  };
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  image.src = url;
  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

        // --- Game State and Configuration ---
        const game = {
            levelComplete: false,
            gameOver: false,
            startTime: null,
            endTime: null,
            maxJumpHeight: 0,
            blocksJumpedOn: 0
        };
        
        const world = {
            width: 40000,
            height: 9000,
         //   gravity: 0.8
		    gravity: 1.2
        };

       

        // Added lastPlatform variable to track what the player is on
        let lastPlatform = null;

        const camera = {
            x: 0,
            y: 0,
            width: 16000,
            height: 9000
        };

// --- Textures and Framebuffer ---
    const playerTexture =  loadTexture(gl, 'assets/texture/player_1024x1024.png');
    const initialTerrainTexture =  loadTexture(gl, 'assets/texture/terrian.png');
    const explosionTexture =  loadTexture(gl, 'assets/texture/explosion.png');
	const platformTexture =  loadTexture(gl, 'assets/texture/platform_512x256.png');

	const groundTexture =  loadTexture(gl, 'assets/texture/ground_512x256.png');
	
	const enemyTexture =  loadTexture(gl, 'assets/texture/enemy_512x512.png');
	
	const bulletTexture =  loadTexture(gl, 'assets/texture/bullet_64x64.png');
	
	const platformendTexture =  loadTexture(gl, 'assets/texture/platformend_256x32-200x30.png');
	
	 const player = {
            x: 100,
            y: 5000,
            width: 800,
            height: 1000,
            velocityX: 0,
            velocityY: 0,
            speed: 60,
            jumpForce: 18 * 3,
            onGround: false,
            jumps: 0,
            health: 3,
            color: [0.9, 0.3, 0.3], // Reddish color
            invincible: false,
            invincibleTimer: 0,
            // New spindash properties
            isSpinDashing: false,
            isCharging: false,
            chargeTime: 0,
            spindashBoost: 0,
            spindashDecay: 0.99995,
			spindashDecay2: 0.80,
			faceingDirection:1,
			texture: playerTexture
        };
		
	
// custom buffers for each platform type of size
// 200x30
// 250x30
// 150x30
// 300x30
// 100x30
// 

// end platform 200x30

        const platforms = [
            // Ground
          //  { x: 0, y: 0, width: world.width, height: 40, color: [0.4, 0.5, 0.4] ,aDrawType: 1,  texture: groundTexture },
			
			 { x: 0, y: 0, width: world.width, height: 400, color: [0.4, 0.5, 0.4] ,aDrawType: 1,  texture: groundTexture },
            // Floating platforms - Original
            //{ x: 250, y: 150, width: 512, height: 128, color: [0.4, 0.5, 0.4] ,aDrawType: 1,  texture: platformTexture },
			{ x: 2500, y: 1500, width: 5120, height: 1280, color: [0.4, 0.5, 0.4] ,aDrawType: 1,  texture: platformTexture },
			
          //  { x: 550, y: 300, width: 200, height: 30, color: [0.4, 0.5, 0.4],aDrawType: 1,  texture: platformTexture },
		    { x: 5500, y: 3000, width: 2000, height: 300, color: [0.4, 0.5, 0.4],aDrawType: 1,  texture: platformTexture },
		  
          //  { x: 800, y: 450, width: 250, height: 30, color: [0.4, 0.5, 0.4],aDrawType: 1,  texture: platformTexture },
		    { x: 8000, y: 4500, width: 2500, height: 300, color: [0.4, 0.5, 0.4],aDrawType: 1,  texture: platformTexture },
			
           // { x: 500, y: 600, width: 150, height: 30, color: [0.4, 0.5, 0.4] ,aDrawType: 1,  texture: platformTexture},
		    { x: 5000, y: 6000, width: 1500, height: 300, color: [0.4, 0.5, 0.4] ,aDrawType: 1,  texture: platformTexture},
		   
        //    { x: 1200, y: 200, width: 300, height: 30, color: [0.4, 0.5, 0.4],aDrawType: 1,  texture: platformTexture },
		    { x: 12000, y: 2000, width: 3000, height: 300, color: [0.4, 0.5, 0.4],aDrawType: 1,  texture: platformTexture },
		
		
          //  { x: 1300, y: 550, width: 100, height: 30, color: [0.4, 0.5, 0.4] ,aDrawType: 1,  texture: platformTexture},
		    { x: 13000, y: 5500, width: 1000, height: 300, color: [0.4, 0.5, 0.4] ,aDrawType: 1,  texture: platformTexture},
			
            // New Platforms for an extended level
           // { x: 1800, y: 350, width: 200, height: 30, color: [0.5, 0.6, 0.5],aDrawType: 1,  texture: platformTexture },
		    { x: 18000, y: 3500, width: 2000, height: 300, color: [0.5, 0.6, 0.5],aDrawType: 1,  texture: platformTexture },
		   
         //   { x: 2100, y: 500, width: 150, height: 30, color: [0.5, 0.6, 0.5],aDrawType: 1,  texture: platformTexture },
		    { x: 21000, y: 5000, width: 1500, height: 300, color: [0.5, 0.6, 0.5],aDrawType: 1,  texture: platformTexture },
		 
           // { x: 2400, y: 250, width: 250, height: 30, color: [0.5, 0.6, 0.5] ,aDrawType: 1,  texture: platformTexture},
		    { x: 24000, y: 2500, width: 2500, height: 300, color: [0.5, 0.6, 0.5] ,aDrawType: 1,  texture: platformTexture},
			
         //   { x: 2800, y: 400, width: 200, height: 30, color: [0.5, 0.6, 0.5] ,aDrawType: 1,  texture: platformTexture},
		    { x: 28000, y: 4000, width: 2000, height: 300, color: [0.5, 0.6, 0.5] ,aDrawType: 1,  texture: platformTexture},
		 
          //  { x: 3100, y: 600, width: 100, height: 30, color: [0.5, 0.6, 0.5] ,aDrawType: 1,  texture: platformTexture},
		    { x: 31000, y: 6000, width: 1000, height: 300, color: [0.5, 0.6, 0.5] ,aDrawType: 1,  texture: platformTexture},
		  
         //   { x: 3400, y: 700, width: 300, height: 30, color: [0.5, 0.6, 0.5],aDrawType: 1,  texture: platformTexture },
		    { x: 34000, y: 7000, width: 3000, height: 300, color: [0.5, 0.6, 0.5],aDrawType: 1,  texture: platformTexture },
            // End Platform
         //   { x: 3800, y: 500, width: 200, height: 30, color: [0.9, 0.9, 0.2], isEndPlatform: true , aDrawType: 1, texture: platformendTexture},
		    { x: 38000, y: 5000, width: 2000, height: 300, color: [0.9, 0.9, 0.2], isEndPlatform: true , aDrawType: 1, texture: platformendTexture},
            // New moving platforms
          //  { x: 1600, y: 100, width: 150, height: 30, color: [0.2, 0.6, 0.8], isMoving: true, startX: 1600, endX: 2000, speed: 2, direction: 1  , aDrawType: 1, texture: platformTexture},
		    { x: 16000, y: 1000, width: 1500, height: 300, color: [0.2, 0.6, 0.8], isMoving: true, startX: 1600, endX: 2000, speed: 2, direction: 1  , aDrawType: 1, texture: platformTexture},
		  
         //   { x: 2600, y: 600, width: 100, height: 30, color: [0.2, 0.6, 0.8], isMoving: true, startX: 2600, endX: 3000, speed: 1.5, direction: 1 , aDrawType: 1, texture: platformTexture},
		    { x: 26000, y: 6000, width: 1000, height: 300, color: [0.2, 0.6, 0.8], isMoving: true, startX: 2600, endX: 3000, speed: 1.5, direction: 1 , aDrawType: 1, texture: platformTexture},
          // Newer spike Platforms
		  { x: 7500, y: 1000, width: 1000, height: 300, color: [0.8, 0.2, 0.2], isSpike: 1 ,aDrawType: 1, texture: platformTexture},
		

		  // New spike platforms
		//	{ x: 1500, y: 50, width: 100, height: 30, color: [0.8, 0.2, 0.2], isSpike: true ,aDrawType: 1, texture: platformTexture},
			{ x: 15000, y: 500, width: 1000, height: 300, color: [0.8, 0.2, 0.2], isSpike: 2 ,aDrawType: 1, texture: platformTexture},
		
          //  { x: 2200, y: 100, width: 100, height: 30, color: [0.8, 0.2, 0.2], isSpike: true ,aDrawType: 1, texture: platformTexture},
		    { x: 22000, y: 1000, width: 1000, height: 300, color: [0.8, 0.2, 0.2], isSpike: 2 ,aDrawType: 1, texture: platformTexture},
		  
         //   { x: 3000, y: 150, width: 150, height: 30, color: [0.8, 0.2, 0.2], isSpike: true ,aDrawType: 1, texture: platformTexture},
			   { x: 30000, y: 1500, width: 1500, height: 300, color: [0.8, 0.2, 0.2], isSpike: 2 ,aDrawType: 1, texture: platformTexture},
			   
          //  { x: 3000, y: 150, width: 150, height: 30, color: [0.8, 0.2, 0.2], isSpike: true ,aDrawType: 1, texture: platformTexture},
		    { x: 30000, y: 1500, width: 1500, height: 300, color: [0.8, 0.2, 0.2], isSpike: 2 ,aDrawType: 1, texture: platformTexture},
        ];

        const enemies = [
        //    { x: 700, y: 550, width: 50, height: 50, color: [0.2, 0.8, 0.8], patrol: { start: 700, end: 900, direction: 1 }, lastShot: 0, shootInterval: 1.5 ,aDrawType: 1,  texture: enemyTexture },
        //    { x: 2000, y: 550, width: 50, height: 50, color: [0.2, 0.8, 0.8], patrol: { start: 2000, end: 2300, direction: 1 }, lastShot: 0, shootInterval: 2 ,aDrawType: 1,  texture: enemyTexture},
        //    { x: 3000, y: 650, width: 50, height: 50, color: [0.2, 0.8, 0.8], patrol: { start: 3000, end: 3200, direction: 1 }, lastShot: 0, shootInterval: 1 ,aDrawType: 1,  texture: enemyTexture },
			
			
			    { x: 7000, y: 5500, width: 512, height: 512, color: [0.2, 0.8, 0.8], patrol: { start: 7000, end: 9000, direction: 1 }, lastShot: 0, shootInterval: 1.5 ,aDrawType: 1,  texture: enemyTexture },
            { x: 20000, y: 5500, width: 512, height: 512, color: [0.2, 0.8, 0.8], patrol: { start: 20000, end: 23000, direction: 1 }, lastShot: 0, shootInterval: 2 ,aDrawType: 1,  texture: enemyTexture},
            { x: 30000, y: 6500, width: 512, height: 512, color: [0.2, 0.8, 0.8], patrol: { start: 30000, end: 32000, direction: 1 }, lastShot: 0, shootInterval: 1 ,aDrawType: 1,  texture: enemyTexture },
        ];
        
        let bullets = [];

        const keys = {};

        // --- GLSL Shaders ---
        const vsSource = `
            attribute vec2 aVertexPosition;
			attribute vec2 aTextureCoord;
			attribute float aDrawType;
			
            uniform mat4 uProjectionMatrix;
            uniform mat4 uModelViewMatrix;
			
			varying highp vec2 vTextureCoord;
			varying mediump float vDrawType;
			
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 0.0, 1.0);
				 vTextureCoord = aTextureCoord;
				 vDrawType = aDrawType;
            }
        `;

        const fsSource = `
            precision mediump float;
            uniform vec3 uColor;
			
			 varying highp vec2 vTextureCoord;
				varying mediump float vDrawType;



			uniform sampler2D uSampler;
			
            void main() {
				
                 //gl_FragColor = vec4(uColor, 1.0);
				if(vDrawType > 0.9 && vDrawType < 1.1)
				{
				 gl_FragColor = texture2D(uSampler, vTextureCoord);
				}
				else
				{
					gl_FragColor = vec4(uColor, 1.0);
				}
				 
            }
        `;

        // --- WebGL Setup ---
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
        const programInfo = {
            program: shaderProgram,
            attribLocations: {
				 
				
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				texCoordPosition: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
				vertexDrawType: gl.getAttribLocation(shaderProgram, 'aDrawType'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
                color: gl.getUniformLocation(shaderProgram, 'uColor'),
            },
        };
	// add textures;
	
		 const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  //  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
 //       0.0, 0.0,
  //      1.0, 0.0,
 //       0.0, 1.0,
  //      0.0, 1.0,
 //       1.0, 0.0,
  //      1.0, 1.0,
  //  ]), gl.STATIC_DRAW);
  const textureCoords = new Float32Array([
        0.0,      0.0,
        1.0,  0.0,
        0.0,      1.0,
        1.0,  1.0,
    ]);
	// custom buffers for each platform type of size
	
   gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);

    const texCoordBufferTriangle = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferTriangle);
            const textureCoordsTriangle = new Float32Array([
                0.5, 1.0,
                0.0, 0.0,
                1.0, 0.0,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, textureCoordsTriangle, gl.STATIC_DRAW);

// add textures;

//alpha9
		  gl.enable(gl.BLEND);
   gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const rectBuffer = initBuffers(gl, 'rect');
        const triangleBuffer = initBuffers(gl, 'triangle');
		 const triangleBuffer_type2 = initBuffers_type2(gl, 'triangle');


		const drawtyperectBuffer0 = initBuffers_drawtype0(gl, 'rect');
		const drawtyperectBuffer1 = initBuffers_drawtype1(gl, 'rect');
		
		const drawtypetriangleBuffer0 = initBuffers_drawtype0(gl, 'triangle');
		const drawtypetriangleBuffer1 = initBuffers_drawtype1(gl, 'triangle');

		const playerBuffer = initBufferPlayer(gl, 'rect');

        // --- Event Listeners ---
        window.addEventListener('keydown', (e) => { keys[e.code] = true; });
        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
            // Spin dash release logic
            if ((e.code === 'ArrowDown' || e.code === 'KeyS') && player.isCharging) {
                player.isSpinDashing = true;
                // Calculate boost based on charge time
                player.spindashBoost = 100.0 + Math.min(player.chargeTime * 2000, 250);
				DebugDisplay7(`player.spindashBoost3 ${player.spindashBoost}  player.chargeTime  ${player.chargeTime} `);
                	DebugDisplay2('KeyS');
				player.velocityX = (keys['ArrowLeft'] || keys['KeyA']) ? -player.spindashBoost : player.spindashBoost;
                player.isCharging = false;
                player.chargeTime = 0;
            }
        });
        
        // --- Mobile Touch Event Listeners ---
        const leftButton = document.getElementById('left-button');
        const rightButton = document.getElementById('right-button');
        const jumpButton = document.getElementById('jump-button');
        const dashButton = document.getElementById('dash-button');
        
        // Map touch buttons to keys object
        leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowLeft'] = true; }, false);
        leftButton.addEventListener('touchend', (e) => { e.preventDefault(); keys['ArrowLeft'] = false; }, false);
        leftButton.addEventListener('touchcancel', (e) => { e.preventDefault(); keys['ArrowLeft'] = false; }, false);
        
        rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowRight'] = true; }, false);
        rightButton.addEventListener('touchend', (e) => { e.preventDefault(); keys['ArrowRight'] = false; }, false);
        rightButton.addEventListener('touchcancel', (e) => { e.preventDefault(); keys['ArrowRight'] = false; }, false);
        
        jumpButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['Space'] = true; }, false);
        jumpButton.addEventListener('touchend', (e) => { e.preventDefault(); keys['Space'] = false; }, false);
        jumpButton.addEventListener('touchcancel', (e) => { e.preventDefault(); keys['Space'] = false; }, false);

        dashButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowDown'] = true; }, false);
        dashButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['ArrowDown'] = false;
            if (player.isCharging) {
                player.isSpinDashing = true;
                player.spindashBoost = 100 + Math.min(player.chargeTime * 2000, 250);
				DebugDisplay7(`player.spindashBoost2 ${player.spindashBoost}`);
				DebugDisplay2('ArrowDown');
                player.velocityX = (keys['ArrowLeft'] || keys['KeyA']) ? -player.spindashBoost : player.spindashBoost;
                player.isCharging = false;
                player.chargeTime = 0;
            }
        }, false);
        dashButton.addEventListener('touchcancel', (e) => { e.preventDefault(); keys['ArrowDown'] = false; }, false);
        
        document.getElementById('restart-button').addEventListener('click', () => {
            resetGame();
        });
        document.getElementById('game-over-button').addEventListener('click', () => {
            resetGame();
        });

        // Hide/show the correct controls based on device
        function setupControls() {
            const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
            const controlsOverlay = document.getElementById('controls-overlay');
            const touchControls = document.getElementById('touch-controls');
            if (isTouchDevice) {
                controlsOverlay.style.display = 'none';
                touchControls.style.display = 'flex';
            } else {
                controlsOverlay.style.display = 'block';
                touchControls.style.display = 'none';
            }
        }
        setupControls();
        window.addEventListener('resize', setupControls);

        function updateHUD() {
            for (let i = 1; i <= 3; i++) {
                const heart = document.getElementById(`heart${i}`);
                if (heart) {
                    heart.style.color = (i <= player.health) ? 'red' : 'gray';
                }
            }
            // Update the blocks jumped on counter
            document.getElementById('blocks-jumped-hud').textContent = `Blocks: ${game.blocksJumpedOn}`;
        }

        function takeDamage() {
            if (player.invincible) return;
            player.health--;
            player.invincible = true;
            player.invincibleTimer = 1.5; // 1.5 seconds of invincibility
            updateHUD();
            if (player.health <= 0) {
                game.gameOver = true;
                showGameOverScreen();
            }
            // Removed the player reset logic to allow for continued play
            // as long as health is above zero.
        }
//file:///K:/Poop_Aura_PC_Game/HTML/Poop_Aura-verions_list-3D-Coin.html

        function resetGame() {
            player.x = 100;
            player.y = 500;
            player.velocityX = 0;
            player.velocityY = 0;
            player.onGround = false;
            player.jumps = 0;
            player.health = 3;
            player.invincible = false;
            player.invincibleTimer = 0;
            // Reset spindash
            player.isSpinDashing = false;
            player.isCharging = false;
            player.chargeTime = 0;
            player.spindashBoost = 0;
			player.faceingDirection = 1;
			
            lastPlatform = null; // Reset last platform on game reset

            game.levelComplete = false;
            game.gameOver = false;
            game.startTime = Date.now();
            game.endTime = null;
            game.maxJumpHeight = player.y;
            game.blocksJumpedOn = 0;

            // Reset enemies and bullets
            enemies.forEach(e => {
                e.x = e.patrol.start;
                e.direction = 1;
                e.lastShot = 0;
            });
            bullets = [];

            document.getElementById('end-screen').style.display = 'none';
            document.getElementById('game-over-screen').style.display = 'none';
            document.getElementById('controls-overlay').style.display = 'block';
            document.getElementById('hud').style.display = 'flex';
            updateHUD();
        }

        // --- Game Loop ---
        let lastTime = 0;
        function gameLoop(currentTime) {
            const deltaTime = (currentTime - lastTime) / 1000; // time in seconds
            lastTime = currentTime;

            if (!game.levelComplete && !game.gameOver) {
                update(deltaTime);
                drawScene(gl, programInfo, rectBuffer, triangleBuffer,drawtyperectBuffer0 , drawtyperectBuffer1,drawtypetriangleBuffer0, drawtypetriangleBuffer1 , texCoordBuffer,triangleBuffer_type2 );
                updateHUD();
            }
            
            requestAnimationFrame(gameLoop);
        }

        // --- Update Logic ---
        function update(deltaTime) {
            // Handle spindash state
			
			
	//		 if (Math.abs(player.velocityX) > player.speed) {
      //              player.isSpinDashing = false;
               //     player.velocityX = 0;
		//	   DebugDisplay('abs slowing down');
			   
		//		 player.velocityX *= player.spindashDecay2;
				 
        //        }
				
			DebugDisplay3(`player.isSpinDashing ${player.isSpinDashing}`);
			DebugDisplay4(`player.isCharging ${player.isCharging}`);
			DebugDisplay5(`player.isSpinDashing ${player.isSpinDashing}`);
			
			DebugDisplay6(`player.velocityX ${player.velocityX}`);
			
			
			
            if (player.isSpinDashing) {
               player.velocityX *= player.spindashDecay;
                if (Math.abs(player.velocityX) < player.speed) {
                    player.isSpinDashing = false;
                //    player.velocityX = 0;
				 DebugDisplay(`abs slowing down ${player.velocityX}`);
				 player.velocityX *= player.spindashDecay;
                }
				if (player.isCharging) {
                player.chargeTime += deltaTime ;
            }
				
            } else if (player.isCharging) {
                player.chargeTime += deltaTime ;
            } else {
                // Normal horizontal movement
            //    player.velocityX = 0;
				 player.velocityX *= player.spindashDecay2;
                if (keys['ArrowLeft'] || keys['KeyA']) {
                    player.velocityX = -player.speed;
					player.faceingDirection = 2;
                }
                if (keys['ArrowRight'] || keys['KeyD']) {
                    player.velocityX = player.speed;
					player.faceingDirection = 1;
                }
            }
            
            // Spin dash charge logic - NOW WORKS IN THE AIR
            if ((keys['ArrowDown'] || keys['KeyS'])  && !player.isSpinDashing) { // {// && !player.isSpinDashing) {
                player.isCharging = true;
			//	player.velocityX = 1000;
				 player.isSpinDashing = true;
            } else {
                player.isCharging = false;
                // If you release the key while in the air and charging, perform the dash
                if (player.chargeTime > 0) {
                    player.isSpinDashing = true;
					DebugDisplay('player.isSpinDashing = true;');
                    player.spindashBoost = 100 + Math.min(player.chargeTime * 2000, 250);
					DebugDisplay7(`player.spindashBoost1 ${player.spindashBoost}`);
					
                    player.velocityX = (keys['ArrowLeft'] || keys['KeyA']) ? -player.spindashBoost : player.spindashBoost;
                    player.chargeTime = 0;
                }
            }

            // Jumping (now with double jump)
            if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.jumps > 0) {
                player.velocityY = player.jumpForce;
                player.jumps--;
                lastPlatform = null; // Player is no longer on a platform
                keys['Space'] = false; // Prevent holding jump button
                keys['ArrowUp'] = false;
                keys['KeyW'] = false;
                player.isSpinDashing = false; // Cancels spin dash on jump
            }
            
            // Update moving platforms
            platforms.forEach(p => {
                if (p.isMoving) {
                    p.x += p.speed * p.direction;
                    if (p.x > p.endX || p.x < p.startX) {
                        p.direction *= -1;
                        p.x = p.x > p.endX ? p.endX : p.startX; // Clamp to avoid overshooting
                    }
                }
            });

            // Apply physics
            player.x += player.velocityX;
            player.y += player.velocityY;

            // Apply gravity
            player.velocityY -= world.gravity;
            player.onGround = false;
            
            // Track max jump height
            if (player.y > game.maxJumpHeight) {
                game.maxJumpHeight = player.y;
            }

            // Invincibility timer
            if (player.invincible) {
                player.invincibleTimer -= deltaTime;
                if (player.invincibleTimer <= 0) {
                    player.invincible = false;
                }
            }

            // Collision detection with platforms
            let onAplatform = false;
            for (const platform of platforms) {
                // Check for AABB collision
                if (player.x < platform.x + platform.width &&
                    player.x + player.width > platform.x &&
                    player.y < platform.y + platform.height &&
                    player.y + player.height > platform.y) {
                    
                    // Collision occurred, determine direction
                    const playerBottom = player.y;
                    const playerPrevBottom = player.y - player.velocityY;
                    const platformTop = platform.y + platform.height;

                    // Check if player was above the platform in the previous frame
                    if (playerPrevBottom >= platformTop) {
                        player.y = platformTop;
                        player.velocityY = 0;
                        onAplatform = true;
                        // Check if this is a new platform to count
                        if (lastPlatform !== platform) {
                            // Reset jumps when landing on a NEW platform
                            player.jumps = 2;
                            // Count blocks jumped on, but not the ground
                            if (platform.y > 0) {
                                game.blocksJumpedOn++;
								if (platform.isSpike == 1 ) {
                        takeDamage();
                    }
                            }
                            lastPlatform = platform;
                        }
                        // Move player with moving platform
                        if (platform.isMoving) {
                            player.x += platform.speed * platform.direction;
                        }
                        
                        // Check for end platform
                        if (platform.isEndPlatform && !game.levelComplete) {
                            game.levelComplete = true;
                            game.endTime = Date.now();
                            showEndScreen();
                        }
                    } else if (platform.isSpike == 2 ) {
                        takeDamage();
                    }
                }
            }
            if (!onAplatform) {
                lastPlatform = null; // Player is no longer on a platform
            }
            player.onGround = onAplatform;


            // Enemy logic
            for (const enemy of enemies) {
                // Patrol movement
                enemy.x += 1.5 * enemy.patrol.direction;
                if (enemy.x > enemy.patrol.end || enemy.x < enemy.patrol.start) {
                    enemy.direction *= -1;
                }

                // Shooting
                enemy.lastShot += deltaTime;
				DebugDisplay7(`enemy.lastShot ${enemy.lastShot} enemy.shootInterval ${enemy.shootInterval} `);
                if (enemy.lastShot > enemy.shootInterval) {
                    // Check if player is on the same height or lower
                  //  if (player.y < enemy.y && player.y + player.height > enemy.y - 1000) 
					  if(1)
					{
                        const bulletSpeed = 5;
                        const bulletVelocityX = (player.x + player.width / 2 - enemy.x + enemy.width / 2 > 0) ? bulletSpeed : -bulletSpeed;
                        const bulletVelocityY = (player.y + player.height / 2 - enemy.y + enemy.height / 2 > 0) ? bulletSpeed : -bulletSpeed;
                        DebugDisplay2(`Bullet Fire bulletVelocityX ${bulletVelocityX} x: ${enemy.x + enemy.width / 2} enemyx: ${enemy.x } playerx: ${player.x}`);
						bullets.push({ 
                      //      x: enemy.x + enemy.width / 2, 
                       //     y: enemy.y + enemy.height / 2, 
					                 x: enemy.x , 
                            y: enemy.y , 
                            velocityX: bulletVelocityX,
                            velocityY: bulletVelocityY,
                            width: 512, 
                            height: 512, 
                            color: [1.0, 0.0, 0.0] ,
							texture: bulletTexture
                        });
                        enemy.lastShot = 0;
                    }
                }

                // Collision with player
                if (player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y) {
                    takeDamage();
                }
            }

            // Bullet logic
            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i];
                bullet.x += bullet.velocityX;
                bullet.y += bullet.velocityY;

                // Bullet collision with player
                if (player.x < bullet.x + bullet.width &&
                    player.x + player.width > bullet.x &&
                    player.y < bullet.y + bullet.height &&
                    player.y + player.height > bullet.y) {
                    takeDamage();
               //     bullets.splice(i, 1); // Remove bullet
                } else if (bullet.x < camera.x - 50 || bullet.x > camera.x + camera.width + 50 || bullet.y < -100 || bullet.y > world.height + 100) {
                //    bullets.splice(i, 1); // Remove bullet if off-screen
                }
            }

						// Calculate the 60% threshold for the camera's height
			///const yThreshold = camera.height * 0.6;
			const yThreshold = 1000;

			// If the player's y position is greater than the threshold,
			// update the camera's y position
			if (player.y > camera.y + yThreshold) {
				camera.y = player.y + yThreshold;
			}
			//else if (player.y < camera.y - yThreshold) {
			//	camera.y = player.y + yThreshold;
			//}
			


            // World boundaries
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > world.width) player.x = world.width - player.width;

            // Respawn if falls off
            if (player.y < -100) {
                takeDamage();
            }

            // Update camera position to follow the player
            camera.x = player.x - camera.width / 2;

            // Clamp camera to world boundaries
            if (camera.x < 0) {
                camera.x = 0;
            }
            if (camera.x + camera.width > world.width) {
                camera.x = world.width - camera.width;
            }
			
			if (camera.y < 0) {
				camera.y = 0;
			}
			if (camera.y + camera.height > world.height) {
				camera.y = world.height - camera.height;
			}
        }

        // --- Drawing Logic ---
		// const drawtyperectBuffer0 = initBuffers_drawtype0(gl, 'rect');
		//const drawtyperectBuffer1 = initBuffers_drawtype1(gl, 'rect');
		
		//const drawtypetriangleBuffer0 = initBuffers_drawtype1(gl, 'triangle');
		//const drawtypetriangleBuffer1 = initBuffers_drawtype1(gl, 'triangle');



        function drawScene(gl, programInfo, rectBuffer, triangleBuffer,drawtyperectBuffer0 , drawtyperectBuffer1,drawtypetriangleBuffer0, drawtypetriangleBuffer1 , texCoordBuffer , triangleBuffer_type2 ) {
            resizeCanvasToDisplaySize(gl.canvas);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            gl.clearColor(0.1, 0.15, 0.2, 1.0); // Dark blue background
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Create a projection matrix that includes the camera's position
           // const projectionMatrix = createOrthographic(camera.x, camera.x + camera.width, 0, camera.height, -1, 1);
		
		// heavy detail mod
	//	    canvasWidth = viewportWidth * 10;
	//	canvasHeight = viewportHeight * 10;
		
		const projectionMatrix = createOrthographic(camera.x, camera.x + canvasWidth, 0, canvasHeight, -1, 1);

            gl.useProgram(programInfo.program);
            gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);

            // Draw platforms
            for (const platform of platforms) {
              //  drawRect(gl, programInfo, rectBuffer, platform.x, platform.y, platform.width, platform.height, platform.color);
			  drawRectTextured(gl, programInfo, rectBuffer, platform.x, platform.y, platform.width, platform.height, platform.color, platform.texture, drawtyperectBuffer1 , texCoordBuffer);
                // Draw spikes if it's a spike platform
				DebugDisplay12(`platform x ${platform.x} platform.isSpike ${platform.isSpike}`);
				
				if (platform.isSpike  == 2) {
                    drawSpikes2(gl, programInfo, triangleBuffer_type2, platform , drawtypetriangleBuffer0 , texCoordBufferTriangle );
                }
                else if(platform.isSpike == 1) {
                    drawSpikes(gl, programInfo, triangleBuffer, platform , drawtypetriangleBuffer0 , texCoordBufferTriangle );
                }
            }

            // Draw enemies
            for (const enemy of enemies) {
                drawRectTextured(gl, programInfo, rectBuffer, enemy.x, enemy.y, enemy.width, enemy.height, enemy.color , enemy.texture, drawtyperectBuffer1 , texCoordBuffer );
            }

            // Draw bullets
            for (const bullet of bullets) {
                drawRectTextured(gl, programInfo, rectBuffer, bullet.x, bullet.y, bullet.width, bullet.height, bullet.color , bullet.texture, drawtyperectBuffer1 , texCoordBuffer);
            }

            // Draw player (flicker if invincible)
            if (!player.invincible || (Math.floor(Date.now() / 100) % 2 === 0)) {
              //  drawRectTextured(gl, programInfo, rectBuffer, player.x, player.y, player.width, player.height, player.color , player.texture, drawtyperectBuffer1 , texCoordBuffer);
			  drawRectTexturedDetailPlayer(gl, programInfo, playerBuffer, player.x, player.y,  player.color , player.texture, drawtyperectBuffer1 , texCoordBuffer);
            }
        }

        function drawRect(gl, programInfo, buffer, x, y, width, height, color, drawtypetriangleBuffer , texCoordBuffer) {
            let modelViewMatrix = identity();
            modelViewMatrix = translate(modelViewMatrix, x, y, 0);
            modelViewMatrix = scale(modelViewMatrix, width, height, 1);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
            gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

//new
 gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
			gl.vertexAttribPointer(programInfo.attribLocations.texCoordPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.texCoordPosition);
//new
//new2
 gl.bindBuffer(gl.ARRAY_BUFFER, drawtypetriangleBuffer);
			gl.vertexAttribPointer(programInfo.attribLocations.vertexDrawType, 1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexDrawType);
//new2
            gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
            gl.uniform3fv(programInfo.uniformLocations.color, color);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
		 function drawRectTextured(gl, programInfo, buffer, x, y, width, height, color, texture , drawtypetriangleBuffer , texCoordBuffer) {
            let modelViewMatrix = identity();
            modelViewMatrix = translate(modelViewMatrix, x, y, 0);
            modelViewMatrix = scale(modelViewMatrix, width, height, 1);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
			
            gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
//new
 gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
			gl.vertexAttribPointer(programInfo.attribLocations.texCoordPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.texCoordPosition);
//new
//new2
			gl.bindBuffer(gl.ARRAY_BUFFER, drawtypetriangleBuffer);
			gl.vertexAttribPointer(programInfo.attribLocations.vertexDrawType, 1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexDrawType);
//new2
            gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
            gl.uniform3fv(programInfo.uniformLocations.color, color);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
			
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
		// uSampler
		
        
        function drawTriangle(gl, programInfo, buffer, x, y, width, height, color , drawtypetriangleBuffer , texCoordBuffer) {
            let modelViewMatrix = identity();
            modelViewMatrix = translate(modelViewMatrix, x, y, 0);
            modelViewMatrix = scale(modelViewMatrix, width, height, 1);




            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
            gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

//new
 gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
			gl.vertexAttribPointer(programInfo.attribLocations.texCoordPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.texCoordPosition);
//new
//  , texCoordBuffer
//new2
 gl.bindBuffer(gl.ARRAY_BUFFER, drawtypetriangleBuffer);
			gl.vertexAttribPointer(programInfo.attribLocations.vertexDrawType, 1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexDrawType);
//new2

            gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
            gl.uniform3fv(programInfo.uniformLocations.color, color);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        function drawSpikes(gl, programInfo, buffer, platform, drawtypetriangleBuffer  , texCoordBuffer) {
            const spikeWidth = 100;
            const spikeHeight = 150;
            const spikeColor = [0.4, 0.4, 0.4]; // Grey color for spikes
DebugDisplay10(` function drawSpikes spikeWidth ${spikeWidth} spikeHeight ${spikeHeight}`);
DebugDisplay11(`for  i ${Math.floor(platform.width / spikeWidth)}`);
            // Top spikes
            for (let i = 0; i < Math.floor(platform.width / spikeWidth); i++) {
                const x = platform.x + i * spikeWidth;
                const y = platform.y + platform.height;
				DebugDisplay9(`drawTriangle x ${x} y ${y}`);
				
                drawTriangle(gl, programInfo, buffer, x, y, spikeWidth, spikeHeight, spikeColor, drawtypetriangleBuffer  , texCoordBuffer);
            }
        }
		function drawSpikes2(gl, programInfo, buffer, platform, drawtypetriangleBuffer  , texCoordBuffer) {
            const spikeWidth = 150;
            const spikeHeight = 150;
            const spikeColor = [0.4, 0.4, 0.4]; // Grey color for spikes
DebugDisplay12(` function drawSpikes2 spikeWidth ${spikeWidth} spikeHeight ${spikeHeight}`);
DebugDisplay11(`for  i ${Math.floor(platform.width / spikeWidth)}`);

DebugDisplay8(` iMax ${Math.floor(platform.height / (spikeHeight))}`);
            // Top spikes
            for (let i = 0; i < Math.floor(platform.height / (spikeHeight)); i++) {
                const x = platform.x - spikeWidth;
                const y = platform.y  + i * (spikeHeight);
				DebugDisplay9(`drawTriangle2 x ${x} y ${y}`);
				
                drawTriangle(gl, programInfo, buffer, x, y, spikeWidth, spikeHeight, spikeColor, drawtypetriangleBuffer  , texCoordBuffer);
                const x2 = platform.x  + platform.width;
                const y2 = platform.y  + i * (spikeHeight);
				DebugDisplay9(`drawTriangle3 x ${x2} y ${y2}`);
				
                drawTriangle(gl, programInfo, buffer, x2, y2, spikeWidth, spikeHeight, spikeColor, drawtypetriangleBuffer  , texCoordBuffer);
            
			
			}
        }

		function drawRectTexturedDetailPlayer(gl, programInfo, buffer, x, y,  color, texture , drawtypetriangleBuffer , texCoordBuffer) {
            let modelViewMatrix = identity();
            modelViewMatrix = translate(modelViewMatrix, x, y, 0);
         //   modelViewMatrix = scale(modelViewMatrix, width, height, 1);
		// 20.48 , our 50 to 1024 aspect scale
		//width = 1.0/ 20.48;
		//height = 1.0/ 20.48;

		//modelViewMatrix = scale(modelViewMatrix, width, height, 1);
 
 
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
			
            gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
//new
 gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
			gl.vertexAttribPointer(programInfo.attribLocations.texCoordPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.texCoordPosition);
//new
//new2
			gl.bindBuffer(gl.ARRAY_BUFFER, drawtypetriangleBuffer);
			gl.vertexAttribPointer(programInfo.attribLocations.vertexDrawType, 1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexDrawType);
//new2
            gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
            gl.uniform3fv(programInfo.uniformLocations.color, color);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
			
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
		

        function showEndScreen() {
            const totalTime = ((game.endTime - game.startTime) / 1000).toFixed(2);
            document.getElementById('time-stat').textContent = `${totalTime}s`;
            document.getElementById('height-stat').textContent = `${game.maxJumpHeight.toFixed(0)}`;
            document.getElementById('blocks-stat').textContent = `${game.blocksJumpedOn}`;
            document.getElementById('end-screen').style.display = 'flex';
            document.getElementById('hud').style.display = 'none';
            document.getElementById('controls-overlay').style.display = 'none';
            document.getElementById('touch-controls').style.display = 'none';
        }

        function showGameOverScreen() {
            const totalTime = ((Date.now() - game.startTime) / 1000).toFixed(2);
            document.getElementById('game-over-time-stat').textContent = `${totalTime}s`;
            document.getElementById('game-over-blocks-stat').textContent = `${game.blocksJumpedOn}`;
            document.getElementById('game-over-screen').style.display = 'flex';
            document.getElementById('hud').style.display = 'none';
            document.getElementById('controls-overlay').style.display = 'none';
            document.getElementById('touch-controls').style.display = 'none';
        }

        // --- Utility Functions (not modified) ---
        function initShaderProgram(gl, vsSource, fsSource) {
            const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
            const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
            const shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
                return null;
            }
            return shaderProgram;
        }

        function loadShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        function initBuffers(gl, shape) {
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            let positions;
            if (shape === 'rect') {
                positions = [
                    0.0, 0.0,
                    1.0, 0.0,
                    0.0, 1.0,
                    1.0, 1.0,
                ];
            } else if (shape === 'triangle') {
                positions = [
                    0.5, 1.0, // Top
                    0.0, 0.0, // Bottom Left
                    1.0, 0.0, // Bottom Right
                ];
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            return { position: positionBuffer };
        }
		
		 function initBuffers_type2(gl, shape) {
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            let positions;
            if (shape === 'rect') {
                positions = [
                       0.0, 0.0,
      0.0, 1.0,
      -1.0, 0.0,
      -1.0, 1.0,
                ];
            } else if (shape === 'triangle') {
                positions = [
          -1.0, 0.5, // Rotated Top
      0.0, 0.0, // Rotated Bottom Left
      0.0, 1.0, // Rotated Bottom Right
                ];
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            return { position: positionBuffer };
        }
		
		
		 function initBuffers_drawtype1(gl, shape) {
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            let positions;
            if (shape === 'rect') {
                positions = [
                    1.0, 
                    1.0, 
                    1.0,
                    1.0, 
                ];
            } else if (shape === 'triangle') {
                positions = [
                    1.0,
                    1.0, 
                    1.0, 
                ];
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
          //  return { position: positionBuffer };
			return positionBuffer;
		  
			
        }
		
		function initBuffers_drawtype0(gl, shape) {
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            let positions;
            if (shape === 'rect') {
                positions = [
                    0.0, 
                    0.0, 
                    0.0,
                    0.0, 
                ];
            } else if (shape === 'triangle') {
                positions = [
                    0.0,
                    0.0, 
                    0.0, 
                ];
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
          //  return { position: positionBuffer };
		  return positionBuffer;
		  
        }
		
		function initBuffers_drawtypeNum(gl, shape,num) {
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            let positions;
            if (shape === 'rect') {
                positions = [
                    num, 
                    num, 
                    num,
                    num, 
                ];
            } else if (shape === 'triangle') {
                positions = [
                    num,
                    num, 
                    num, 
                ];
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
          //  return { position: positionBuffer };
		  return positionBuffer;
		  
        }
		
		 function initBufferPlayer(gl, shape) {
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            let positions;
            if (shape === 'rect') {
                /*positions = [
                    0.0, 0.0,
                    40.0, 0.0,
                    0.0,  60.0,
                    40.0, 60.0,
                ];*/
				positions = [
                    0.0, 0.0,
                    1024.0, 0.0,
                    0.0,  1024.0,
                    1024.0, 1024.0,
                ];
				// 1024
				
            } else if (shape === 'triangle') {
                positions = [
                    20.0, 60.0, // Top
                    0.0, 0.0, // Bottom Left
                    40.0, 0.0, // Bottom Right
                ];
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            return { position: positionBuffer };
        }
		
		// 
		
		
        function resizeCanvasToDisplaySize(canvas) {
            const displayWidth = canvas.clientWidth;
            const displayHeight = canvas.clientHeight;
            if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                canvas.width = displayWidth;
                canvas.height = displayHeight;
                camera.width = displayWidth;
                camera.height = displayHeight;
                return true;
            }
            return false;
        }

        function createOrthographic(left, right, bottom, top, near, far) {
            const m = identity();
            const w = right - left;
            const h = top - bottom;
            const d = far - near;
            m[0] = 2 / w;
            m[5] = 2 / h;
            m[10] = -2 / d;
            m[12] = -(left + right) / w;
            m[13] = -(top + bottom) / h;
            m[14] = -(far + near) / d;
            return m;
        }
		function createPerspective(fieldOfViewInRadians, aspectRatio, near, far) {
  const f = 1.0 / Math.tan(fieldOfViewInRadians / 2);
  const rangeInv = 1 / (near - far);

  const m = [
    f / aspectRatio, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];

  return m;
}
		

        function identity() {
            return [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
        }

        function translate(m, x, y, z) {
            const result = m.slice();
            result[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
            result[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
            result[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
            result[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
            return result;
        }

        function scale(m, x, y, z) {
            const result = m.slice();
            result[0] = m[0] * x;
            result[1] = m[1] * x;
            result[2] = m[2] * x;
            result[3] = m[3] * x;
            result[4] = m[4] * y;
            result[5] = m[5] * y;
            result[6] = m[6] * y;
            result[7] = m[7] * y;
            result[8] = m[8] * z;
            result[9] = m[9] * z;
            result[10] = m[10] * z;
            result[11] = m[11] * z;
            return result;
        }

        // Initialize and start the game loop
        resetGame();
        requestAnimationFrame(gameLoop);
    };
