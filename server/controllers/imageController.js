import { HfInference } from "@huggingface/inference";
const api_key = process.env.HUGGINGFACE_API_KEY;
let image_final = null;
const { GoogleGenerativeAI } = await import("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



const generateImage = async (prompt, model) => {
  const client = new HfInference(api_key);
  const image = await client.textToImage({
    model: model,
    inputs: prompt,
    parameters: { num_inference_steps: 5 },
    provider: "hf-inference",
  });

  const buffer = await image.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  
  if(model === "stabilityai/stable-diffusion-3.5-large-turbo"){
    image_final = base64; // Store just the base64 string
  }
  
  return `data:image/jpeg;base64,${base64}`;
};

export const image1 = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    // console.log("Generating image 1...");
    const image_data = await generateImage(prompt,"stabilityai/stable-diffusion-xl-base-1.0");
    res.status(200).json({ image_data });
  } catch (error) {
    console.error("Image generation failed:", error);
    res.status(500).json({ 
      message: "Failed to generate image",
      error: error.message 
    });
  }
};


export const image2 = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }
  
    try {
    //   console.log("Generating image 1...");
      const image_data = await generateImage(prompt,"XLabs-AI/flux-RealismLora");
      res.status(200).json({ image_data });
    } catch (error) {
      console.error("Image generation failed:", error);
      res.status(500).json({ 
        message: "Failed to generate image",
        error: error.message 
      });
    }
};


export const image3 = async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }
  
    try {
    //   console.log("Generating image 1...");
      const image_data = await generateImage(prompt,"stabilityai/stable-diffusion-3.5-large-turbo");
      res.status(200).json({ image_data });
    } catch (error) {
      console.error("Image generation failed:", error);
      res.status(500).json({ 
        message: "Failed to generate image",
        error: error.message 
      });
    }
  };

export const generateCaption = async (req, res) => {
  try {
    if (!image_final) {
        return res.status(400).json({ message: "No image available" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" ,api_key: process.env.GEMINI_API_KEY});

    const imageParts = [{
        inlineData: {
            data: image_final, // Use the base64 string directly
            mimeType: "image/jpeg"
        }
    }];

    const result = await model.generateContent(["Generate 5 different captions for this image. Give the output in the for of markdown. also dont give any other information just give the 5 points in a numbered manner in markdown. this is the image for an ad campaign, make some nice spicy captions as if it were for professional marketing company", ...imageParts]);
    const response = await result.response;
    const captions = response.text();
    res.status(200).json({ caption: captions }); // Send the actual captions instead of placeholder
  } catch (error) {
    console.error("Caption generation failed:", error);
    res.status(500).json({ 
      message: "Failed to generate caption",
      error: error.message 
    });
  }
};





