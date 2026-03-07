#ifndef Renderer_hpp
#define Renderer_hpp

#include <Metal/Metal.hpp>
#include <QuartzCore/QuartzCore.hpp>

class Renderer {
public:
    Renderer(CA::MetalDrawable * const pDrawable, MTL::Device * const pDevice);
    ~Renderer();
    
    void draw() const;

private:
    CA::MetalDrawable * _pDrawable;
    MTL::Device * _pDevice;
    MTL::CommandQueue * _pCommandQueue;
};

#endif /* Renderer_hpp */
