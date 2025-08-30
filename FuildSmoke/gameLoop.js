function gameLoop() {
    // 1. Advect the velocity field by itself
    runShaderPass(advectShader, [velocity.read], velocity.write, {
        u_velocityTexture: velocity.read.texture,
        u_sourceTexture: velocity.read.texture,
        u_dissipation: 0.999
    });
    velocity.swap(); // Now velocity.write becomes velocity.read

    // 2. Advect the density field through the new velocity field
    runShaderPass(advectShader, [velocity.read, density.read], density.write, {
        u_velocityTexture: velocity.read.texture,
        u_sourceTexture: density.read.texture,
        u_dissipation: 0.99
    });
    density.swap();

    // 3. Add forces/density from user input (mouse splat)
    runShaderPass(splatShader, [velocity.read], velocity.write, { ... });
    velocity.swap();
    runShaderPass(splatShader, [density.read], density.write, { ... });
    density.swap();

    // 4. Projection Step
    runShaderPass(divergenceShader, [velocity.read], divergence, { ... });
    // Clear pressure texture
    clearFramebuffer(pressure.write);

    // Run pressure solver for ~30 iterations
    for (let i = 0; i < 30; i++) {
        runShaderPass(pressureShader, [pressure.read, divergence], pressure.write, { ... });
        pressure.swap();
    }

    // Subtract gradient
    runShaderPass(gradientSubtractShader, [pressure.read, velocity.read], velocity.write, { ... });
    velocity.swap();

    // 5. Finally, render the final density texture to the screen
    renderToScreen(density.read.texture);

    requestAnimationFrame(gameLoop);
}
