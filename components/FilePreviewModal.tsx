import React from 'react';
import { X, Download, ExternalLink, FileText, Smartphone } from 'lucide-react';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, fileUrl, fileName }) => {
    if (!isOpen) return null;

    const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPdf = fileUrl.match(/\.pdf$/i);
    const isVideo = fileUrl.match(/\.(mp4|webm|ogg|mov)$/i);

    return (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center space-x-2 z-[110]">
                <a
                    href={fileUrl}
                    download={fileName}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-all"
                    title="Download"
                >
                    <Download size={24} />
                </a>
                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-all"
                    title="Abrir em nova guia"
                >
                    <ExternalLink size={24} />
                </a>
                <button
                    onClick={onClose}
                    className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-sm transition-all"
                    title="Fechar"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="w-full h-full flex items-center justify-center p-4">
                {isImage ? (
                    <img
                        src={fileUrl}
                        alt={fileName}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-modal-enter"
                    />
                ) : isVideo ? (
                    <video
                        src={fileUrl}
                        controls
                        autoPlay
                        className="max-w-full max-h-full rounded-xl shadow-2xl animate-modal-enter"
                    />
                ) : isPdf ? (
                    <iframe
                        src={fileUrl}
                        title={fileName}
                        className="w-full max-w-5xl h-full bg-white rounded-xl shadow-2xl animate-modal-enter"
                    />
                ) : (
                    <div className="bg-white p-12 rounded-3xl shadow-2xl text-center max-w-sm w-full animate-modal-enter">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <FileText size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{fileName}</h3>
                        <p className="text-slate-500 mb-8">Este tipo de arquivo não pode ser visualizado diretamente.</p>
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
                        >
                            <ExternalLink size={20} />
                            <span>Abrir Arquivo</span>
                        </a>
                    </div>
                )}
            </div>

            {/* Info Overlay at Bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-white text-sm font-medium">
                {fileName}
            </div>
        </div>
    );
};

export default FilePreviewModal;
