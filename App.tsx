import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface Scene {
  id: number;
  description: string;
  style: string | null;
  shotSize: string | null;
  angle: string | null;
  movement: string | null;
  actorMovement: string | null;
  timeOfDay: string | null;
  lighting: string | null;
  transition: string | null;
  dialogue: string;
}

const auroraAnimationStyles = `
  @keyframes aurora-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(30vw, -20vh) scale(1.2); }
  }
  @keyframes aurora-2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-25vw, 30vh) scale(0.9); }
  }
  @keyframes aurora-3 {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(20vw, 15vh) rotate(10deg) scale(1.1); }
  }
  @keyframes aurora-4 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-20vw, -15vh) scale(1.1); }
  }
`;

const AuroraBackground = () => (
  <>
    <style>{auroraAnimationStyles}</style>
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <div 
        className="absolute top-[-50vh] left-[-30vw] w-[100vw] h-[100vw] sm:w-[80vw] sm:h-[80vw] bg-gradient-to-br from-purple-600 to-pink-500 rounded-full filter blur-3xl opacity-20"
        style={{ animation: 'aurora-1 20s ease-in-out infinite alternate' }}
      />
      <div 
        className="absolute bottom-[-50vh] right-[-30vw] w-[100vw] h-[100vw] sm:w-[80vw] sm:h-[80vw] bg-gradient-to-tr from-blue-500 to-teal-400 rounded-full filter blur-3xl opacity-15"
        style={{ animation: 'aurora-2 25s ease-in-out infinite alternate' }}
      />
      <div 
        className="hidden sm:block absolute top-[10vh] right-[5vw] w-[50vw] h-[50vw] bg-gradient-to-bl from-pink-500 via-red-400 to-yellow-500 rounded-full filter blur-3xl opacity-10"
        style={{ animation: 'aurora-3 18s ease-in-out infinite alternate' }}
      />
       <div 
        className="hidden sm:block absolute bottom-[5vh] left-[5vw] w-[40vw] h-[40vw] bg-gradient-to-tr from-cyan-400 to-green-300 rounded-full filter blur-3xl opacity-10"
        style={{ animation: 'aurora-4 22s ease-in-out infinite alternate' }}
      />
    </div>
  </>
);

const ConnectionStatusButton: React.FC<{ status: 'idle' | 'checking' | 'success' | 'error'; onClick: () => void; }> = ({ status, onClick }) => {
  const baseClasses = "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 ease-in-out border";
  
  switch (status) {
    case 'checking':
      return (
        <span className={`${baseClasses} bg-yellow-500/10 border-yellow-500/30 text-yellow-400 cursor-wait`}>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Checking...
        </span>
      );
    case 'success':
      return (
         <span className={`${baseClasses} bg-green-500/10 border-green-500/30 text-green-400`}>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Connected
         </span>
      );
    case 'error':
       return (
         <button onClick={onClick} className={`${baseClasses} bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            Check Again
         </button>
       );
    case 'idle':
    default:
      return (
        <button onClick={onClick} className={`${baseClasses} bg-slate-800/70 border-slate-700 hover:bg-slate-700/90 hover:border-purple-600 text-slate-300`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.707 3.293a1 1 0 010 1.414L6.414 9H16a1 1 0 110 2H6.414l4.293 4.293a1 1 0 01-1.414 1.414l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Check API Connection
        </button>
      );
  }
};


const App: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([
    { id: 1, description: '', style: null, shotSize: null, angle: null, movement: null, actorMovement: null, timeOfDay: null, lighting: null, transition: null, dialogue: '' }
  ]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [outputFormat, setOutputFormat] = useState<'markdown' | 'json'>('markdown');


  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if (await window.aistudio.hasSelectedApiKey()) {
          setApiKeyReady(true);
        }
      } catch (e) {
        console.error("Could not check for API key:", e);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    setError('');
    try {
      await window.aistudio.openSelectKey();
      // Assume success to handle race condition and show the app immediately
      setApiKeyReady(true);
    } catch(e) {
      console.error("Could not open API key selection:", e);
      setError("Could not open API key selection dialog.");
    }
  };
  
  const handleCheckConnection = async () => {
    setConnectionStatus('checking');
    setError(''); // Clear previous errors

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
        });

        if (response.text) {
            setConnectionStatus('success');
            setTimeout(() => setConnectionStatus('idle'), 3000); // Reset after 3 seconds
        } else {
            throw new Error("Received an empty response from the API.");
        }

    } catch (err) {
        setConnectionStatus('error');
        setTimeout(() => setConnectionStatus('idle'), 5000); // Reset after 5 seconds

        let errorMessage = 'Failed to connect to the API. Please try again.';
        if (err instanceof Error && err.message) {
            if (err.message.toLowerCase().includes('api key') || err.message.includes('requested entity was not found')) {
                errorMessage = 'Your API Key is invalid or has insufficient permissions. Please select a valid key.';
                setApiKeyReady(false); // Force re-selection of the key
            } else {
                console.error("Connection Check Error:", err.message);
            }
        } else {
            console.error("An unknown error occurred during connection check:", err);
        }
        setError(errorMessage);
    }
};

  const styles = [
    'Cinematic', 'Anime', 'Documentary', 'Vibrant Animation', 'Noir', 'Hyper-realistic', 'Fantasy', 'Sci-Fi'
  ];
  const shotSizes = [
    'Extreme Wide Shot', 'Wide Shot (WS)', 'Full Shot (FS)', 'Medium Full Shot (MFS)',
    'Medium Shot (MS)', 'Medium Close-Up (MCU)', 'Close-Up (CU)', 'Extreme Close-Up (ECU)'
  ];
  const angles = [
    'Eye-Level Shot',
    'Low-Angle Shot',
    'High-Angle Shot',
    "Bird's-Eye View",
    'Dutch Angle',
    "Worm's-Eye View",
    'Over-the-Shoulder Shot',
    'Point of View (POV) Shot',
    'Two-Shot',
    'Three-Shot',
    'Master Shot'
  ];
  const movements = [
    'Static',
    'Pan',
    'Tilt',
    'Dolly (Tracking Shot)',
    'Zoom',
    'Crane/Boom Shot',
    'Steadicam',
    'Handheld',
    'Pedestal',
    'Truck (Crab)',
    'Rack Focus (Focus Pull)',
    'Push In',
    'Pull Out',
    '360-degree Spin'
  ];

  const actorMovements = [
    'Running', 'Walking', 'Jumping', 'Dancing', 'Fighting', 'Slow Motion', 'Waving', 'Sitting', 'Standing Still'
  ];

  const transitions = [
    'Cut', 'Fade to Black', 'Dissolve', 'Wipe', 'Push', 'Slide', 'J-Cut', 'L-Cut', 'Match Cut'
  ];

  const timesOfDay = [
    'Morning', 'Afternoon', 'Evening', 'Night', 'Sunrise', 'Sunset', 'Golden Hour', 'Blue Hour'
  ];

  const lightingOptions = [
    'Bright Daylight', 'Soft Ambient', 'Dramatic Shadows', 'Backlit', 'Neon Glow'
  ];

  const handleSceneChange = (index: number, field: keyof Scene, value: any) => {
    const newScenes = [...scenes];
    (newScenes[index] as any)[field] = value;
    setScenes(newScenes);
  };

  const addScene = () => {
    setScenes([...scenes, {
      id: Date.now(),
      description: '',
      style: null,
      shotSize: null,
      angle: null,
      movement: null,
      actorMovement: null,
      timeOfDay: null,
      lighting: null,
      transition: 'Cut', // Default to a simple cut for new scenes
      dialogue: ''
    }]);
  };

  const removeScene = (index: number) => {
    if (scenes.length > 1) {
      const newScenes = scenes.filter((_, i) => i !== index);
      setScenes(newScenes);
    }
  };


  const handleGeneratePrompt = async () => {
    // 1. Client-side validation first
    const firstInvalidScene = scenes.find(s => !s.description || !s.style);
    if (firstInvalidScene) {
      setError(`Please complete the description and style for all scenes.`);
      return;
    }
    
    // 2. Set loading state and clear previous results
    setError('');
    setIsLoading(true);
    setGeneratedPrompt('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sceneBreakdown = scenes.map((scene, index) => `
---
Scene ${index + 1}:
${index > 0 && scene.transition ? `- Transition from previous scene: "${scene.transition}"` : ''}
- Description: "${scene.description}"
- Style: "${scene.style}"
- Time of Day: "${scene.timeOfDay || 'Not specified'}"
- Lighting: "${scene.lighting || 'Not specified'}"
- Shot Size: "${scene.shotSize || 'Not specified'}"
- Camera Angle: "${scene.angle || 'Not specified'}"
- Camera Movement: "${scene.movement || 'Not specified'}"
- Actor Movement: "${scene.actorMovement || 'Not specified'}"
${scene.dialogue ? `- Dialogue: "${scene.dialogue.replace(/"/g, "'")}"` : ''}
`).join('');

      let prompt = '';
      let config: any = {};

      if (outputFormat === 'json') {
          prompt = `You are an expert prompt engineer for the SORA text-to-video model. 
          Analyze the user's scene breakdown and generate a JSON response that follows the provided schema.
          
          Here is the user's scene breakdown:
          ${sceneBreakdown}`;

          config = {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    scene_number: { type: Type.INTEGER },
                    visual_description: { type: Type.STRING, description: "Prose description including style, lighting, time of day." },
                    cinematography: {
                        type: Type.OBJECT,
                        properties: {
                            camera_shot: { type: Type.STRING, description: "Combined shot size, angle, and movement." },
                            mood: { type: Type.STRING }
                        }
                    },
                    actions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING, description: "List of distinct actions." }
                    },
                    dialogue: { type: Type.STRING, description: "Dialogue or 'No dialogue specified'." }
                  },
                  required: ["scene_number", "visual_description", "cinematography", "actions"]
                }
              }
          };
      } else {
        prompt = `You are an expert prompt engineer for the SORA text-to-video model. Your task is to take a user's scene-by-scene breakdown and expand it into a detailed, structured prompt using Markdown for formatting.

For EACH scene from the user's breakdown, generate a response strictly following this format, and separate each scene's output with a horizontal line (---).

[Prose scene description in plain language. Incorporate the user's description, style, lighting, time of day, and actor movements to describe characters, costumes, scenery, weather, lighting, and other details. Be very descriptive and **bold** key visual elements. If there is a transition, mention it at the end of the prose (e.g., "...the scene then dissolves to the next."). ]

**Cinematography:**
- **Camera shot:** [Combine the user's selected shot size, camera angle, and movement here, e.g., "Medium Shot, Low-angle dolly shot"]
- **Mood:** [Infer an overall tone from the user's style and description, e.g., cinematic and tense, playful and suspenseful]

**Actions:**
- [Action 1: A clear, specific beat or gesture derived from the description and specified actor movement]
- [Action 2: Another distinct beat within the scene]
- [Action 3: Another action or a line of dialogue being spoken]

**Dialogue:**
[${'If the user provided dialogue, list it here. Otherwise, state "*No dialogue specified.*" '}]

Here is the user's scene breakdown:
${sceneBreakdown}
---

Generate the structured output for all scenes now. Use Markdown for all formatting (bolding, bullet points). Do not add any preamble, explanation, or titles before the first scene's output.`;
      }
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: config
      });

      let text = response.text || '';

      if (outputFormat === 'json' && text) {
          try {
             const parsed = JSON.parse(text);
             text = JSON.stringify(parsed, null, 2);
          } catch(e) {
             console.error("JSON parse error", e);
             // Leave text as is if parsing fails
          }
      }

      setGeneratedPrompt(text);

    } catch (err) {
      let errorMessage = 'An unexpected error occurred. Please try again later.';
      if (err instanceof Error && err.message) {
        if (err.message.toLowerCase().includes('api key') || err.message.includes('requested entity was not found')) {
            errorMessage = 'There is an issue with your API Key. Please select it again.';
            setApiKeyReady(false);
        } else {
             console.error("Gemini API Error:", err.message);
        }
      } else {
        console.error("An unknown error occurred:", err);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const buttonClass = (isSelected: boolean) => 
    `px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-lg transition-all duration-200 ease-in-out border-2 ${isSelected ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-800/70 border-slate-700 hover:bg-slate-700/90 hover:border-purple-600'}`;
  
  const isGenerationDisabled = useMemo(() => {
    return isLoading || scenes.some(s => !s.description || !s.style);
  }, [isLoading, scenes]);
  
  if (!apiKeyReady) {
    return (
      <>
        <AuroraBackground />
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900/50 rounded-2xl shadow-xl shadow-purple-500/10 backdrop-blur-sm border border-slate-700/50 p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-200 mb-4">Select API Key</h2>
            <p className="text-slate-400 mb-6">
              To use this prompt generation tool, please select your Google AI API key.
            </p>
            <button
              onClick={handleSelectKey}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-950 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-105"
            >
              Select Your API Key
            </button>
            <p className="text-xs text-slate-500 mt-4">
              Your API key is required to make requests to the Gemini API. For information on billing, please visit{' '}
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-400">
                ai.google.dev/gemini-api/docs/billing
              </a>.
            </p>
             {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuroraBackground />
      <div className="min-h-screen text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
        <div className="w-full max-w-7xl mx-auto">
          
          <header className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Sora Prompt Tool
            </h1>
            <p className="mt-4 text-lg text-slate-400 leading-relaxed">
              The ultimate tool for crafting banger Sora Videos, multi-scene video prompts,<br />
              scene transitions and much more.
              <span className="block mt-2 font-medium">Happy Prompting! - Sheldon</span>
            </p>
          </header>

          <main className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:items-start">
            {/* Input and Configuration Column */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-300">Your Scenes</h2>
                  <ConnectionStatusButton status={connectionStatus} onClick={handleCheckConnection} />
              </div>
              {scenes.map((scene, index) => (
                <div key={scene.id} className="bg-slate-900/50 rounded-2xl shadow-xl shadow-purple-500/10 backdrop-blur-sm border border-slate-700/50 p-6 space-y-6 relative">
                   <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-slate-200">Scene {index + 1}</h3>
                      {scenes.length > 1 && (
                          <button onClick={() => removeScene(index)} className="text-slate-500 hover:text-red-400 transition-colors" aria-label="Remove scene">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                          </button>
                      )}
                   </div>
                  {index > 0 && (
                     <div>
                      <label htmlFor={`transition-${scene.id}`} className="block text-sm font-medium text-slate-400 mb-2">Transition</label>
                      <select
                        id={`transition-${scene.id}`}
                        value={scene.transition || ''}
                        onChange={(e) => handleSceneChange(index, 'transition', e.target.value || null)}
                        className="block w-full appearance-none cursor-pointer px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm transition-all"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        <option value="">Not Specified</option>
                        {transitions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label htmlFor={`description-${scene.id}`} className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                    <textarea
                      id={`description-${scene.id}`}
                      rows={3}
                      className="block w-full px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all"
                      placeholder={`e.g., A robot solving a Rubik's cube.`}
                      value={scene.description}
                      onChange={(e) => handleSceneChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`dialogue-${scene.id}`} className="block text-sm font-medium text-slate-400 mb-2">Dialogue <span className="font-normal text-slate-500">(Optional)</span></label>
                    <textarea
                      id={`dialogue-${scene.id}`}
                      rows={2}
                      className="block w-full px-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all"
                      placeholder={`e.g., "I've been expecting you."`}
                      value={scene.dialogue}
                      onChange={(e) => handleSceneChange(index, 'dialogue', e.target.value)}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Style</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {styles.map(style => <button key={style} onClick={() => handleSceneChange(index, 'style', style)} className={buttonClass(scene.style === style)}>{style}</button>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     <div>
                      <label htmlFor={`shotSize-${scene.id}`} className="block text-sm font-medium text-slate-400 mb-2">Shot Size</label>
                      <select
                        id={`shotSize-${scene.id}`}
                        value={scene.shotSize || ''}
                        onChange={(e) => handleSceneChange(index, 'shotSize', e.target.value || null)}
                        className="block w-full appearance-none cursor-pointer px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm transition-all"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        <option value="">Not Specified</option>
                        {shotSizes.map(size => <option key={size} value={size}>{size}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`angle-${scene.id}`} className="block text-sm font-medium text-slate-400 mb-2">Camera Angle</label>
                      <select
                        id={`angle-${scene.id}`}
                        value={scene.angle || ''}
                        onChange={(e) => handleSceneChange(index, 'angle', e.target.value || null)}
                        className="block w-full appearance-none cursor-pointer px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm transition-all"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        <option value="">Not Specified</option>
                        {angles.map(angle => <option key={angle} value={angle}>{angle}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`movement-${scene.id}`} className="block text-sm font-medium text-slate-400 mb-2">Camera Movement</label>
                      <select
                        id={`movement-${scene.id}`}
                        value={scene.movement || ''}
                        onChange={(e) => handleSceneChange(index, 'movement', e.target.value || null)}
                        className="block w-full appearance-none cursor-pointer px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm transition-all"
                         style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        <option value="">Not Specified</option>
                        {movements.map(movement => <option key={movement} value={movement}>{movement}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`actorMovement-${scene.id}`} className="block text-sm font-medium text-slate-400 mb-2">Actor Movement</label>
                      <select
                        id={`actorMovement-${scene.id}`}
                        value={scene.actorMovement || ''}
                        onChange={(e) => handleSceneChange(index, 'actorMovement', e.target.value || null)}
                        className="block w-full appearance-none cursor-pointer px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm transition-all"
                         style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        <option value="">Not Specified</option>
                        {actorMovements.map(movement => <option key={movement} value={movement}>{movement}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`timeOfDay-${scene.id}`} className="block text-sm font-medium text-slate-400 mb-2">Time of Day</label>
                      <select
                        id={`timeOfDay-${scene.id}`}
                        value={scene.timeOfDay || ''}
                        onChange={(e) => handleSceneChange(index, 'timeOfDay', e.target.value || null)}
                        className="block w-full appearance-none cursor-pointer px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm transition-all"
                         style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        <option value="">Not Specified</option>
                        {timesOfDay.map(time => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`lighting-${scene.id}`} className="block text-sm font-medium text-slate-400 mb-2">Lighting</label>
                      <select
                        id={`lighting-${scene.id}`}
                        value={scene.lighting || ''}
                        onChange={(e) => handleSceneChange(index, 'lighting', e.target.value || null)}
                        className="block w-full appearance-none cursor-pointer px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm transition-all"
                         style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        <option value="">Not Specified</option>
                        {lightingOptions.map(light => <option key={light} value={light}>{light}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addScene} className="w-full text-center px-6 py-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-purple-500 hover:text-purple-400 transition-all duration-200">
                  + Add Another Scene
              </button>
              
              <div className="flex flex-col gap-2">
                 <div className="flex bg-slate-800/60 p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setOutputFormat('markdown')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                      outputFormat === 'markdown' 
                        ? 'bg-slate-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => setOutputFormat('json')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                      outputFormat === 'json' 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    JSON
                  </button>
                </div>

                <button 
                  onClick={handleGeneratePrompt}
                  disabled={isGenerationDisabled}
                  className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Crafting...
                    </>
                  ) : '✨ Craft My Prompt'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </div>

            {/* Output Column */}
            <div className="bg-slate-900/50 rounded-2xl shadow-inner-lg backdrop-blur-sm border border-slate-700/50 p-6 sm:p-8 relative xl:sticky top-8">
               <h3 className="text-lg font-semibold text-slate-300 mb-4">Your Crafted SORA Prompt</h3>
              <div className="relative">
                <textarea
                  readOnly
                  aria-label="Generated SORA prompt"
                  value={isLoading ? 'Generating your creative prompt...' : generatedPrompt || 'Your prompt will appear here...'}
                  className="w-full h-72 p-4 bg-slate-800/40 border border-slate-700/80 rounded-lg text-slate-300 placeholder-slate-500 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                />
                {generatedPrompt && (
                  <button 
                    onClick={handleCopy}
                    className="absolute top-2 right-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-200 bg-slate-700/80 text-slate-300 hover:bg-purple-600 hover:text-white"
                    aria-label="Copy prompt to clipboard"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </main>

          <footer className="text-center mt-12 text-slate-600 text-sm">
            <div className="mb-6 flex justify-center">
              <a href="https://www.buymeacoffee.com/sheldonatl" target="_blank" rel="noopener noreferrer">
                <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=sheldonatl&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" />
              </a>
            </div>
            <p>&copy; {new Date().getFullYear()} Sora Prompt Tool. Built with React & Gemini.</p>
          </footer>

        </div>
      </div>
    </>
  );
};

export default App;