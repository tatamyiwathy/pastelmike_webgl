import { Particle } from "../scripts/particle.js";
import { pickColor } from "../scripts/utils.js";

class MyParticle extends Particle {
    constructor(gl, position = [0, 0, 0], options = {}) {
        super(gl, position, options);

        this.setColor( pickColor(Math.random() * Math.PI * 2) );

        this.radius = 2.0;
        this.angle = 0;

    }

    setColor(color) {
        this.material.setColor(color);
    }


    updateFrame(deltaTime) {
        // Example: make the particle slowly rise over time
        // const angle = ((Math.PI * 2) / 1) * deltaTime; // Rotate around center
        // this.angle += angle;
        // this.position[0] = this.radius * Math.cos(this.angle);
        // this.position[2] = this.radius * Math.sin(this.angle);
    }
}

export { MyParticle };