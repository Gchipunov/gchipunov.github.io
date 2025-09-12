// main.js

function main() {
    const canvas = document.querySelector("#glcanvas");
    const gl = canvas.getContext("webgl");
    // ... WebGL initialization ...

    // Create framebuffers for each portal
    const portalA_FBO = createFramebufferAndTexture(gl, gl.canvas.width, gl.canvas.height);
    const portalB_FBO = createFramebufferAndTexture(gl, gl.canvas.width, gl.canvas.height);

    // Assume portalA_modelMatrix and portalB_modelMatrix are defined
    // These matrices store the position, rotation, and scale of your portal quads

    function render(now) {
        // ---- 1. Calculate Virtual Camera for Portal A's view (looking out of B) ----
        const portalB_to_A_transform = mat4.create();
        const portalA_inverse = mat4.invert(mat4.create(), portalA_modelMatrix);
        
        // This matrix teleports any point from Portal A's space to Portal B's space
        mat4.multiply(portalB_to_A_transform, portalB_modelMatrix, portalA_inverse);

        const virtualViewMatrixA = mat4.create();
        mat4.multiply(virtualViewMatrixA, portalB_to_A_transform, mainCamera.viewMatrix);

        // ---- 2. Render Portal A's view to its framebuffer ----
        gl.bindFramebuffer(gl.FRAMEBUFFER, portalA_FBO.fb);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Draw the world from the virtual camera's perspective
        drawSceneGeometry(gl, programInfo, projectionMatrix, virtualViewMatrixA);


        // ---- 3. Calculate Virtual Camera for Portal B's view (looking out of A) ----
        const portalA_to_B_transform = mat4.create();
        const portalB_inverse = mat4.invert(mat4.create(), portalB_modelMatrix);
        mat4.multiply(portalA_to_B_transform, portalA_modelMatrix, portalB_inverse);

        const virtualViewMatrixB = mat4.create();
        mat4.multiply(virtualViewMatrixB, portalA_to_B_transform, mainCamera.viewMatrix);

        // ---- 4. Render Portal B's view to its framebuffer ----
        gl.bindFramebuffer(gl.FRAMEBUFFER, portalB_FBO.fb);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Draw the world from the other virtual camera's perspective
        drawSceneGeometry(gl, programInfo, projectionMatrix, virtualViewMatrixB);

        
        // ---- 5. Render the main scene to the canvas ----
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Draw to screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Draw the main scene from the player's perspective
        drawSceneGeometry(gl, programInfo, projectionMatrix, mainCamera.viewMatrix);

        // Now, draw the portal quads, binding the textures we just rendered
        drawPortalQuad(gl, programInfo, portalA_modelMatrix, portalB_FBO.texture);
        drawPortalQuad(gl, programInfo, portalB_modelMatrix, portalA_FBO.texture);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
