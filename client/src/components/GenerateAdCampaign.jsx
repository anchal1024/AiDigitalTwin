import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Sparkles, Brain, Image as ImageIcon, Target, Wand2 } from 'lucide-react';

const LoadingStep = ({ icon: Icon, text, isActive }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: isActive ? 1 : 0.5, y: 0 }}
    className={`flex items-center gap-3 ${isActive ? 'text-yellow-400' : 'text-zinc-500'}`}
  >
    <motion.div
      animate={isActive ? { rotate: 360 } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Icon className="w-6 h-6" />
    </motion.div>
    <span className="font-medium">{text}</span>
  </motion.div>
);

const GenerateAdCampaign = () => {
  const [formData, setFormData] = useState({
    product_description: '',
    product_image: null
  });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [response, setResponse] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const loadingSteps = [
    { icon: Brain, text: "Analyzing previous campaign data..." },
    { icon: Target, text: "Identifying target audience..." },
    { icon: Sparkles, text: "Crafting compelling ad copy..." },
    { icon: Wand2, text: "Generating creative campaign elements..." },
    { icon: ImageIcon, text: "Creating campaign visuals..." }
  ];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, product_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setLoadingStep(0);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('product_description', formData.product_description);
      formDataToSend.append('product_image', formData.product_image);

      // Simulate step progression while actual processing happens
      const stepInterval = setInterval(() => {
        setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 2000);

      const response = await fetch('https://mosquito-kind-cobra.ngrok-free.app/generate-campaign', {
        method: 'POST',
        body: formDataToSend,
      });
      console.log(response);
      
      clearInterval(stepInterval);
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setResponse(data);
      toast.success('Campaign generated successfully!');
    } catch (error) {
      toast.error('Failed to generate campaign');
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const parseJsonString = (jsonString) => {
    try {
      // Handle different types of responses
      if (typeof jsonString === 'object') {
        return jsonString;
      }

      // Try to extract JSON from markdown code blocks
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Try parsing the string directly
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      // Return the raw string if parsing fails
      return {
        raw_content: jsonString,
        parsing_error: true
      };
    }
  };

  // Add this new component for rendering raw content
  const RawContentDisplay = ({ content }) => {
    if (typeof content === 'string') {
      // Split by line breaks and render each line
      return (
        <div className="bg-zinc-900/80 rounded-xl p-8 border border-yellow-500/20">
          <h3 className="text-xl font-semibold text-yellow-300 mb-4">Campaign Content</h3>
          <div className="prose prose-invert max-w-none">
            {content.split('\n').map((line, i) => (
              <p key={i} className="text-zinc-100 mb-2">{line}</p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <Card className="bg-zinc-800/50 border-yellow-500/20 shadow-lg shadow-yellow-500/5">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-yellow-400">Generate New Ad Campaign</h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-yellow-200 mb-2 block">Product Description</Label>
              <Textarea
                placeholder="Enter detailed product description..."
                className="bg-zinc-900/50 border-yellow-500/20 text-zinc-100 min-h-[120px]"
                value={formData.product_description}
                onChange={(e) => setFormData(prev => ({ ...prev, product_description: e.target.value }))}
              />
            </div>

            <div>
              <Label className="text-yellow-200 mb-2 block">Product Image</Label>
              <div className="border-2 border-dashed border-yellow-500/20 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="imageUpload"
                />
                <label 
                  htmlFor="imageUpload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-w-xs rounded-lg mb-2" />
                  ) : (
                    <Upload className="w-12 h-12 text-yellow-500/50" />
                  )}
                  <span className="text-yellow-500/50">Click to upload image</span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.product_description || !formData.product_image}
              className="w-full bg-yellow-500 text-zinc-900 hover:bg-yellow-400"
            >
              {loading ? 'Generating...' : 'Generate Campaign'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-zinc-800/50 border-yellow-500/20 shadow-lg shadow-yellow-500/5">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {loadingSteps.map((step, index) => (
                    <LoadingStep
                      key={index}
                      icon={step.icon}
                      text={step.text}
                      isActive={index === loadingStep}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Campaign Details */}
          <Card className="bg-zinc-800/50 border-yellow-500/20 shadow-lg shadow-yellow-500/5">
            <CardContent className="p-6 space-y-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Generated Campaign</h2>
              
              {response.ad_campaign && (
                <div className="space-y-8">
                  {(() => {
                    const adData = parseJsonString(response.ad_campaign.raw_response || response.ad_campaign);
                    
                    // Handle parsing error or non-JSON content
                    if (adData.parsing_error) {
                      return <RawContentDisplay content={adData.raw_content} />;
                    }

                    // If we have structured JSON data
                    if (adData) {
                      return (
                        <div className="space-y-8">
                          {/* Hero Section */}
                          <div className="bg-zinc-900/80 rounded-xl p-8 border border-yellow-500/20">
                            <div className="space-y-4">
                              {adData.product_type && (
                                <span className="text-yellow-300/75 text-sm uppercase tracking-wider">
                                  {adData.product_type}
                                </span>
                              )}
                              {adData.headline && (
                                <h3 className="text-4xl font-bold text-yellow-400 leading-tight">
                                  {adData.headline}
                                </h3>
                              )}
                              {adData.tagline && (
                                <p className="text-2xl text-yellow-300/90 font-medium">
                                  {adData.tagline}
                                </p>
                              )}
                              {adData.ad_copy && (
                                <p className="text-zinc-100 text-lg leading-relaxed">
                                  {adData.ad_copy}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Only render sections if they exist in the response */}
                          {adData.target_audience && (
                            <div className="bg-zinc-900/80 rounded-xl p-8 border border-yellow-500/20">
                              <h3 className="text-xl font-semibold text-yellow-300 mb-4">Target Audience</h3>
                              <p className="text-zinc-100 leading-relaxed">
                                {Array.isArray(adData.target_audience) 
                                  ? adData.target_audience.join(', ')
                                  : adData.target_audience}
                              </p>
                            </div>
                          )}

                          {/* Render other sections conditionally */}
                          {/* ... existing platform, duration, visual elements sections with null checks ... */}

                          {adData.call_to_action && (
                            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl p-8 border border-yellow-500/30">
                              <h3 className="text-xl font-semibold text-yellow-300 mb-4">Call to Action</h3>
                              <p className="text-2xl font-bold text-yellow-400 text-center">
                                {adData.call_to_action}
                              </p>
                            </div>
                          )}

                          {/* Render any additional fields that might exist */}
                          {Object.entries(adData).map(([key, value]) => {
                            // Skip already rendered fields
                            if (['product_type', 'headline', 'tagline', 'ad_copy', 'target_audience', 'platforms', 'campaign_duration', 'visual_elements', 'call_to_action'].includes(key)) return null;
                            
                            return (
                              <div key={key} className="bg-zinc-900/80 rounded-xl p-8 border border-yellow-500/20">
                                <h3 className="text-xl font-semibold text-yellow-300 mb-4">
                                  {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </h3>
                                <div className="text-zinc-100">
                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
              {console.log(response)}
              
          {/* Generated Image */}
          {response.generated_image && (
            <Card className="bg-zinc-800/50 border-yellow-500/20 shadow-lg shadow-yellow-500/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-yellow-300 mb-4">Generated Campaign Image</h3>
                <img 
                  src={`data:image/jpeg;base64,${response.generated_image}`}
                  alt="Generated Campaign"
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default GenerateAdCampaign;