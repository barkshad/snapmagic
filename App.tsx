
import React, { useState, useEffect, useCallback, ChangeEvent, DragEvent, useRef } from 'react';
import type { Photo, AITool, PhotoStatus } from './types';
import { PhotoCard } from './components/PhotoCard';
import { editImage } from './services/geminiService';

// --- ICONS ---
const MagicWandIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 4V2m0 16v-2m-7.5-13.5L6 4m12 1.5L16.5 7M3 12h2m14 0h2M7.5 16.5L6 18m12-1.5l1.5-1.5M12 3v2m0 14v2m-1 0h2m-8.5-3.5L7 16H5.5m9.5 0H17l-1.5-1.5M12 8v8m-3-4h6"/></svg>;
const DownloadIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const UploadIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 mx-auto text-gray-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const EraserIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21H7Z"/><path d="M22 21H7"/><path d="m5 12 5 5"/></svg>;
const SparklesIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
const FilmIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h4"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M21 7.5h-4"/><path d="M21 12h-4"/><path d="M21 16.5h-4"/></svg>;
const CameraIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
const CloseIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

interface Tool {
  id: AITool;
  name: string;
  icon: React.FC;
  needsPrompt: boolean;
  promptPlaceholder?: string;
}

const TOOLS: Tool[] = [
    { id: 'one-tap', name: 'One-Tap', icon: MagicWandIcon, needsPrompt: false },
    { id: 'remove-object', name: 'Remove', icon: EraserIcon, needsPrompt: true, promptPlaceholder: 'e.g., "the person in the red shirt"' },
    { id: 'custom', name: 'Custom', icon: SparklesIcon, needsPrompt: true, promptPlaceholder: 'e.g., "make the sky a dramatic sunset"' },
    { id: 'cinematic', name: 'Cinematic', icon: FilmIcon, needsPrompt: false },
    { id: 'vintage', name: 'Vintage', icon: CameraIcon, needsPrompt: false },
];

const getPromptForTool = (tool: AITool, customText: string): string => {
    switch (tool) {
        case 'remove-object': return `Flawlessly remove the following from the image: "${customText}". Intelligently fill in the background, maintaining consistency with the original lighting, textures, and shadows. The result should be photorealistic and show no signs of editing.`;
        case 'custom': return customText;
        case 'cinematic': return "Apply a strong cinematic color grade. Emphasize teal and orange tones, add a slight vignette, and increase contrast for a dramatic, film-like look.";
        case 'vintage': return "Give this photo a vintage, faded film look. Desaturate colors slightly, add a warm, yellowish tint, introduce subtle film grain, and soften the blacks.";
        case 'one-tap':
        default:
            return "Professionally enhance this photograph. Adjust lighting for optimal exposure, balance colors for a natural yet vibrant look, improve contrast for depth, and sharpen details subtly. Apply a modern, clean cinematic tone. Do not crop or change the aspect ratio.";
    }
};

const SplashScreen: React.FC = () => (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 animate-[fadeOut_3s_ease-in-out_forwards]">
        <h1 className="text-5xl font-bold text-white tracking-wider">SnapMagic</h1>
        <p className="text-gray-400 mt-4">Developed by Shadrack Baraka | Powered by AI.</p>
        <style>{`
            @keyframes fadeOut { 0%, 70% { opacity: 1; } 100% { opacity: 0; visibility: hidden; } }
        `}</style>
    </div>
);

const PromptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string) => void;
    tool: Tool | undefined;
}> = ({ isOpen, onClose, onSubmit, tool }) => {
    const [prompt, setPrompt] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setPrompt(''); // Reset prompt when tool changes
    }, [tool]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen || !tool) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div ref={modalRef} className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 transform animate-[slideIn_0.3s_ease-out]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white">Edit with: {tool.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><CloseIcon /></button>
                </div>
                <div className="p-6">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={tool.promptPlaceholder}
                        className="w-full h-28 p-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        aria-label="Custom edit prompt"
                    />
                    <button 
                        onClick={() => onSubmit(prompt)}
                        disabled={!prompt.trim()}
                        className="w-full mt-4 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        Apply Edit
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
            `}</style>
        </div>
    );
};


const App: React.FC = () => {
    const [showSplash, setShowSplash] = useState(true);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeTool, setActiveTool] = useState<AITool>('one-tap');
    const [isDragging, setIsDragging] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2800);
        return () => clearTimeout(timer);
    }, []);

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files) return;
        const newPhotos: Photo[] = Array.from(files)
          .filter(file => file.type.startsWith('image/'))
          .map(file => ({
            id: `${file.name}-${Date.now()}`,
            file,
            originalUrl: URL.createObjectURL(file),
            status: 'pending' as PhotoStatus,
        }));
        setPhotos(p => [...p, ...newPhotos]);
    }, []);
    
    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files);
    const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); };
    const handleDeletePhoto = (id: string) => setPhotos(p => p.filter(photo => photo.id !== id));

    const handleSelectTool = (tool: Tool) => {
        setActiveTool(tool.id);
        if (tool.needsPrompt) {
            setCustomPrompt('');
            setIsPromptModalOpen(true);
        }
    };

    const handlePromptSubmit = (prompt: string) => {
        setCustomPrompt(prompt);
        setIsPromptModalOpen(false);
        // Automatically start processing after prompt submission
        handleProcessPhotos(prompt);
    };
    
    const handleProcessPhotos = async (promptOverride?: string) => {
        const photosToProcess = photos.filter(p => p.status === 'pending');
        if (photosToProcess.length === 0) return;

        setIsProcessing(true);
        setProgress(0);

        const prompt = getPromptForTool(activeTool, promptOverride || customPrompt);
        let processedCount = 0;
        const totalToProcess = photosToProcess.length;

        const updatePhotoStatus = (id: string, status: PhotoStatus, editedUrl?: string) => {
            setPhotos(prev => prev.map(p => p.id === id ? { ...p, status, editedUrl: editedUrl || p.editedUrl } : p));
        };

        const processingPromises = photosToProcess.map(photo => {
            updatePhotoStatus(photo.id, 'processing');
            return editImage(photo.file, prompt)
                .then(url => updatePhotoStatus(photo.id, 'done', url))
                .catch(() => updatePhotoStatus(photo.id, 'error'))
                .finally(() => {
                    processedCount++;
                    setProgress(Math.round((processedCount / totalToProcess) * 100));
                });
        });

        await Promise.allSettled(processingPromises);
        setIsProcessing(false);
    };

    const handleDownloadAll = () => {
        photos.filter(p => p.status === 'done' && p.editedUrl).forEach((photo, index) => {
            const link = document.createElement('a');
            link.href = photo.editedUrl!;
            const [name, extension] = photo.file.name.split('.');
            link.download = `${name}-edited-${index}.${extension || 'png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const hasPendingPhotos = photos.some(p => p.status === 'pending');
    const hasEditedPhotos = photos.some(p => p.status === 'done');
    
    if (showSplash) return <SplashScreen />;

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col p-4 sm:p-6 lg:p-8">
            <PromptModal 
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                onSubmit={handlePromptSubmit}
                tool={TOOLS.find(t => t.id === activeTool)}
            />
            <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">SnapMagic</h1>
                <p className="text-gray-400 mt-2">Advanced AI Photo Editor</p>
            </header>

            <main className="flex-grow flex flex-col">
                <div className="w-full max-w-7xl mx-auto bg-gray-800/50 rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                        <div className="flex-wrap flex items-center gap-2" role="toolbar" aria-label="Editing tools">
                           {TOOLS.map(tool => (
                               <button key={tool.id} onClick={() => handleSelectTool(tool)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-full transition-all duration-200 ${activeTool === tool.id ? 'bg-indigo-600 text-white font-semibold shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                                   <tool.icon />
                                   {tool.name}
                               </button>
                           ))}
                        </div>
                        <div className="flex gap-4">
                             <button onClick={() => handleProcessPhotos()} disabled={!hasPendingPhotos || isProcessing || TOOLS.find(t => t.id === activeTool)?.needsPrompt} className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300">
                                Apply to All
                            </button>
                            <button onClick={handleDownloadAll} disabled={!hasEditedPhotos || isProcessing} className="flex items-center justify-center px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300">
                                <DownloadIcon /> Download
                            </button>
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="w-full bg-gray-700 rounded-full h-2.5 my-4">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                    
                    {photos.length === 0 ? (
                        <div onClick={() => document.getElementById('file-upload')?.click()} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}>
                            <UploadIcon />
                            <p className="mt-4 text-lg font-semibold text-gray-300">Drag & drop photos here</p>
                            <p className="text-sm text-gray-500">or click to select files</p>
                            <input id="file-upload" type="file" multiple accept="image/*" className="hidden" onChange={onFileChange} />
                        </div>
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                           {photos.map(photo => <PhotoCard key={photo.id} photo={photo} onDelete={handleDeletePhoto} />)}
                           <label htmlFor="file-upload-more" className="flex flex-col items-center justify-center aspect-square bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 hover:border-indigo-500 transition-colors cursor-pointer text-gray-500 hover:text-indigo-400">
                               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                               <span className="mt-2 text-sm font-semibold">Add more</span>
                           </label>
                           <input id="file-upload-more" type="file" multiple accept="image/*" className="hidden" onChange={onFileChange} />
                       </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
