// Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Camera position
        camera.position.set(0, 10, 20);
        camera.lookAt(0, 0, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 20, 10);
        scene.add(directionalLight);

        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);

        // Construction Hub
        const hubGeometry = new THREE.BoxGeometry(3, 3, 3);
        const hubMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.position.set(0, 1.5, 0);
        scene.add(hub);

        // Resource and building management
        let resources = { wood: 100, stone: 0, planks: 0 };
        let buildings = [];
        let selectedBuilding = null;
        let currentProject = null;
        let projectProgress = 0;

        // Building definitions
        const buildingTypes = {
            lumberMill: {
                cost: { wood: 10 },
                produce: { resource: 'wood', amount: 1, interval: 2000 },
                geometry: new THREE.BoxGeometry(2, 2, 2),
                material: new THREE.MeshBasicMaterial({ color: 0x8B4513 })
            },
            stoneQuarry: {
                cost: { wood: 10 },
                produce: { resource: 'stone', amount: 1, interval: 3000 },
                geometry: new THREE.BoxGeometry(2, 2, 2),
                material: new THREE.MeshBasicMaterial({ color: 0x696969 })
            }
        };

        // Project definitions
        const projects = {
            house: {
                cost: { planks: 20, stone: 10 },
                duration: 10000 // 10 seconds
            }
        };

        // Raycaster for mouse interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let intersectedPoint = null;

        // Event listeners
        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(ground);
            if (intersects.length > 0) {
                intersectedPoint = intersects[0].point;
            }
        });

        window.addEventListener('click', () => {
            if (selectedBuilding && intersectedPoint) {
                placeBuilding(selectedBuilding, intersectedPoint);
                selectedBuilding = null;
            }
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Building placement
        function placeBuilding(type, position) {
            const building = buildingTypes[type];
            let canAfford = true;
            for (let resource in building.cost) {
                if (resources[resource] < building.cost[resource]) {
                    canAfford = false;
                    break;
                }
            }
            if (canAfford) {
                for (let resource in building.cost) {
                    resources[resource] -= building.cost[resource];
                }
                const mesh = new THREE.Mesh(building.geometry, building.material);
                mesh.position.set(position.x, 1, position.z);
                scene.add(mesh);
                buildings.push({ type, mesh, produce: building.produce });
                updateUI();
            }
        }

        // Select building to place
        function selectBuilding(type) {
            selectedBuilding = type;
        }

        // Start a project
        function startProject(type) {
            if (!currentProject) {
                const project = projects[type];
                let canAfford = true;
                for (let resource in project.cost) {
                    if (resources[resource] < project.cost[resource]) {
                        canAfford = false;
                        break;
                    }
                }
                if (canAfford) {
                    for (let resource in project.cost) {
                        resources[resource] -= project.cost[resource];
                    }
                    currentProject = { type, duration: project.duration, startTime: Date.now() };
                    updateUI();
                }
            }
        }

        // Resource production
        setInterval(() => {
            buildings.forEach(building => {
                if (building.produce && Math.random() < 0.1) { // Simulate production interval
                    resources[building.produce.resource] += building.produce.amount;
                    if (building.produce.resource === 'wood') {
                        resources.planks += Math.floor(resources.wood / 2);
                        resources.wood = resources.wood % 2;
                    }
                    updateUI();
                }
            });
        }, 1000);

        // Project progress
        setInterval(() => {
            if (currentProject) {
                const elapsed = Date.now() - currentProject.startTime;
                projectProgress = Math.min((elapsed / currentProject.duration) * 100, 100);
                updateUI();
                if (projectProgress >= 100) {
                    resources.wood += 50; // Reward for completing project
                    currentProject = null;
                    projectProgress = 0;
                    updateUI();
                }
            }
        }, 100);

        // Update UI
        function updateUI() {
            document.getElementById('wood').textContent = resources.wood;
            document.getElementById('stone').textContent = resources.stone;
            document.getElementById('planks').textContent = resources.planks;
            document.getElementById('project').textContent = currentProject ? currentProject.type : 'None';
            document.getElementById('progress').textContent = projectProgress.toFixed(1) + '%';
        }

        // Game loop
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();
