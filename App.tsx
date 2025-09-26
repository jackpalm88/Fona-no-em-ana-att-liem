
import React, { useState, useCallback, useMemo } from 'react';
import { OperationMode } from './types';
import { processImage } from './services/geminiService';

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imagePreviewUrl: string | null;
  title: string;
  id: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreviewUrl, title, id }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor={id} className="cursor-pointer block">
        <div className="w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex flex-col justify-center items-center text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors duration-300 bg-gray-800/50">
          {imagePreviewUrl ? (
            <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
          ) : (
            <>
              <UploadIcon className="w-12 h-12 mb-2" />
              <span className="font-semibold">{title}</span>
              <span className="text-sm">Noklikšķiniet, lai augšupielādētu</span>
            </>
          )}
        </div>
      </label>
      <input id={id} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

const Loader: React.FC = () => (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col justify-center items-center z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="mt-4 text-white text-lg font-semibold">Apstrādā... Lūdzu uzgaidiet.</p>
    </div>
);


const App: React.FC = () => {
  const [mode, setMode] = useState<OperationMode>(OperationMode.TRANSPARENT);
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const originalImagePreview = useMemo(() => originalImage ? URL.createObjectURL(originalImage) : null, [originalImage]);
  const backgroundImagePreview = useMemo(() => backgroundImage ? URL.createObjectURL(backgroundImage) : null, [backgroundImage]);

  const handleProcessImage = useCallback(async () => {
    if (!originalImage) {
      setError('Lūdzu, augšupielādējiet sākotnējo attēlu.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    let apiPrompt = '';
    let bgImage: File | undefined = undefined;

    switch (mode) {
      case OperationMode.TRANSPARENT:
        apiPrompt = "Isolate the main subject from the image and make the background transparent. The output should be a PNG image with a transparent background.";
        break;
      case OperationMode.AI_BACKGROUND:
        if (!prompt.trim()) {
          setError('Lūdzu, ievadiet aprakstu jaunajam fonam.');
          setIsLoading(false);
          return;
        }
        apiPrompt = `Replace the background of the image with the following scene: ${prompt}. Keep the main subject from the original image.`;
        break;
      case OperationMode.CUSTOM_BACKGROUND:
        if (!backgroundImage) {
          setError('Lūdzu, augšupielādējiet fona attēlu.');
          setIsLoading(false);
          return;
        }
        apiPrompt = "Take the main subject from the first image and place it realistically onto the background provided in the second image. Blend the subject with the new background, matching lighting and perspective.";
        bgImage = backgroundImage;
        break;
    }

    try {
      const result = await processImage(apiPrompt, originalImage, bgImage);
      setResultImage(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Notika neparedzēta kļūda.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, backgroundImage, mode, prompt]);

  const isProcessButtonDisabled = !originalImage || isLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
      <main className="max-w-7xl mx-auto">
        {isLoading && <Loader />}
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Gemini Fona Noņemšanas Rīks
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Viegli noņemiet, aizstājiet vai ģenerējiet attēlu fonus ar Gemini 2.5 jaudu.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-700 pb-2">1. Augšupielādēt attēlu</h2>
              <ImageUploader 
                id="original-image"
                title="Sākotnējais attēls"
                onImageUpload={setOriginalImage}
                imagePreviewUrl={originalImagePreview}
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-700 pb-2">2. Izvēlieties režīmu</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setMode(OperationMode.TRANSPARENT)}
                  className={`p-4 rounded-lg font-semibold transition-all duration-200 ${mode === OperationMode.TRANSPARENT ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Caurspīdīgs fons
                </button>
                <button
                  onClick={() => setMode(OperationMode.AI_BACKGROUND)}
                  className={`p-4 rounded-lg font-semibold transition-all duration-200 ${mode === OperationMode.AI_BACKGROUND ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  AI fons
                </button>
                <button
                  onClick={() => setMode(OperationMode.CUSTOM_BACKGROUND)}
                  className={`p-4 rounded-lg font-semibold transition-all duration-200 ${mode === OperationMode.CUSTOM_BACKGROUND ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Pielāgots fons
                </button>
              </div>
            </div>

            <div className="min-h-[224px]">
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-700 pb-2">3. Iestatījumi</h2>
              {mode === OperationMode.AI_BACKGROUND && (
                <div className="space-y-3">
                    <label htmlFor="prompt" className="font-semibold text-gray-300">Aprakstiet jauno fonu:</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Piemēram, 'futūristiska pilsēta naktī ar neona gaismām'"
                        className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                </div>
              )}
              {mode === OperationMode.CUSTOM_BACKGROUND && (
                 <ImageUploader 
                    id="background-image"
                    title="Fona attēls"
                    onImageUpload={setBackgroundImage}
                    imagePreviewUrl={backgroundImagePreview}
                 />
              )}
              {mode === OperationMode.TRANSPARENT && (
                <div className="flex items-center justify-center h-48 bg-gray-900/50 rounded-lg">
                    <p className="text-gray-400 text-center">Fons tiks noņemts, atstājot galveno objektu.<br/>Nekādi papildu iestatījumi nav nepieciešami.</p>
                </div>
              )}
            </div>
            
            <button
                onClick={handleProcessImage}
                disabled={isProcessButtonDisabled}
                className="w-full text-lg font-bold py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              Apstrādāt attēlu
            </button>
            {error && <p className="text-red-400 text-center font-semibold mt-4">{error}</p>}
          </div>

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center items-center min-h-[500px] lg:min-h-full">
            <h2 className="text-2xl font-bold mb-4 self-start">Rezultāts</h2>
            <div className="w-full h-full flex-grow flex justify-center items-center bg-checkered-pattern rounded-lg bg-gray-700">
                {resultImage ? (
                    <div className="relative group">
                        <img src={resultImage} alt="Processed result" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" />
                        <a 
                          href={resultImage} 
                          download="processed-image.png"
                          className="absolute bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-indigo-700"
                          aria-label="Download Image"
                        >
                          <DownloadIcon className="w-6 h-6"/>
                        </a>
                    </div>
                ) : (
                    <p className="text-gray-400">Jūsu apstrādātais attēls parādīsies šeit.</p>
                )}
            </div>
          </div>
        </div>
      </main>
       <footer className="text-center mt-12 text-gray-500">
          <p>&copy; {new Date().getFullYear()} Gemini Fona Noņemšanas Rīks. Darbina Google Gemini API.</p>
       </footer>
    </div>
  );
};

export default App;
