
import React, { useState, useEffect, useCallback, ChangeEvent, DragEvent } from 'react';
import type { Photo, FilterType, PhotoStatus } from './types';
import { PhotoCard } from './components/PhotoCard';
import { editImage } from './services/geminiService';

const MagicWandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M15 4V2m0 16v-2m-7.5-13.5L6 4m12 1.5L16.5 7M3 12h2m14 0h2M7.5 16.5L6 18m12-1.5l1.5-1.5M12 3v2m0 14v2m-1 0h2m-8.5-3.5L7 16H5.5m9.5 0H17l-1.5-1.5M12 8v8m-3-4h6"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 mx-auto text-gray-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;

const FILTERS: { id: FilterType; name: string }[] = [
    { id: 'one-tap', name: 'One-Tap Enhance' },
    { id: 'cinematic', name: 'Cinematic' },
    { id: 'vintage', name: 'Vintage' },
    { id: 'vibrant', name: 'Vibrant' },
    { id: 'soft-glow', name: 'Soft Glow' },
];

const getPromptForFilter = (filter: FilterType): string => {
    switch (filter) {
        case 'cinematic': return "Apply a strong cinematic color grade. Emphasize teal and orange tones, add a slight vignette, and increase contrast for a dramatic, film-like look.";
        case 'vintage': return "Give this photo a vintage, faded film look. Desaturate colors slightly, add a warm, yellowish tint, introduce subtle film grain, and soften the blacks.";
        case 'vibrant': return "Make this photo pop with vibrant colors. Boost saturation and vibrance, enhance the contrast, and make the colors rich and lively without looking unnatural.";
        case 'soft-glow': return "Apply a soft, dreamy glow effect. Reduce harsh shadows, slightly decrease clarity, and add a gentle, ethereal bloom to the highlights.";
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
            @keyframes fadeOut {
                0%, 70% { opacity: 1; }
                100% { opacity: 0; visibility: hidden; }
            }
        `}</style>
    </div>
);

const App: React.FC = () => {
    const [showSplash, setShowSplash] = useState(true);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeFilter, setActiveFilter] = useState<FilterType>('one-tap');
    const [isDragging, setIsDragging] = useState(false);

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

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDeletePhoto = (id: string) => {
        setPhotos(p => p.filter(photo => photo.id !== id));
    };
    
    const handleProcessPhotos = async () => {
        const photosToProcess = photos.filter(p => p.status === 'pending');
        if (photosToProcess.length === 0) return;

        setIsProcessing(true);
        setProgress(0);

        let processedCount = 0;
        const totalToProcess = photosToProcess.length;
        const prompt = getPromptForFilter(activeFilter);

        const updatePhotoStatus = (id: string, status: PhotoStatus, editedUrl?: string) => {
            setPhotos(prevPhotos => prevPhotos.map(p => 
                p.id === id ? { ...p, status, editedUrl: editedUrl || p.editedUrl } : p
            ));
        };

        const processingPromises = photosToProcess.map(photo => {
            updatePhotoStatus(photo.id, 'processing');
            return editImage(photo.file, prompt)
                .then(editedUrl => {
                    updatePhotoStatus(photo.id, 'done', editedUrl);
                })
                .catch(() => {
                    updatePhotoStatus(photo.id, 'error');
                })
                .finally(() => {
                    processedCount++;
                    setProgress(Math.round((processedCount / totalToProcess) * 100));
                });
        });

        await Promise.allSettled(processingPromises);
        setIsProcessing(false);
    };

    const handleDownloadAll = () => {
        const editedPhotos = photos.filter(p => p.status === 'done' && p.editedUrl);
        editedPhotos.forEach((photo, index) => {
            const link = document.createElement('a');
            link.href = photo.editedUrl!;
            const nameParts = photo.file.name.split('.');
            const extension = nameParts.pop();
            const name = nameParts.join('.');
            link.download = `${name}-edited-${index}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const hasPendingPhotos = photos.some(p => p.status === 'pending');
    const hasEditedPhotos = photos.some(p => p.status === 'done');
    
    if (showSplash) {
        return <SplashScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">
                    SnapMagic
                </h1>
                <p className="text-gray-400 mt-2">One-Tap AI Photo Enhancement</p>
            </header>

            <main className="flex-grow flex flex-col">
                <div className="w-full max-w-7xl mx-auto bg-gray-800/50 rounded-xl shadow-2xl p-4 sm:p-6 border border-gray-700">
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                        <div className="flex-wrap flex items-center gap-2">
                           {FILTERS.map(filter => (
                               <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`px-4 py-2 text-sm rounded-full transition-colors ${activeFilter === filter.id ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                                   {filter.name}
                               </button>
                           ))}
                        </div>
                        <div className="flex gap-4">
                             <button onClick={handleProcessPhotos} disabled={!hasPendingPhotos || isProcessing} className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300">
                                <MagicWandIcon />
                                {isProcessing ? 'Editing...' : 'Edit Photos'}
                            </button>
                            <button onClick={handleDownloadAll} disabled={!hasEditedPhotos || isProcessing} className="flex items-center justify-center px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300">
                                <DownloadIcon />
                                Download All
                            </button>
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="w-full bg-gray-700 rounded-full h-2.5 my-4">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                    
                    {photos.length === 0 ? (
                        <div
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                        >
                            <UploadIcon />
                            <p className="mt-4 text-lg font-semibold text-gray-300">Drag & drop photos here</p>
                            <p className="text-sm text-gray-500">or click to select files</p>
                            <input id="file-upload" type="file" multiple accept="image/*" className="hidden" onChange={onFileChange} />
                        </div>
                    ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                           {photos.map(photo => (
                               <PhotoCard key={photo.id} photo={photo} onDelete={handleDeletePhoto} />
                           ))}
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
