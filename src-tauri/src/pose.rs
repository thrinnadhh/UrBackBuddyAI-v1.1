use ort::session::{Session, builder::GraphOptimizationLevel};
use ort::value::Tensor;
use std::sync::Mutex;
use std::path::PathBuf;
use image::{imageops::FilterType, GenericImageView};

#[derive(Debug, Clone, serde::Serialize)]
pub struct Landmark {
    pub x: f32, 
    pub y: f32, 
    pub z: f32, 
    pub visibility: f32, 
}

pub struct PoseEngine {
    session: Mutex<Option<Session>>,
}

impl PoseEngine {
    pub fn new() -> Self {
        Self { session: Mutex::new(None) }
    }

    pub fn load_model(&self, resource_path: PathBuf) -> Result<String, String> {
        let mut session_lock = self.session.lock().map_err(|_| "Failed to lock engine")?;
        if session_lock.is_some() { return Ok("Model already loaded".to_string()); }

        println!("🧠 Loading AI Model from: {:?}", resource_path);

        let model = Session::builder()
            .map_err(|e| format!("Builder error: {}", e))?
            .with_optimization_level(GraphOptimizationLevel::Level3)
            .map_err(|e| format!("Optimization error: {}", e))?
            .with_intra_threads(1)
            .map_err(|e| format!("Threads error: {}", e))? 
            .commit_from_file(resource_path)
            .map_err(|e| format!("Load error: {}", e))?;

        *session_lock = Some(model);
        println!("✅ AI Model Loaded Successfully!");
        Ok("AI Brain Online".to_string())
    }

    pub fn infer(&self, image_buffer: Vec<u8>, width: u32, height: u32) -> Result<Vec<Landmark>, String> {
        let mut session_lock = self.session.lock().map_err(|_| "Failed to lock engine")?;
        let session = session_lock.as_mut().ok_or("Model not loaded")?;

        // 1. Preprocessing (Resize & Normalize)
        let img = if image_buffer.len() == (width * height * 2) as usize {
            // Case A: YUYV Format (2 bytes per pixel) - Common on macOS
            // YUYV structure: [Y0, U, Y1, V] -> 4 bytes for 2 pixels
            let mut rgb_buffer = Vec::with_capacity((width * height * 3) as usize);
            
            for chunk in image_buffer.chunks_exact(4) {
                let y0 = chunk[0] as f32;
                let u  = chunk[1] as f32 - 128.0;
                let y1 = chunk[2] as f32;
                let v  = chunk[3] as f32 - 128.0;

                // Pixel 0 (Y0, U, V)
                let r0 = (y0 + 1.402 * v).max(0.0).min(255.0) as u8;
                let g0 = (y0 - 0.344136 * u - 0.714136 * v).max(0.0).min(255.0) as u8;
                let b0 = (y0 + 1.772 * u).max(0.0).min(255.0) as u8;

                // Pixel 1 (Y1, U, V)
                let r1 = (y1 + 1.402 * v).max(0.0).min(255.0) as u8;
                let g1 = (y1 - 0.344136 * u - 0.714136 * v).max(0.0).min(255.0) as u8;
                let b1 = (y1 + 1.772 * u).max(0.0).min(255.0) as u8;

                rgb_buffer.extend_from_slice(&[r0, g0, b0, r1, g1, b1]);
            }
            
            image::ImageBuffer::<image::Rgb<u8>, _>::from_raw(width, height, rgb_buffer)
                 .ok_or("Failed to create RGB buffer from YUYV")?

        } else if image_buffer.len() == (width * height * 3) as usize {
            // Case B: Standard RGB
            image::ImageBuffer::<image::Rgb<u8>, _>::from_raw(width, height, image_buffer)
                .ok_or("Failed to create RGB buffer")?
        } else {
             return Err(format!("Buffer Mismatch! Expected {} (RGB) or {} (YUYV) bytes, got {} bytes", 
                width * height * 3, width * height * 2, image_buffer.len()));
        };

        let img = image::DynamicImage::ImageRgb8(img);
        let resized = img.resize_exact(256, 256, FilterType::Triangle);

        // 2. Prepare Data Vector [1, 256, 256, 3] (NHWC)
        // The error "Got: 3 Expected: 256" at index 1 confirms the model wants NHWC
        let mut input_data = Vec::with_capacity(1 * 256 * 256 * 3);
        
        for (_x, _y, pixel) in resized.pixels() {
            // Normalize to 0.0 - 1.0 range
            input_data.push(pixel[0] as f32 / 255.0);
            input_data.push(pixel[1] as f32 / 255.0);
            input_data.push(pixel[2] as f32 / 255.0);
        }

        // 3. Create Tensor from (Shape, Data) Tuple
        // Shape is now [1, 256, 256, 3]
        let input_tensor = Tensor::from_array(([1, 256, 256, 3], input_data))
             .map_err(|e| {
                 println!("❌ Tensor Creation Failed: {}", e);
                 format!("Tensor creation failed: {}", e)
             })?;

        // 4. Run Inference
        // DYNAMIC INPUT NAME FIX:
        // Clone names to avoid holding a borrow on 'session' while running it
        let input_name = session.inputs()[0].name().to_string();
        let output_name = session.outputs()[0].name().to_string();
        
        let inputs = ort::inputs![input_name.as_str() => input_tensor];
        let outputs = session.run(inputs)
            .map_err(|e| {
                println!("❌ Session Run Failed: {}", e);
                format!("Inference failed: {}", e)
            })?;

        // 5. Extract Output
        // try_extract_tensor returns (Shape, DataSlice) in v2.0
        
        let output_tuple = outputs[output_name.as_str()].try_extract_tensor::<f32>()
            .map_err(|e| {
                println!("❌ Tensor Extraction Failed: {}", e);
                format!("Extraction failed: {}", e)
            })?;
        
        let data = output_tuple.1; // Access the data slice directly (Index 1 of tuple)

        // 6. Parse 33 Landmarks
        let mut landmarks = Vec::new();
        for i in 0..33 {
            let offset = i * 5; 
            if offset + 4 < data.len() {
                landmarks.push(Landmark {
                    x: data[offset],     
                    y: data[offset + 1],
                    z: data[offset + 2],
                    visibility: data[offset + 3], 
                });
            }
        }

        Ok(landmarks)
    }
}