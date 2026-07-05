const MESHY_API_KEY = 'msy_your_secret_key_here';

// 1. Submit the Image Task
async function triggerImageTo3D(cleanedImageUrl) {
    const response = await fetch('https://api.meshy.ai/v2/image-to-3d', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${MESHY_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image_url: cleanedImageUrl,
            enable_pbr: true // Ensures you get high-quality material maps
        })
    });
    const data = await response.json();
    return data.result; // This is your task_id
}

// 2. Poll the status until completion
async function poll3DTask(taskId) {
    const checkInterval = 5000; // Check every 5 seconds
    
    while (true) {
        const response = await fetch(`https://api.meshy.ai/v2/image-to-3d/${taskId}`, {
            headers: { 'Authorization': `Bearer ${MESHY_API_KEY}` }
        });
        const data = await response.json();
        
        if (data.status === 'succeeded') {
            console.log('Success! Model URL:', data.model_urls.glb);
            return data.model_urls.glb;
        } else if (data.status === 'failed') {
            throw new Error(`Generation failed: ${data.failed_reason}`);
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
}
